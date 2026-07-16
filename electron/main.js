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
      "electron.app.Electron",
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
  const logDir = path.join(getProjectRoot(), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, name);
}

function appendLog(name, message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(getLogPath(name), line, "utf8");
}

function getConfig() {
  const configPath = path.join(getProjectRoot(), "config.json");
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

  const pythonPath = getPythonPath();
  const mainScriptPath = path.join(getProjectRoot(), "main.py");
  appendLog("pitwall-electron.log", `Starting backend: ${pythonPath} ${mainScriptPath}`);

  backendProcess = spawn(pythonPath, [mainScriptPath], {
    cwd: getProjectRoot(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
    },
  });

  let stderr = "";
  backendProcess.stdout.on("data", (chunk) => {
    appendLog("pitwall-backend.log", chunk.toString().trimEnd());
  });

  backendProcess.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderr += text;
    if (stderr.length > 4000) {
      stderr = stderr.slice(-4000);
    }
    appendLog("pitwall-backend.log", text.trimEnd());
  });

  backendProcess.on("exit", (code) => {
    appendLog("pitwall-electron.log", `Backend exited with code ${code ?? "null"}`);
    if (!isQuitting && code !== 0) {
      console.error(`Backend process exited with code ${code}`, stderr);
    }
    backendProcess = null;

    if (!isQuitting && !backendRestartTimer) {
      backendRestartTimer = setTimeout(() => {
        backendRestartTimer = null;
        appendLog("pitwall-electron.log", "Restarting backend after unexpected exit");
        startBackend();
      }, 1000);
    }
  });

  backendProcess.on("error", (error) => {
    appendLog("pitwall-electron.log", `Failed to start backend process: ${error.message}`);
    console.error("Failed to start backend process:", error);
  });

  return () => stderr.trim();
}

function startEventCollector() {
  if (collectorProcess) return;
  // pythonw has no console subsystem, so the background collector never
  // opens Windows Terminal or a Command Prompt window.
  const pythonPath = getWindowlessPythonPath();
  const collectorPath = path.join(getProjectRoot(), "event_collector.py");
  if (!fs.existsSync(collectorPath)) return;
  collectorProcess = spawn(pythonPath, [collectorPath], {
    cwd: getProjectRoot(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  collectorProcess.on("error", (error) => {
    appendLog("pitwall-electron.log", `Failed to start event collector: ${error.message}`);
    collectorProcess = null;
  });
  // The collector deliberately outlives Electron/Pit Wall.
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
    title: "iRacing Pit Wall",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function bootApp() {
  createWindow();
  const loadingHtml = "<body style='margin:0;background:#06080b;color:#edf3f8;font-family:Segoe UI,Tahoma,sans-serif;display:grid;place-items:center;height:100vh;'><div><h2 style='margin:0 0 12px;'>Starting Pit Wall</h2><p style='margin:0;color:#8e9daa;'>Launching telemetry backend and Electron shell...</p></div></body>";
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
      "Unable to start Pit Wall",
      `Electron could not start the backend.\n\n${message}${backendError ? `\n\nBackend error:\n${backendError}` : ""}`
    );
    app.quit();
  }
}

ipcMain.handle("pitwall:restart", () => {
  if (isQuitting) {
    return false;
  }

  appendLog("pitwall-electron.log", "Restart requested from dashboard");
  app.relaunch();
  app.quit();
  return true;
});

app.whenReady().then(() => {
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
