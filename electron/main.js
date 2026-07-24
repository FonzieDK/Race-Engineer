const { app, BrowserWindow, dialog, globalShortcut, ipcMain, screen } = require("electron");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");
const {
  loadWindowState,
  restoreWindowState,
  saveWindowState,
} = require("./window-state");

let mainWindow = null;
const overlayWindows = new Map();
let backendProcess = null;
let isQuitting = false;
let backendRestartTimer = null;
let collectorProcess = null;
let windowStateSaveTimer = null;
const collectorOnly = process.argv.includes("--collector-only");
const MAX_LOG_BYTES = 5 * 1024 * 1024;
const MAX_LOG_BACKUPS = 3;

function getProjectRoot() {
  return path.resolve(__dirname, "..");
}

function getResourceRoot() {
  return app.isPackaged ? process.resourcesPath : getProjectRoot();
}

function getDataRoot() {
  return app.isPackaged ? app.getPath("userData") : getProjectRoot();
}

function ensureUserConfig() {
  const configPath = path.join(getDataRoot(), "config.json");
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.copyFileSync(path.join(getResourceRoot(), "config.json"), configPath);
  }
  return configPath;
}

function getRuntimeEnvironment() {
  return {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    RACE_ENGINEER_RESOURCE_DIR: getResourceRoot(),
    RACE_ENGINEER_DATA_DIR: getDataRoot(),
  };
}

function getPythonRuntime(mode) {
  if (app.isPackaged) {
    return {
      command: path.join(getResourceRoot(), "RaceEngineerRuntime", "RaceEngineerRuntime.exe"),
      args: mode === "collector" ? ["--collector"] : [],
    };
  }

  return {
    command: mode === "collector" ? getWindowlessPythonPath() : getPythonPath(),
    args: ["-m", mode === "collector" ? "race_engineer.events.collector" : "race_engineer.server"],
  };
}

function quoteWindowsCommandArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function registerCollectorAtLogin() {
  const loginArgs = process.defaultApp
    ? [getProjectRoot(), "--collector-only"]
    : ["--collector-only"];
  const command = [process.execPath, ...loginArgs]
    .map(quoteWindowsCommandArg)
    .join(" ");
  const result = spawnSync(
    "reg.exe",
    [
      "ADD",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "/v",
      "RaceEngineerCollector",
      "/t",
      "REG_SZ",
      "/d",
      command,
      "/f",
    ],
    { windowsHide: true, encoding: "utf8" },
  );
  if (result.status !== 0) {
    appendLog(
      "electron.log",
      `Could not register collector startup: ${result.stderr || result.error || "unknown error"}`,
    );
  }
}

function unregisterCollectorAtLogin() {
  spawnSync(
    "reg.exe",
    ["DELETE", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", "RaceEngineerCollector", "/f"],
    { windowsHide: true, encoding: "utf8" },
  );
}

function isCollectorStartupEnabled() {
  return getConfig().start_collector_with_windows === true;
}

function setCollectorStartupEnabled(enabled) {
  const configPath = ensureUserConfig();
  const config = getConfig();
  config.start_collector_with_windows = Boolean(enabled);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  if (process.platform === "win32") {
    if (enabled) registerCollectorAtLogin();
    else unregisterCollectorAtLogin();
  }
  return config.start_collector_with_windows;
}

function getLogPath(name) {
  const logDir = path.join(getDataRoot(), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, name);
}

function appendLog(name, message) {
  const logPath = getLogPath(name);
  try {
    if (fs.existsSync(logPath) && fs.statSync(logPath).size >= MAX_LOG_BYTES) {
      for (let index = MAX_LOG_BACKUPS; index >= 1; index -= 1) {
        const source = index === 1 ? logPath : `${logPath}.${index - 1}`;
        const target = `${logPath}.${index}`;
        if (fs.existsSync(target)) fs.rmSync(target);
        if (fs.existsSync(source)) fs.renameSync(source, target);
      }
    }
  } catch (error) {
    console.error("Unable to rotate Race-Engineer log:", error);
  }
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, line, "utf8");
}

function getConfig() {
  const configPath = ensureUserConfig();
  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw);
}

function getBackendUrl() {
  const config = getConfig();
  const host = !config.host || ["auto", "detect", "0.0.0.0"].includes(String(config.host).toLowerCase())
    ? "127.0.0.1"
    : config.host;
  return `http://${host}:${config.port}`;
}

function getPythonPath() {
  const venvPythonPath = path.join(getProjectRoot(), "venv", "Scripts", "python.exe");

  if (fs.existsSync(venvPythonPath)) {
    return venvPythonPath;
  }

  return "python";
}

function getWindowlessPythonPath() {
  const pythonPath = getPythonPath();
  if (process.platform !== "win32") return pythonPath;
  const pythonwPath = pythonPath.toLowerCase().endsWith("python.exe")
    ? `${pythonPath.slice(0, -"python.exe".length)}pythonw.exe`
    : path.join(path.dirname(pythonPath), "pythonw.exe");
  return fs.existsSync(pythonwPath) ? pythonwPath : pythonPath;
}

function waitForServer(url, timeoutMs = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const request = http.get(`${url}/api/state`, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }
        retryOrFail(new Error(`Backend returned status ${response.statusCode}`));
      });

      request.on("error", (error) => {
        retryOrFail(error);
      });

      request.setTimeout(1500, () => {
        request.destroy(new Error("Backend request timed out"));
      });
    };

    const retryOrFail = (error) => {
      if (Date.now() - startedAt >= timeoutMs) {
        reject(error);
        return;
      }
      setTimeout(tryConnect, 500);
    };

    tryConnect();
  });
}

function stopBackend() {
  if (backendRestartTimer) {
    clearTimeout(backendRestartTimer);
    backendRestartTimer = null;
  }

  if (!backendProcess) {
    return;
  }

  const processToStop = backendProcess;
  backendProcess = null;

  try {
    processToStop.kill();
  } catch (error) {
    console.error("Failed to stop backend process:", error);
  }
}

function startBackend() {
  if (backendProcess) {
    return;
  }

  const runtime = getPythonRuntime("backend");
  appendLog("race-engineer-electron.log", `Starting backend: ${runtime.command} ${runtime.args.join(" ")}`);

  backendProcess = spawn(runtime.command, runtime.args, {
    cwd: getDataRoot(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    env: getRuntimeEnvironment(),
  });

  let stderr = "";
  backendProcess.stdout.on("data", (chunk) => {
    appendLog("race-engineer-backend.log", chunk.toString().trimEnd());
  });

  backendProcess.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderr += text;
    if (stderr.length > 4000) {
      stderr = stderr.slice(-4000);
    }
    appendLog("race-engineer-backend.log", text.trimEnd());
  });

  backendProcess.on("exit", (code) => {
    appendLog("race-engineer-electron.log", `Backend exited with code ${code ?? "null"}`);
    if (!isQuitting && code !== 0) {
      console.error(`Backend process exited with code ${code}`, stderr);
    }
    backendProcess = null;

    if (!isQuitting && !backendRestartTimer) {
      backendRestartTimer = setTimeout(() => {
        backendRestartTimer = null;
        appendLog("race-engineer-electron.log", "Restarting backend after unexpected exit");
        startBackend();
      }, 1000);
    }
  });

  backendProcess.on("error", (error) => {
    appendLog("race-engineer-electron.log", `Failed to start backend process: ${error.message}`);
    console.error("Failed to start backend process:", error);
  });

  return () => stderr.trim();
}

function startEventCollector() {
  if (collectorProcess) return;
  // pythonw has no console subsystem, so the background collector never
  // opens Windows Terminal or a Command Prompt window.
  const runtime = getPythonRuntime("collector");
  if (!fs.existsSync(runtime.command)) return;
  collectorProcess = spawn(runtime.command, runtime.args, {
    cwd: getDataRoot(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: getRuntimeEnvironment(),
  });
  collectorProcess.on("error", (error) => {
    appendLog("race-engineer-electron.log", `Failed to start event collector: ${error.message}`);
    collectorProcess = null;
  });
  // The collector deliberately outlives the Race-Engineer window.
  collectorProcess.unref();
}

function getWindowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function getOverlayStatePath(screenName) {
  return path.join(app.getPath("userData"), `overlay-state-${screenName}.json`);
}

function loadOverlayState(screenName) {
  try {
    const state = JSON.parse(fs.readFileSync(getOverlayStatePath(screenName), "utf8"));
    return state && typeof state === "object" ? state : {};
  } catch (error) {
    if (error.code !== "ENOENT") {
      appendLog("race-engineer-electron.log", `Unable to load overlay state: ${error.message}`);
    }
    return {};
  }
}

function persistOverlayState(screenName) {
  const entry = overlayWindows.get(screenName);
  if (!entry || entry.window.isDestroyed()) return;
  if (entry.saveTimer) clearTimeout(entry.saveTimer);
  entry.saveTimer = null;
  try {
    const bounds = entry.window.getBounds();
    const display = screen.getDisplayMatching(bounds);
    fs.writeFileSync(getOverlayStatePath(screenName), `${JSON.stringify({
      bounds,
      displayId: String(display.id),
      displayWorkArea: display.workArea,
      screen: screenName,
      locked: entry.locked,
      opacity: entry.window.getOpacity(),
    }, null, 2)}\n`, "utf8");
  } catch (error) {
    appendLog("race-engineer-electron.log", `Unable to save overlay state: ${error.message}`);
  }
}

function scheduleOverlayStateSave(screenName) {
  const entry = overlayWindows.get(screenName);
  if (!entry) return;
  if (entry.saveTimer) clearTimeout(entry.saveTimer);
  entry.saveTimer = setTimeout(() => persistOverlayState(screenName), 250);
  entry.saveTimer.unref?.();
}

function setOverlayLocked(screenName, locked) {
  const entry = overlayWindows.get(screenName);
  if (!entry || entry.window.isDestroyed()) return false;
  entry.locked = Boolean(locked);
  // Lock only the window position. The overlay must remain interactive so its
  // controls never become click-through to iRacing.
  entry.window.setMovable(!entry.locked);
  entry.window.webContents.send("race-engineer:overlay-lock-changed", entry.locked);
  scheduleOverlayStateSave(screenName);
  return entry.locked;
}

function getOverlayEntryForEvent(event) {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  return Array.from(overlayWindows.entries()).find(([, entry]) => entry.window === senderWindow) || null;
}

function createOrShowOverlay(screenName) {
  const allowedScreens = new Set(["overview", "leaderboard", "map", "car-setup-pit"]);
  if (!allowedScreens.has(screenName)) return false;
  const existingEntry = overlayWindows.get(screenName);
  if (existingEntry && !existingEntry.window.isDestroyed()) {
    existingEntry.window.show();
    existingEntry.window.focus();
    return true;
  }

  const savedState = loadOverlayState(screenName);
  const restoredState = restoreWindowState(
    savedState.bounds ? { ...savedState, isFullScreen: false, isMaximized: false } : null,
    screen.getAllDisplays(),
    screen.getPrimaryDisplay(),
  );
  const defaultBounds = { width: 900, height: 600 };
  const overlayWindow = new BrowserWindow({
    ...(restoredState.hasSavedBounds ? restoredState.bounds : defaultBounds),
    center: !restoredState.hasSavedBounds,
    minWidth: 420,
    minHeight: 280,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    title: `Race-Engineer Overlay - ${screenName}`,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  const entry = { window: overlayWindow, locked: false, saveTimer: null };
  overlayWindows.set(screenName, entry);
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setMovable(true);
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setOpacity(Math.max(0.35, Math.min(1, Number(savedState.opacity) || 1)));
  overlayWindow.on("move", () => scheduleOverlayStateSave(screenName));
  overlayWindow.on("resize", () => scheduleOverlayStateSave(screenName));
  const sendOverlayFullscreenState = () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(
        "race-engineer:overlay-fullscreen-changed",
        overlayWindow.isFullScreen(),
      );
    }
  };
  overlayWindow.on("enter-full-screen", sendOverlayFullscreenState);
  overlayWindow.on("leave-full-screen", sendOverlayFullscreenState);
  overlayWindow.on("close", () => persistOverlayState(screenName));
  overlayWindow.on("closed", () => {
    overlayWindows.delete(screenName);
  });
  overlayWindow.loadURL(`${getBackendUrl()}/?overlay=${encodeURIComponent(screenName)}`);
  return true;
}

function persistWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
    windowStateSaveTimer = null;
  }

  try {
    const bounds = mainWindow.getNormalBounds();
    const display = screen.getDisplayMatching(bounds);
    saveWindowState(getWindowStatePath(), {
      bounds,
      displayId: String(display.id),
      displayWorkArea: display.workArea,
      isFullScreen: mainWindow.isFullScreen(),
      isMaximized: mainWindow.isMaximized(),
    });
  } catch (error) {
    appendLog("race-engineer-electron.log", `Unable to save window state: ${error.message}`);
  }
}

function scheduleWindowStateSave() {
  if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
  windowStateSaveTimer = setTimeout(persistWindowState, 250);
  windowStateSaveTimer.unref?.();
}

function createWindow() {
  const savedState = loadWindowState(getWindowStatePath());
  const restoredState = restoreWindowState(
    savedState,
    screen.getAllDisplays(),
    screen.getPrimaryDisplay(),
  );
  mainWindow = new BrowserWindow({
    ...restoredState.bounds,
    minWidth: 1180,
    minHeight: 760,
    autoHideMenuBar: true,
    backgroundColor: "#06080b",
    title: "Race-Engineer",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const sendFullscreenState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("race-engineer:fullscreen-changed", mainWindow.isFullScreen());
    }
  };
  mainWindow.on("enter-full-screen", sendFullscreenState);
  mainWindow.on("leave-full-screen", sendFullscreenState);
  mainWindow.on("move", scheduleWindowStateSave);
  mainWindow.on("resize", scheduleWindowStateSave);
  mainWindow.on("maximize", scheduleWindowStateSave);
  mainWindow.on("unmaximize", scheduleWindowStateSave);
  mainWindow.on("enter-full-screen", persistWindowState);
  mainWindow.on("leave-full-screen", persistWindowState);
  mainWindow.on("close", persistWindowState);

  if (restoredState.isMaximized && !restoredState.isFullScreen) {
    mainWindow.maximize();
  }
  if (restoredState.isFullScreen) {
    mainWindow.setFullScreen(true);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    overlayWindows.forEach(({ window }) => {
      if (!window.isDestroyed()) window.close();
    });
  });

}

async function bootApp() {
  createWindow();
  const loadingHtml = "<body style='margin:0;background:#06080b;color:#edf3f8;font-family:Segoe UI,Tahoma,sans-serif;display:grid;place-items:center;height:100vh;'><div><h2 style='margin:0 0 12px;'>Starting Race-Engineer</h2><p style='margin:0;color:#8e9daa;'>Launching telemetry backend and Electron shell...</p></div></body>";
  mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(loadingHtml)}`);

  let getBackendError = null;

  try {
    getBackendError = startBackend();
    const backendUrl = getBackendUrl();
    await waitForServer(backendUrl);
    await mainWindow.loadURL(backendUrl);
  } catch (error) {
    const backendError =
      typeof getBackendError === "function" ? getBackendError() : "";
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox(
      "Unable to start Race-Engineer",
      `Electron could not start the backend.\n\n${message}${backendError ? `\n\nBackend error:\n${backendError}` : ""}`
    );
    app.quit();
  }
}

ipcMain.handle("race-engineer:restart", () => {
  if (isQuitting) {
    return false;
  }

  appendLog("race-engineer-electron.log", "Restart requested from Race-Engineer");
  app.relaunch();
  app.quit();
  return true;
});

ipcMain.handle("race-engineer:toggle-fullscreen", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }

  const shouldEnterFullscreen = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(shouldEnterFullscreen);
  return shouldEnterFullscreen;
});

ipcMain.handle("race-engineer:open-overlay", (_event, screenName) => (
  createOrShowOverlay(String(screenName || ""))
));
ipcMain.handle("race-engineer:set-overlay-locked", (event, locked) => {
  const target = getOverlayEntryForEvent(event);
  return target ? setOverlayLocked(target[0], locked) : false;
});
ipcMain.handle("race-engineer:set-overlay-opacity", (event, opacity) => {
  const target = getOverlayEntryForEvent(event);
  if (!target) return false;
  const [screenName, entry] = target;
  entry.window.setOpacity(Math.max(0.35, Math.min(1, Number(opacity) || 1)));
  scheduleOverlayStateSave(screenName);
  return entry.window.getOpacity();
});
ipcMain.handle("race-engineer:toggle-overlay-fullscreen", (event) => {
  const target = getOverlayEntryForEvent(event);
  if (!target) return false;
  const [screenName, entry] = target;
  const shouldEnterFullscreen = !entry.window.isFullScreen();
  // A frameless window can otherwise retain its locked movement state while
  // fullscreen. Always unlock it first so the toolbar remains interactive.
  if (shouldEnterFullscreen && entry.locked) setOverlayLocked(screenName, false);
  entry.window.setMovable(true);
  entry.window.setFullScreen(shouldEnterFullscreen);
  return shouldEnterFullscreen;
});
ipcMain.handle("race-engineer:close-overlay", (event) => {
  const target = getOverlayEntryForEvent(event);
  if (!target) return false;
  target[1].window.close();
  return true;
});

ipcMain.handle("race-engineer:get-startup-enabled", () => isCollectorStartupEnabled());
ipcMain.handle("race-engineer:set-startup-enabled", (_event, enabled) => (
  setCollectorStartupEnabled(enabled === true)
));

app.whenReady().then(() => {
  app.setAppUserModelId("com.infinxt.raceengineer");
  ensureUserConfig();
  startEventCollector();
  if (process.platform === "win32" && isCollectorStartupEnabled()) {
    registerCollectorAtLogin();
  }
  if (collectorOnly) {
    app.quit();
    return;
  }
  bootApp();
  globalShortcut.register("CommandOrControl+Shift+O", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const target = Array.from(overlayWindows.entries())
      .find(([, entry]) => entry.window === focusedWindow);
    if (target) setOverlayLocked(target[0], !target[1].locked);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      bootApp();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  stopBackend();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
