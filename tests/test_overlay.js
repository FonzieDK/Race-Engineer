const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const main = fs.readFileSync(path.join(root, "electron", "main.js"), "utf8");
const preload = fs.readFileSync(path.join(root, "electron", "preload.js"), "utf8");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");

test("tabs can open their screen in a dedicated overlay window", () => {
  assert.match(script, /tab\.addEventListener\("contextmenu"/);
  assert.match(script, /window\.raceEngineer\?\.openOverlay\?\.\(nextScreen\)/);
  assert.match(preload, /openOverlay: \(screenName\) => ipcRenderer\.invoke\("race-engineer:open-overlay"/);
  assert.match(main, /function createOrShowOverlay\(screenName\)/);
  assert.match(main, /transparent: true/);
  assert.match(main, /alwaysOnTop: true/);
  assert.match(main, /skipTaskbar: true/);
  assert.match(main, /setVisibleOnAllWorkspaces\(true, \{ visibleOnFullScreen: true \}\)/);
  assert.match(main, /const overlayWindows = new Map\(\)/);
  assert.match(main, /const existingEntry = overlayWindows\.get\(screenName\)/);
  assert.match(main, /overlayWindows\.set\(screenName, entry\)/);
});

test("overlay mode displays only the selected dashboard screen", () => {
  assert.match(html, /id="overlay-toolbar"/);
  assert.match(script, /new window\.URLSearchParams\(window\.location\.search\)\.get\("overlay"\)/);
  assert.match(script, /let activeScreen = isOverlayMode \? requestedOverlayScreen : "overview"/);
  assert.match(styles, /html\.overlay-mode,[\s\S]*?background: transparent/);
  assert.match(styles, /\.overlay-mode \.top-frame,[\s\S]*?display: none !important/);
});

test("overlay supports position locking, opacity and recovery shortcut without click-through", () => {
  assert.match(main, /entry\.window\.setMovable\(!entry\.locked\)/);
  assert.doesNotMatch(main, /setIgnoreMouseEvents/);
  assert.match(main, /setOpacity\(Math\.max\(0\.35, Math\.min\(1/);
  assert.match(main, /globalShortcut\.register\("CommandOrControl\+Shift\+O"/);
  assert.match(preload, /setOverlayLocked:/);
  assert.match(preload, /setOverlayOpacity:/);
  assert.match(html, /id="overlay-lock"[^>]*aria-pressed="false"[^>]*>Lock position<\/button>/);
  assert.match(script, /locked \? "Position locked · Ctrl\+Shift\+O" : "Lock position"/);
  assert.match(styles, /#overlay-lock\.is-locked\s*\{/);
});

test("overlay fullscreen control sits immediately before lock and tracks window state", () => {
  assert.match(html, /id="overlay-fullscreen"[^>]*>Fullscreen<\/button>\s*<button id="overlay-lock"/);
  assert.match(main, /ipcMain\.handle\("race-engineer:toggle-overlay-fullscreen"/);
  assert.match(main, /entry\.window\.setFullScreen\(shouldEnterFullscreen\)/);
  assert.match(main, /if \(shouldEnterFullscreen && entry\.locked\) setOverlayLocked\(screenName, false\)/);
  assert.match(main, /overlayWindow\.on\("enter-full-screen", sendOverlayFullscreenState\)/);
  assert.match(preload, /toggleOverlayFullscreen:/);
  assert.match(script, /overlayFullscreenEl\?\.addEventListener\("click"/);
  assert.match(script, /isFullscreen \? "Exit full" : "Fullscreen"/);
  assert.match(script, /event\.key !== "F11"/);
  assert.match(styles, /#overlay-fullscreen\s*\{[^}]*pointer-events: auto;[^}]*-webkit-app-region: no-drag !important/s);
});

test("overlay position, size and preferences are persisted", () => {
  assert.match(main, /`overlay-state-\$\{screenName\}\.json`/);
  assert.match(main, /bounds,\s*displayId:/);
  assert.match(main, /screen: screenName/);
  assert.match(main, /opacity: entry\.window\.getOpacity\(\)/);
  assert.match(main, /overlayWindow\.on\("move", \(\) => scheduleOverlayStateSave\(screenName\)\)/);
  assert.match(main, /overlayWindow\.on\("resize", \(\) => scheduleOverlayStateSave\(screenName\)\)/);
});

test("overlay controls target their own window so all screens can stay open", () => {
  assert.match(main, /function getOverlayEntryForEvent\(event\)/);
  assert.match(main, /BrowserWindow\.fromWebContents\(event\.sender\)/);
  assert.match(main, /ipcMain\.handle\("race-engineer:set-overlay-opacity", \(event, opacity\)/);
  assert.match(main, /ipcMain\.handle\("race-engineer:toggle-overlay-fullscreen", \(event\)/);
  assert.match(main, /ipcMain\.handle\("race-engineer:close-overlay", \(event\)/);
  assert.doesNotMatch(main, /overlay-screen-changed", overlayScreen/);
});
