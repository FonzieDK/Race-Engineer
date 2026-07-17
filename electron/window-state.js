const fs = require("fs");

const DEFAULT_BOUNDS = Object.freeze({ width: 1600, height: 960 });

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidBounds(bounds) {
  return Boolean(
    bounds
      && isFiniteNumber(bounds.x)
      && isFiniteNumber(bounds.y)
      && isFiniteNumber(bounds.width)
      && isFiniteNumber(bounds.height)
      && bounds.width > 0
      && bounds.height > 0
  );
}

function loadWindowState(statePath) {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    if (!isValidBounds(state.bounds)) return null;
    return {
      bounds: state.bounds,
      displayId: state.displayId == null ? null : String(state.displayId),
      displayWorkArea: isValidBounds(state.displayWorkArea) ? state.displayWorkArea : null,
      isFullScreen: Boolean(state.isFullScreen),
      isMaximized: Boolean(state.isMaximized),
    };
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Unable to read saved window state: ${error.message}`);
    }
    return null;
  }
}

function saveWindowState(statePath, state) {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function intersectionArea(first, second) {
  const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x));
  const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y));
  return width * height;
}

function chooseDisplay(state, displays, primaryDisplay) {
  const byId = state?.displayId == null
    ? null
    : displays.find((display) => String(display.id) === String(state.displayId));
  if (byId) return byId;

  if (isValidBounds(state?.bounds)) {
    const overlapping = displays
      .map((display) => ({ display, area: intersectionArea(state.bounds, display.bounds) }))
      .sort((left, right) => right.area - left.area)[0];
    if (overlapping?.area > 0) return overlapping.display;
  }

  return primaryDisplay || displays[0] || null;
}

function clampBoundsToDisplay(bounds, display) {
  if (!display) return bounds;
  const workArea = display.workArea || display.bounds;
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  return {
    x: Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height),
    width,
    height,
  };
}

function restoreWindowState(state, displays, primaryDisplay) {
  if (!state || !isValidBounds(state.bounds)) {
    return { bounds: DEFAULT_BOUNDS, isFullScreen: false, isMaximized: false, hasSavedBounds: false };
  }

  const display = chooseDisplay(state, displays, primaryDisplay);
  let bounds = state.bounds;
  if (
    display
      && state.displayId != null
      && String(display.id) === String(state.displayId)
      && isValidBounds(state.displayWorkArea)
  ) {
    const currentWorkArea = display.workArea || display.bounds;
    bounds = {
      ...bounds,
      x: bounds.x + currentWorkArea.x - state.displayWorkArea.x,
      y: bounds.y + currentWorkArea.y - state.displayWorkArea.y,
    };
  }
  return {
    bounds: clampBoundsToDisplay(bounds, display),
    isFullScreen: state.isFullScreen,
    isMaximized: state.isMaximized,
    hasSavedBounds: true,
  };
}

module.exports = {
  DEFAULT_BOUNDS,
  chooseDisplay,
  clampBoundsToDisplay,
  loadWindowState,
  restoreWindowState,
  saveWindowState,
};
