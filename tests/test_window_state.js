const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  chooseDisplay,
  loadWindowState,
  restoreWindowState,
  saveWindowState,
} = require("../electron/window-state");

const primary = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  workArea: { x: 0, y: 0, width: 1920, height: 1040 },
};
const secondary = {
  id: 2,
  bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
  workArea: { x: 1920, y: 0, width: 2560, height: 1400 },
};

test("restores the saved position on the same display", () => {
  const state = {
    bounds: { x: 2150, y: 120, width: 1600, height: 960 },
    displayId: "2",
    displayWorkArea: secondary.workArea,
    isFullScreen: true,
    isMaximized: false,
  };
  const restored = restoreWindowState(state, [primary, secondary], primary);
  assert.deepEqual(restored.bounds, state.bounds);
  assert.equal(restored.isFullScreen, true);
});

test("moves an off-screen saved window onto the primary display", () => {
  const state = {
    bounds: { x: 5000, y: 200, width: 1600, height: 960 },
    displayId: "99",
    isFullScreen: false,
    isMaximized: false,
  };
  const restored = restoreWindowState(state, [primary], primary);
  assert.deepEqual(restored.bounds, { x: 320, y: 80, width: 1600, height: 960 });
});

test("uses screen overlap if a display id has changed", () => {
  const state = {
    bounds: { x: 2200, y: 100, width: 1200, height: 800 },
    displayId: "old-id",
  };
  assert.equal(chooseDisplay(state, [primary, secondary], primary), secondary);
});

test("keeps the position relative to a display moved by Windows", () => {
  const movedSecondary = {
    ...secondary,
    bounds: { ...secondary.bounds, x: -2560 },
    workArea: { ...secondary.workArea, x: -2560 },
  };
  const state = {
    bounds: { x: 2120, y: 100, width: 1200, height: 800 },
    displayId: "2",
    displayWorkArea: secondary.workArea,
  };
  const restored = restoreWindowState(state, [primary, movedSecondary], primary);
  assert.deepEqual(restored.bounds, { x: -2360, y: 100, width: 1200, height: 800 });
});

test("persists fullscreen, maximized, display and normal bounds", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "race-engineer-window-state-"));
  const statePath = path.join(directory, "window-state.json");
  const state = {
    bounds: { x: 20, y: 30, width: 1400, height: 900 },
    displayId: "1",
    displayWorkArea: primary.workArea,
    isFullScreen: false,
    isMaximized: true,
  };
  saveWindowState(statePath, state);
  assert.deepEqual(loadWindowState(statePath), state);
  fs.rmSync(directory, { recursive: true, force: true });
});
