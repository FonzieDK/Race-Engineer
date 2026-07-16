const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

let mainWindow = null;
let backendProcess = null;
let isQuitting = false;
let backendRestartTimer = null;
let collectorProcess = null;
const collectorOnly = process.argv.includes("--collector-only");

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
    args: [path.join(getProjectRoot(), mode === "collector" ? "event_collector.py" : "main.py")],
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

function getLogPath(name) {
  const logDir = path.join(getDataRoot(), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, name);
}

function appendLog(name, message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(getLogPath(name), line, "utf8");
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
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

  mainWindow.on("closed", () => {
    mainWindow = null;
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

app.whenReady().then(() => {
  app.setAppUserModelId("com.infinxt.raceengineer");
  ensureUserConfig();
  startEventCollector();
  if (process.platform === "win32") {
    registerCollectorAtLogin();
  }
  if (collectorOnly) {
    app.quit();
    return;
  }
  bootApp();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      bootApp();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  stopBackend();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
