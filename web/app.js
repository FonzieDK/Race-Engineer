const refreshRateControls = Array.from(document.querySelectorAll(".refresh-rate-control"));
const refreshRateToggles = Array.from(document.querySelectorAll(".refresh-rate-toggle"));
const refreshRateValues = Array.from(document.querySelectorAll(".refresh-rate-value"));
const refreshRateOptions = Array.from(document.querySelectorAll(".refresh-rate-option"));
const restartPitwallEl = document.getElementById("restart-pitwall");
const sessionTimeEl = document.getElementById("session-time");
const lapsRemainingEl = document.getElementById("laps-remaining");
const pitRoadStatusEl = document.getElementById("pit-road-status");
const fuelLevelEl = document.getElementById("fuel-level");
const fuelUseEl = document.getElementById("fuel-use");
const focusGapEl = document.getElementById("focus-gap");
const inputThrottleEl = document.getElementById("input-throttle");
const inputBrakeEl = document.getElementById("input-brake");
const inputClutchEl = document.getElementById("input-clutch");
const barThrottleEl = document.getElementById("bar-throttle");
const barBrakeEl = document.getElementById("bar-brake");
const barClutchEl = document.getElementById("bar-clutch");
const alertsEl = document.getElementById("alerts");
const carNumberEl = document.getElementById("car-number");
const driverNameEl = document.getElementById("driver-name");
const carNameEl = document.getElementById("car-name");
const positionEl = document.getElementById("position");
const classPositionEl = document.getElementById("class-position");
const lapsCompletedEl = document.getElementById("laps-completed");
const lapProgressEl = document.getElementById("lap-progress");
const focusGearEl = document.getElementById("focus-gear");
const focusRpmEl = document.getElementById("focus-rpm");
const speedKphEl = document.getElementById("speed-kph");
const tireLfEl = document.getElementById("tire-lf");
const tireRfEl = document.getElementById("tire-rf");
const tireLrEl = document.getElementById("tire-lr");
const tireRrEl = document.getElementById("tire-rr");
const lapTimeEl = document.getElementById("lap-time");
const bestLapEl = document.getElementById("best-lap");
const tireCompoundEl = document.getElementById("tire-compound");
const fastRepairsEl = document.getElementById("fast-repairs");
const steeringAngleEl = document.getElementById("steering-angle");
const sessionTrackNameEl = document.getElementById("session-track-name");
const windSpeedEl = document.getElementById("wind-speed");
const humidityEl = document.getElementById("humidity");
const windDirectionEl = document.getElementById("wind-direction");
const airTempEl = document.getElementById("air-temp");
const trackTempEl = document.getElementById("track-temp");
const trackWetnessEl = document.getElementById("track-wetness");
const trackSkiesEl = document.getElementById("track-skies");
const trackDeclaredWetEl = document.getElementById("track-declared-wet");
const weatherLiveStatusEl = document.getElementById("weather-live-status");
const mapWatchingEl = document.getElementById("map-watching");
const leaderboardListEl = document.getElementById("leaderboard-list");
const leaderboardClassFiltersEl = document.getElementById("leaderboard-class-filters");
const mapClassFiltersEl = document.getElementById("map-class-filters");
const switchTrackMapEl = document.getElementById("switch-track-map");
const primaryMapTitleEl = document.querySelector(".pit-exit-head span");
const secondaryMapTitleEl = document.getElementById("secondary-map-title");
const leaderboardLiveCountEl = document.getElementById("leaderboard-live-count");
const leaderboardCurrentLapEl = document.getElementById("leaderboard-current-lap");
const leaderboardPositionEl = document.getElementById("leaderboard-position");
const leaderboardLastLapEl = document.getElementById("leaderboard-last-lap");
const leaderboardBestLapEl = document.getElementById("leaderboard-best-lap");
const leaderboardEventFiltersEl = document.getElementById("leaderboard-event-filters");
const leaderboardEventsListEl = document.getElementById("leaderboard-events-list");
const leaderboardWatchingDriverEl = document.getElementById("leaderboard-watching-driver");
const leaderboardWatchingNumberEl = document.getElementById("leaderboard-watching-number");
const sessionNoticeEl = document.getElementById("session-notice");
const awaitingDataEl = document.getElementById("awaiting-data");
let currentTrackName = null;
const trackGeometryCache = new WeakMap();
const followMapStateCache = new WeakMap();

function setText(element, value) {
  if (element && element.textContent !== String(value)) {
    element.textContent = value;
  }
}

function fitTrackMapToContent(svg) {
  const trackPath = svg?.querySelector?.("#track-path");
  if (!trackPath || typeof trackPath.getBBox !== "function") return;

  try {
    const box = trackPath.getBBox();
    if (!(box.width > 0 && box.height > 0)) return;

    // Fit from the actual circuit path instead of the complete iRacing layers,
    // which can contain invisible full-canvas elements. The gutter leaves room
    // for corner labels and car markers without retaining the source margins.
    const padding = Math.max(box.width, box.height) * 0.055;
    svg.setAttribute(
      "viewBox",
      `${box.x - padding} ${box.y - padding} ${box.width + padding * 2} ${box.height + padding * 2}`,
    );
  } catch (_) {
    // A hidden map has no measurable box; it is fitted when its screen opens.
  }
}

function formatTireType(compound) {
  if (compound == null || compound === "") return "--";

  const label = String(compound).trim().toUpperCase();
  if (label === "DRY" || label === "WET") return label;

  const value = Number(compound);
  if (value === 0) return "DRY";
  if (value === 1) return "WET";
  return "--";
}

function loadTrackSvg() {
  return fetch("/api/track-svg", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) return null;
      return res.text();
    })
    .then((svgText) => {
      if (!svgText) return null;
      const el = document.getElementById("track-map");
      if (!el) return null;
      // Replace the existing SVG with the fetched SVG markup
      try {
        el.outerHTML = svgText;
      } catch (err) {
        // Fallback: set innerHTML if outerHTML fails
        el.innerHTML = svgText;
      }
      fitTrackMapToContent(document.getElementById("track-map"));
      arrangeTrackMaps();
      syncPitExitMapLayers();

      // The SVG arrives independently of telemetry. Re-render immediately so
      // a paused replay (or any other quiet telemetry source) does not leave
      // the follow-map layers at their raw, uncentred SVG coordinates.
      if (latestSnapshot) {
        const telemetry = latestSnapshot.telemetry || {};
        renderTrackMap(
          telemetry.track_map || null,
          telemetry.player_inputs?.speed_ms,
          telemetry.pit_exit_prediction || null,
        );
      }
      return svgText;
    })
    .catch(() => null);
}
const trackNameEl = document.getElementById("track-name");

const tabs = Array.from(document.querySelectorAll(".tab"));
const screens = Array.from(document.querySelectorAll(".screen"));

let activeScreen = "leaderboard";
let isLoadingState = false;
let isUpdatingRefreshRate = false;
let refreshTimer = null;
let currentRefreshMs = 100;
let stream = null;
let streamConnected = false;
let pendingSnapshot = null;
let renderFrame = null;
let latestSnapshot = null;
let latestMapTelemetry = {};
let mapRenderFrame = null;
let lastMapFrameAt = 0;
let lastHeavyRenderAt = 0;
let countdownTimer = null;
let sessionTimeRemainBase = null;
let sessionTimeRemainReceivedAt = null;
let lastSnapshotAt = 0;
let leaderboardClassFilter = "all";
let mapClassFilter = "all";
let leaderboardEventFilter = "all";
let latestStandings = [];
let leaderboardEvents = [];
let currentEventSessionKey = null;
let leaderboardEventsEnabled = false;
let eventLoadInFlight = false;
let lastEventLoadAt = 0;
let classFilterSignature = "";
let mapClassFilterSignature = null;
let largeTrackMapIndex = 0;
let lastEventRenderSignature = "";
let lastAlertsSignature = "";
let lastSessionNoticeSignature = "";
let lastShownRefreshHz = null;
let lastConnectionSignature = "";
let replayTimingAnchor = null;

const HEAVY_RENDER_INTERVAL_MS = 100;
const MAP_RENDER_INTERVAL_MS = 1000 / 60;
const LEADERBOARD_POSITION_ANIMATION_MS = 520;
const FOLLOW_MAP_ROAD_INTERVAL_MS = 50;
const VIEWED_EVENTS_STORAGE_KEY = "pitwall.viewed-events.v1";
const SAVED_EVENTS_STORAGE_KEY = "pitwall.saved-events.v1";

const TRACK_MAP_LABELS = {
  "track-map": "Track Map",
  "pit-exit-map": "Pit Exit Prediction",
  "follow-map": "Dynamic Map",
};

function arrangeTrackMaps() {
  const mainStageEl = document.querySelector(".trackmap-stage");
  const primaryStageEl = document.querySelector(".pit-exit-map-stage");
  const secondaryStageEl = document.querySelector(".dynamic-map-stage");
  const maps = {
    track: document.getElementById("track-map"),
    pit: document.getElementById("pit-exit-map"),
    follow: document.getElementById("follow-map"),
  };
  if (!mainStageEl || !primaryStageEl || !secondaryStageEl || Object.values(maps).some((map) => !map)) {
    return;
  }

  // Keep the two compact slots useful while the selected view occupies the
  // large stage. The pit map stays in the primary card whenever it is not large,
  // so its traffic summary remains attached to the right map.
  const layouts = [
    { main: maps.track, primary: maps.pit, secondary: maps.follow },
    { main: maps.pit, primary: maps.track, secondary: maps.follow },
    { main: maps.follow, primary: maps.pit, secondary: maps.track },
  ];
  const layout = layouts[largeTrackMapIndex] || layouts[0];
  mainStageEl.appendChild(layout.main);
  primaryStageEl.appendChild(layout.primary);
  secondaryStageEl.appendChild(layout.secondary);

  const mainLabel = TRACK_MAP_LABELS[layout.main.id];
  setText(primaryMapTitleEl, TRACK_MAP_LABELS[layout.primary.id]);
  setText(secondaryMapTitleEl, TRACK_MAP_LABELS[layout.secondary.id]);
  mainStageEl.setAttribute("aria-label", `${mainLabel} – stor visning`);

  const nextLayout = layouts[(largeTrackMapIndex + 1) % layouts.length];
  const nextLabel = TRACK_MAP_LABELS[nextLayout.main.id];
  if (switchTrackMapEl) {
    switchTrackMapEl.setAttribute("aria-label", `Vis ${nextLabel} i det store kort`);
    switchTrackMapEl.setAttribute("title", `Skift til ${nextLabel}`);
  }
}

switchTrackMapEl?.addEventListener("click", () => {
  largeTrackMapIndex = (largeTrackMapIndex + 1) % 3;
  arrangeTrackMaps();
});

function loadViewedEventKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem(VIEWED_EVENTS_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch (_) {
    return new Set();
  }
}

const viewedEventKeys = loadViewedEventKeys();
const savedEventKeys = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_EVENTS_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch (_) {
    return new Set();
  }
})();

function viewedEventKey(event) {
  return event?.id && event?.sessionKey ? `${event.sessionKey}::${event.id}` : null;
}

function isEventViewed(event) {
  const key = viewedEventKey(event);
  return Boolean(key && viewedEventKeys.has(key));
}

function syncEventGroupViewed(group, event) {
  group?.classList.toggle("is-viewed", isEventViewed(event));
}

function isEventSaved(event) {
  const key = viewedEventKey(event);
  return Boolean(key && savedEventKeys.has(key));
}

function syncEventGroupSaved(group, event) {
  const isSaved = isEventSaved(event);
  // Saving is independent of the viewed indicator. Only the save button may
  // change here; the lamp is controlled exclusively by syncEventGroupViewed.
  const saveButton = group?.querySelector(".event-group-save");
  saveButton?.classList.toggle("is-saved", isSaved);
  saveButton?.setAttribute("aria-pressed", String(isSaved));
  saveButton?.setAttribute("aria-label", isSaved ? "Remove saved event" : "Save event");
  if (saveButton) saveButton.title = isSaved ? "Remove from Saved" : "Save event";
}

function markEventViewed(event, button) {
  const key = viewedEventKey(event);
  if (!key) return;
  viewedEventKeys.add(key);
  try {
    localStorage.setItem(
      VIEWED_EVENTS_STORAGE_KEY,
      JSON.stringify(Array.from(viewedEventKeys).slice(-500)),
    );
  } catch (_) {
    // The indicator still turns off for this page load if storage is blocked.
  }
  syncEventGroupViewed(button?.closest(".event-group"), event);
}

function toggleEventSaved(event, button) {
  const key = viewedEventKey(event);
  if (!key) return;
  if (savedEventKeys.has(key)) {
    savedEventKeys.delete(key);
  } else {
    savedEventKeys.add(key);
  }
  try {
    localStorage.setItem(
      SAVED_EVENTS_STORAGE_KEY,
      JSON.stringify(Array.from(savedEventKeys).slice(-500)),
    );
  } catch (_) {
    // Saving still works for this page load if storage is blocked.
  }
  syncEventGroupSaved(button?.closest(".event-group"), event);
  if (leaderboardEventFilter === "saved") {
    lastEventRenderSignature = "";
    renderLeaderboardEvents();
  }
}

function hasUsableTelemetry(telemetry) {
  return Boolean(
    telemetry && (
      telemetry.driver_name ||
      telemetry.car_name ||
      telemetry.track_name ||
      telemetry.position != null ||
      telemetry.focus_gear != null ||
      telemetry.focus_rpm != null
    )
  );
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const nextScreen = tab.dataset.screen;
    if (nextScreen) {
      setActiveScreen(nextScreen);
    }
  });
});

function setRefreshRateMenuOpen(control, isOpen) {
  if (!control) return;
  if (isOpen) {
    refreshRateControls.forEach((candidate) => {
      if (candidate !== control) setRefreshRateMenuOpen(candidate, false);
    });
  }
  control.querySelector(".refresh-rate-toggle")
    ?.setAttribute("aria-expanded", String(isOpen));
  control.querySelector(".refresh-rate-menu")
    ?.setAttribute("aria-hidden", String(!isOpen));
  control.classList.toggle("is-open", isOpen);
}

function showRefreshRate(hz) {
  if (hz === lastShownRefreshHz) return;
  lastShownRefreshHz = hz;
  refreshRateValues.forEach((value) => { value.textContent = `${hz} Hz`; });
  refreshRateControls.forEach((control) => { control.dataset.savedValue = String(hz); });
  refreshRateOptions.forEach((option) => {
    const isSelected = Number(option.dataset.hz) === hz;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });
}

refreshRateToggles.forEach((toggle) => toggle.addEventListener("click", () => {
  const control = toggle.closest(".refresh-rate-control");
  setRefreshRateMenuOpen(control, toggle.getAttribute("aria-expanded") !== "true");
}));

refreshRateOptions.forEach((option) => option.addEventListener("click", async () => {
  const control = option.closest(".refresh-rate-control");
  const toggle = control?.querySelector(".refresh-rate-toggle");
  const previousValue = Number(control?.dataset.savedValue || 30);
  const hz = Number(option.dataset.hz);
  setRefreshRateMenuOpen(control, false);
  toggle?.focus();
  if (hz === previousValue) return;

  isUpdatingRefreshRate = true;
  refreshRateToggles.forEach((candidate) => { candidate.disabled = true; });
  showRefreshRate(hz);

  try {
    const response = await fetch("/api/refresh-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hz }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    await loadState();
  } catch (error) {
    showRefreshRate(previousValue);
    console.error("Unable to change refresh rate", error);
  } finally {
    isUpdatingRefreshRate = false;
    refreshRateToggles.forEach((candidate) => { candidate.disabled = false; });
  }
}));

document.addEventListener("click", (event) => {
  refreshRateControls.forEach((control) => {
    if (!control.contains(event.target)) setRefreshRateMenuOpen(control, false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const openControl = refreshRateControls.find((control) => control.classList.contains("is-open"));
    refreshRateControls.forEach((control) => setRefreshRateMenuOpen(control, false));
    openControl?.querySelector(".refresh-rate-toggle")?.focus();
  }
});

restartPitwallEl?.addEventListener("click", async () => {
  if (restartPitwallEl.disabled) return;

  restartPitwallEl.disabled = true;
  restartPitwallEl.classList.add("is-restarting");
  restartPitwallEl.querySelector("span").textContent = "Restarting";

  if (window.pitwall?.restartApp) {
    try {
      await window.pitwall.restartApp();
      return;
    } catch (error) {
      // Fall through to a page reload when Electron IPC is unavailable.
    }
  }

  window.location.reload();
});

function setActiveScreen(screenName) {
  activeScreen = screenName;

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.screen === screenName);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("is-visible", screen.dataset.screenPanel === screenName);
  });

  if (latestSnapshot) {
    const telemetry = latestSnapshot.telemetry || {};
    if (screenName === "leaderboard") {
      renderLeaderboard(telemetry.standings || []);
      renderLeaderboardEvents();
    } else if (screenName === "map") {
      fitTrackMapToContent(document.getElementById("track-map"));
      syncPitExitMapLayers();
      renderMapClassFilters(telemetry.standings || []);
    }
  }

  if (screenName === "map") {
    lastMapFrameAt = 0;
    scheduleTrackMapFrame();
  }
}

function formatNumber(value, digits = 1, fallback = "--") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return value.toFixed(digits);
}

function formatWeatherSummary(weather) {
  if (!weather || typeof weather !== "object") {
    return "--";
  }

  const parts = [];
  if (weather.weather_type) {
    parts.push(weather.weather_type);
  }
  if (typeof weather.air_temp === "number") {
    parts.push(`Air ${Math.round(weather.air_temp)}°C`);
  }
  if (typeof weather.track_temp === "number") {
    parts.push(`Track ${Math.round(weather.track_temp)}°C`);
  }
  if (typeof weather.humidity === "number") {
    parts.push(`${Math.round(weather.humidity)}% RH`);
  }
  if (typeof weather.wind_speed === "number") {
    parts.push(`${formatNumber(weather.wind_speed, 1)} m/s`);
  }
  if (typeof weather.wind_direction === "number") {
    parts.push(`Dir ${Math.round(weather.wind_direction)}°`);
  }
  if (weather.rain_state) {
    parts.push(weather.rain_state);
  }

  if (parts.length === 0) {
    return "--";
  }
  return parts.join(" · ");
}

function formatWindDirection(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  const deg = ((value % 360) + 360) % 360;
  const compass = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(deg / 22.5) % 16;
  return `${Math.round(deg)}° ${compass[index]}`;
}

function formatTrackWetness(value) {
  const states = ["UNKNOWN", "DRY", "MOSTLY DRY", "VERY LIGHTLY WET", "LIGHTLY WET", "MODERATELY WET", "VERY WET", "EXTREMELY WET"];
  return Number.isInteger(value) && states[value] ? states[value] : "--";
}

function formatSkies(value) {
  const states = ["CLEAR", "PARTLY CLOUDY", "MOSTLY CLOUDY", "OVERCAST"];
  return Number.isInteger(value) && states[value] ? states[value] : "--";
}

function formatInteger(value, fallback = "--") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.round(value).toString();
}

function formatRaceLapCount(currentLap, totalLaps) {
  if (
    typeof currentLap !== "number"
    || Number.isNaN(currentLap)
    || typeof totalLaps !== "number"
    || Number.isNaN(totalLaps)
  ) {
    return "--";
  }
  return `${Math.round(currentLap)} / ${Math.round(totalLaps)}`;
}

function formatSeconds(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "--";
  }
  return formatRaceTime(value);
}

function formatRaceTime(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  const totalHundredths = Math.round(value * 100);
  const minutes = Math.floor(totalHundredths / 6000);
  const seconds = Math.floor((totalHundredths % 6000) / 100);
  const hundredths = totalHundredths % 100;

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
  }

  return `${seconds}.${String(hundredths).padStart(2, "0")}`;
}

function formatGap(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  if (value <= 0) {
    return "0.00";
  }

  return formatRaceTime(value);
}

function formatInterval(entry) {
  const lapDifference = Number(entry.interval_laps_ahead);
  if (Number.isFinite(lapDifference) && lapDifference > 0) {
    return formatLapDifference(lapDifference);
  }
  return formatGap(entry.interval_ahead);
}

function formatLapDifference(value) {
  const laps = Math.trunc(Number(value));
  if (!Number.isFinite(laps) || laps < 1) {
    return "--";
  }
  return `${laps} ${laps === 1 ? "lap" : "laps"}`;
}

function formatClassGap(entry) {
  const lapDifference = Number(entry.class_gap_laps);
  if (Number.isFinite(lapDifference) && lapDifference > 0) {
    return formatLapDifference(lapDifference);
  }
  return formatGap(entry.class_gap);
}

function formatPitTime(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return formatRaceTime(value);
}

function formatLapsSincePit(entry) {
  if (entry.laps_since_pit === null || entry.laps_since_pit === undefined) {
    return "--";
  }
  const laps = Number(entry.laps_since_pit);
  if (!Number.isFinite(laps) || laps < 0) {
    return "--";
  }
  return `${Math.floor(laps)} ${Math.floor(laps) === 1 ? "lap" : "laps"}`;
}

function formatClass(entry) {
  if (entry.class_name && entry.class_name !== "--") {
    return entry.class_name;
  }
  if (entry.class_id !== undefined && entry.class_id !== null && entry.class_id !== "") {
    return `Class ${entry.class_id}`;
  }
  return "Unknown";
}

function getClassKey(entry) {
  // Use the displayed class name as the filter identity. iRacing can expose
  // different class IDs with the same short name; keying on the ID produced
  // duplicate, indistinguishable buttons (for example two "GT3" filters).
  return formatClass(entry).trim().toLowerCase();
}

function getClassColor(entry) {
  const name = formatClass(entry).toUpperCase();
  if (name.includes("GTP")) return "#ffd400";
  if (name.includes("LMP")) return "#ffd900";
  if (name.includes("GT3")) return "#00a9ff";
  if (name.includes("GT4")) return "#9b5de5";
  return "#168a9c";
}

function getClassTextColor(entry) {
  const name = formatClass(entry).toUpperCase();
  return name.includes("GTP") || name.includes("GT3") ? "#000000" : "#ffffff";
}

function getCarStatus(entry) {
  const statuses = {
    retired: { label: "RET", className: "is-retired" },
    garage: { label: "GARAGE", className: "is-garage" },
    pit: { label: "PIT ROAD", className: "is-pit" },
    track: { label: "ON TRACK", className: "is-track" },
  };
  return statuses[entry.car_status]
    || (entry.is_on_pit_road ? statuses.pit : statuses.track);
}

function formatClock(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return "--";
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function updateTimeRemainingDisplay() {
  if (
    typeof sessionTimeRemainBase !== "number"
    || typeof sessionTimeRemainReceivedAt !== "number"
  ) {
    setText(sessionTimeEl, "--");
    return;
  }

  const elapsedSeconds = (Date.now() - sessionTimeRemainReceivedAt) / 1000;
  setText(sessionTimeEl, formatClock(Math.max(0, sessionTimeRemainBase - elapsedSeconds)));
}

function setTimeRemainingCountdown(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value >= 30000000) {
    sessionTimeRemainBase = null;
    sessionTimeRemainReceivedAt = null;
    updateTimeRemainingDisplay();
    return;
  }

  sessionTimeRemainBase = value;
  sessionTimeRemainReceivedAt = Date.now();
  updateTimeRemainingDisplay();

  if (!countdownTimer) {
    countdownTimer = setInterval(updateTimeRemainingDisplay, 1000);
  }
}

function formatPercent(value, digits = 1) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toFixed(digits)}%`;
}

function formatKph(speedMs) {
  if (typeof speedMs !== "number" || Number.isNaN(speedMs)) {
    return "--";
  }
  return Math.round(speedMs * 3.6).toString();
}

function formatInput(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  return `${Math.round(value * 100)}%`;
}

function formatGear(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  if (value === -1) {
    return "R";
  }
  if (value === 0) {
    return "N";
  }
  return `${value}`;
}

function setBar(element, value) {
  const width = typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value * 100))
    : 0;
  const nextWidth = `${width}%`;
  if (element.style.width !== nextWidth) {
    element.style.width = nextWidth;
  }
}

function renderAlerts(alerts) {
  const signature = JSON.stringify(alerts || []);
  if (signature === lastAlertsSignature) return;
  lastAlertsSignature = signature;
  alertsEl.innerHTML = "";

  if (!alerts || alerts.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No active strategy alerts.";
    alertsEl.appendChild(item);
    return;
  }

  alerts.forEach((alert) => {
    const item = document.createElement("li");
    item.textContent = alert;
    alertsEl.appendChild(item);
  });
}

function updateConnection(connected, error, hasRecentTelemetry = false) {
  const signature = `${connected}|${error || ""}|${hasRecentTelemetry}`;
  if (signature === lastConnectionSignature) return;
  lastConnectionSignature = signature;

  if (connected && hasRecentTelemetry) {
    awaitingDataEl?.classList.add("is-hidden");
    return;
  }

  if (connected) {
    awaitingDataEl?.classList.remove("is-hidden");
    return;
  }

  if (hasRecentTelemetry) {
    awaitingDataEl?.classList.add("is-hidden");
  } else {
    awaitingDataEl?.classList.remove("is-hidden");
  }
}

function getLeaderboardRowKey(entry) {
  if (entry.car_idx != null) return `car-idx-${entry.car_idx}`;
  if (entry.car_number != null) return `car-number-${entry.car_number}`;
  return `driver-${entry.driver_name || "unknown"}`;
}

const CAR_BRANDS = [
  { key: "astonmartin", label: "Aston Martin", markers: ["ASTON MARTIN"] },
  { key: "mercedes", label: "Mercedes-AMG", markers: ["MERCEDES", "AMG GT3"] },
  { key: "lamborghini", label: "Lamborghini", markers: ["LAMBORGHINI", "HURACAN"] },
  { key: "chevrolet", label: "Chevrolet", markers: ["CHEVROLET", "CORVETTE"] },
  { key: "cadillac", label: "Cadillac", markers: ["CADILLAC", "V-SERIES.R"] },
  { key: "mclaren", label: "McLaren", markers: ["MCLAREN"] },
  { key: "porsche", label: "Porsche", markers: ["PORSCHE"] },
  { key: "ferrari", label: "Ferrari", markers: ["FERRARI"] },
  { key: "acura", label: "Acura", markers: ["ACURA", "ARX-06", "NSX"] },
  { key: "audi", label: "Audi", markers: ["AUDI"] },
  { key: "ford", label: "Ford", markers: ["FORD", "MUSTANG"] },
  { key: "bmw", label: "BMW", markers: ["BMW", "M HYBRID V8"] },
];

function renderCarBrandLogo(carName) {
  const normalizedName = String(carName || "").toUpperCase();
  const brand = CAR_BRANDS.find(({ markers }) => markers.some((marker) => normalizedName.includes(marker)));
  if (!brand) return '<span class="car-brand-fallback" aria-label="Unknown brand">?</span>';

  const logoPath = window.CAR_BRAND_LOGOS?.[brand.key] || window.CAR_BRAND_LOGOS_EXTRA?.[brand.key];
  if (!logoPath) return `<span class="car-brand-fallback" aria-label="${brand.label}">${brand.label.slice(0, 3)}</span>`;

  return `
    <span class="car-brand-logo" title="${brand.label}" aria-label="${brand.label}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${logoPath}"></path></svg>
    </span>
  `;
}

function updateLeaderboardRow(row, entry, fallbackClassPosition) {
  const className = formatClass(entry);
  const normalizedClassName = className.toUpperCase();
  const isGt3 = normalizedClassName.includes("GT3");
  const isGtp = normalizedClassName.includes("GTP");
  const classPlateType = isGt3 ? " is-gt3" : isGtp ? " is-gtp" : "";
  const nextClassName = `leaderboard-row${entry.focused ? " is-focused" : ""}`;
  if (row.className !== nextClassName) row.className = nextClassName;
  if (!row.hasAttribute("role")) {
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
  }
  const ariaLabel = `Focus car ${entry.car_number ?? ""}`;
  if (row.getAttribute("aria-label") !== ariaLabel) row.setAttribute("aria-label", ariaLabel);
  row.dataset.carKey = getLeaderboardRowKey(entry);
  row.dataset.carNumber = entry.car_number ?? "";
  const status = getCarStatus(entry);
  const reportedClassPosition = Number(entry.class_position);
  const classPosition = Number.isFinite(reportedClassPosition) && reportedClassPosition > 0
    ? reportedClassPosition
    : fallbackClassPosition;
  const values = {
    classPosition: classPosition > 0 ? classPosition : "--",
    className,
    classPlateType,
    classColor: getClassColor(entry),
    classTextColor: getClassTextColor(entry),
    carNumber: entry.car_number ?? "--",
    carName: entry.car_name,
    teamName: entry.team_name || "--",
    driverName: entry.driver_name ?? "Unknown driver",
    classGap: formatClassGap(entry),
    interval: formatInterval(entry),
    lastLap: formatSeconds(entry.lap_time),
    bestLap: formatSeconds(entry.best_lap_time),
    lapsCompleted: entry.laps_completed ?? "--",
    lapsSincePit: formatLapsSincePit(entry),
    pitDuration: formatPitTime(entry.pit_duration),
    tireType: formatTireType(entry.tire_compound),
    statusClass: status.className,
    statusLabel: status.label,
  };
  const renderSignature = JSON.stringify(values);
  if (row.dataset.renderSignature === renderSignature) return;
  row.dataset.renderSignature = renderSignature;
  row.innerHTML = `
      <span>${values.classPosition}</span>
      <span><b class="class-chip${values.classPlateType}" style="--class-color:${values.classColor};--class-text-color:${values.classTextColor}"><span class="class-chip-name">${values.className}</span></b></span>
      <span class="car-number-cell">#${values.carNumber}</span>
      <span class="car-brand-cell">${renderCarBrandLogo(values.carName)}</span>
      <span class="team-cell">${values.teamName}</span>
      <span class="driver-cell">${values.driverName}</span>
      <span>${values.classGap}</span>
      <span>${values.interval}</span>
      <span class="last-lap-cell">${values.lastLap}</span>
      <span class="best-lap-cell">${values.bestLap}</span>
      <span>${values.lapsCompleted}</span>
      <span>${values.lapsSincePit}</span>
      <span>${values.pitDuration}</span>
      <span class="tire-cell">${values.tireType}</span>
      <span><b class="car-status ${values.statusClass}">${values.statusLabel}</b></span>
    `;
}

function createLeaderboardRow() {
  const row = document.createElement("div");
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusCamera(row.dataset.carNumber);
    }
  });
  return row;
}

function animateLeaderboardPositionChanges(previousTops, rows) {
  if (!previousTops.size || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  rows.forEach((row) => {
    const previousTop = previousTops.get(row.dataset.carKey);
    if (previousTop == null) return;

    // Stop a previous position animation only after its current visual position
    // has been captured, so rapid overtakes remain continuous.
    row.getAnimations().forEach((animation) => animation.cancel());
    const offsetY = previousTop - row.getBoundingClientRect().top;
    if (Math.abs(offsetY) < 1) return;

    row.classList.add("is-changing-position");
    const animation = row.animate(
      [
        { transform: `translate3d(0, ${offsetY}px, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ],
      {
        duration: LEADERBOARD_POSITION_ANIMATION_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
    const clearAnimationState = () => row.classList.remove("is-changing-position");
    animation.addEventListener("finish", clearAnimationState, { once: true });
    animation.addEventListener("cancel", clearAnimationState, { once: true });
  });
}

// The leaderboard is rebuilt many times per second. Listening on its stable
// container at pointer-down time ensures the selected row cannot disappear
// between mouse-down and click while fresh telemetry is being rendered.
leaderboardListEl?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const row = event.target.closest?.(".leaderboard-row[data-car-number]");
  if (!row) return;
  focusCamera(row.dataset.carNumber);
});

function getClassFilterItems(standings) {
  const classes = [];
  const seen = new Set();
  standings.forEach((entry) => {
    const key = getClassKey(entry);
    if (!seen.has(key)) {
      seen.add(key);
      classes.push({
        key,
        name: formatClass(entry),
        color: getClassColor(entry),
        textColor: getClassTextColor(entry),
      });
    }
  });

  return { classes, seen };
}

function renderClassFilters(standings) {
  const { classes, seen } = getClassFilterItems(standings);

  const signature = classes.map((item) => `${item.key}:${item.name}`).join("|");
  if (signature === classFilterSignature) return;
  classFilterSignature = signature;

  if (leaderboardClassFilter !== "all" && !seen.has(leaderboardClassFilter)) {
    leaderboardClassFilter = "all";
  }
  leaderboardClassFiltersEl.innerHTML = "";
  [{ key: "all", name: "All" }, ...classes].forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `leaderboard-filter class-filter${leaderboardClassFilter === item.key ? " is-active" : ""}`;
    button.dataset.classFilter = item.key;
    button.style.setProperty("--class-color", item.color || "#8dbd18");
    button.style.setProperty("--class-text-color", item.textColor || "#020609");

    const name = document.createElement("span");
    const detail = document.createElement("small");
    name.className = "class-filter-plate-name";
    detail.className = "class-filter-plate-detail";
    name.textContent = item.name;
    detail.textContent = item.key === "all" ? "CLASS" : item.key === "gtp" ? "HYPERCAR" : item.key === "gt3" ? "GT CLASS" : "CLASS";
    button.append(name, detail);
    button.addEventListener("click", () => {
      leaderboardClassFilter = item.key;
      leaderboardClassFiltersEl.querySelectorAll("button").forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === button);
      });
      renderLeaderboard(latestStandings);
    });
    leaderboardClassFiltersEl.appendChild(button);
  });
}

function renderMapClassFilters(standings) {
  if (!mapClassFiltersEl) return;
  const { classes, seen } = getClassFilterItems(standings);
  const signature = classes.map((item) => `${item.key}:${item.name}`).join("|");
  if (signature === mapClassFilterSignature) return;
  mapClassFilterSignature = signature;

  if (mapClassFilter !== "all" && !seen.has(mapClassFilter)) {
    mapClassFilter = "all";
  }

  mapClassFiltersEl.innerHTML = "";
  [{ key: "all", name: "All" }, ...classes].forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `leaderboard-filter class-filter${mapClassFilter === item.key ? " is-active" : ""}`;
    button.dataset.classFilter = item.key;
    button.style.setProperty("--class-color", item.color || "#8dbd18");
    button.style.setProperty("--class-text-color", item.textColor || "#020609");

    const name = document.createElement("span");
    const detail = document.createElement("small");
    name.className = "class-filter-plate-name";
    detail.className = "class-filter-plate-detail";
    name.textContent = item.name;
    detail.textContent = item.key === "all" ? "CLASS" : item.key === "gtp" ? "HYPERCAR" : item.key === "gt3" ? "GT CLASS" : "CLASS";
    button.append(name, detail);
    button.addEventListener("click", () => {
      mapClassFilter = item.key;
      mapClassFiltersEl.querySelectorAll("button").forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === button);
      });
      const telemetry = latestSnapshot?.telemetry || {};
      renderTrackMap(
        telemetry.track_map || null,
        telemetry.player_inputs?.speed_ms,
        telemetry.pit_exit_prediction || null,
      );
    });
    mapClassFiltersEl.appendChild(button);
  });
}

async function loadLeaderboardEvents(sessionKey) {
  if (!sessionKey || eventLoadInFlight) return;
  eventLoadInFlight = true;
  try {
    const response = await fetch(
      `/api/events?session_key=${encodeURIComponent(sessionKey)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (sessionKey !== currentEventSessionKey) return;
    const storedEvents = (payload.events || [])
      .filter((event) => event.sessionKey === sessionKey)
      .map((event) => ({ ...event, type: String(event.type || "").toLowerCase() }));
    const localEvents = leaderboardEvents.filter(
      (event) => event.sessionKey === sessionKey,
    );
    const combined = [...storedEvents, ...localEvents];
    leaderboardEvents = Array.from(
      new Map(combined.map((event) => [event.id, event])).values(),
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderLeaderboardEvents();
  } catch (error) {
    console.error("Unable to load leaderboard events", error);
  } finally {
    eventLoadInFlight = false;
    lastEventLoadAt = Date.now();
  }
}

function selectEventSession(sessionKey, raceStarted) {
  if (!sessionKey || !raceStarted) {
    const stateChanged = leaderboardEventsEnabled || currentEventSessionKey !== null;
    leaderboardEventsEnabled = false;
    if (stateChanged) {
      currentEventSessionKey = null;
      leaderboardEvents = [];
      renderLeaderboardEvents();
    }
    return;
  }
  leaderboardEventsEnabled = true;
  if (sessionKey === currentEventSessionKey) return;
  currentEventSessionKey = sessionKey;
  leaderboardEvents = [];
  renderLeaderboardEvents();
  loadLeaderboardEvents(sessionKey);
}

function getEventReplayTiming(event) {
  const exactSessionTime = event?.sessionTime;
  if (
    exactSessionTime !== null
    && exactSessionTime !== undefined
    && exactSessionTime !== ""
    && Number.isFinite(Number(exactSessionTime))
  ) {
    return {
      sessionTime: Number(exactSessionTime),
      sessionNum: Number.isFinite(Number(event.sessionNum)) ? Number(event.sessionNum) : 0,
      estimated: false,
    };
  }

  const createdAt = Number(event?.createdAt);
  if (
    !replayTimingAnchor
    || event?.sessionKey !== replayTimingAnchor.sessionKey
    || !Number.isFinite(createdAt)
  ) return null;

  const elapsedBeforeAnchor = (replayTimingAnchor.wallTime - createdAt) / 1000;
  const estimatedSessionTime = replayTimingAnchor.sessionTime - elapsedBeforeAnchor;
  if (!Number.isFinite(estimatedSessionTime) || estimatedSessionTime < 0) return null;

  return {
    sessionTime: estimatedSessionTime,
    sessionNum: Number.isFinite(Number(event.sessionNum))
      ? Number(event.sessionNum)
      : replayTimingAnchor.sessionNum,
    estimated: true,
  };
}

function isAvailableLeaderboardEvent(event, sessionKey) {
  return Boolean(
    event?.sessionKey === sessionKey
    && (event.type !== "swap" || (event.oldDriver && event.newDriver)),
  );
}

function isSavedLeaderboardEvent(event, availableEvents) {
  if (isEventSaved(event)) return true;
  if (event.type !== "pos") return false;

  return availableEvents.some((candidate) => {
    if (candidate.type !== "pos" || !isEventSaved(candidate)) return false;
    if (event.groupId && candidate.groupId === event.groupId) return true;
    const sameMoment = event.sessionTime != null && candidate.sessionTime != null
      ? Number(event.sessionTime).toFixed(3) === Number(candidate.sessionTime).toFixed(3)
      : event.createdAt === candidate.createdAt;
    return sameMoment
      && Number(event.oldPosition) === Number(candidate.position)
      && Number(event.position) === Number(candidate.oldPosition);
  });
}

function renderLeaderboardEvents() {
  const eventScan = latestSnapshot?.telemetry?.event_scan || {};
  const scanProgressStep = Number.isFinite(Number(eventScan.progress))
    ? Math.floor(Number(eventScan.progress) * 100)
    : "";
  const signature = [
    leaderboardEventsEnabled,
    currentEventSessionKey || "",
    leaderboardEventFilter,
    leaderboardEvents.length,
    leaderboardEvents[0]?.id || "",
    eventScan.status || "",
    scanProgressStep,
  ].join("|");
  if (signature === lastEventRenderSignature) return;
  lastEventRenderSignature = signature;

  if (!leaderboardEventsEnabled) {
    leaderboardEventsListEl.innerHTML = "<div class='events-empty'>Events will appear after the green flag.</div>";
    return;
  }

  // An iRacing incident can come from cumulative SDK totals or from a
  // race-control/event-log entry. Event-log incidents do not always include
  // both incidentPoints and incidentTotal, but they are still real incidents
  // and must remain visible in the INC feed.
  const availableEvents = leaderboardEvents.filter((event) => (
    isAvailableLeaderboardEvent(event, currentEventSessionKey)
  ));
  const events = leaderboardEventFilter === "all"
    ? availableEvents
    : leaderboardEventFilter === "saved"
      ? availableEvents.filter((event) => isSavedLeaderboardEvent(event, availableEvents))
      : availableEvents.filter((event) => event.type === leaderboardEventFilter);
  leaderboardEventsListEl.innerHTML = "";
  if (!events.length) {
    const replayIsActive = latestSnapshot?.telemetry?.is_replay_playing === true;
    const emptyMessage = eventScan.status === "seeking"
      ? "Preparing replay scan from the start of the race..."
      : eventScan.status === "scanning"
        ? `Scanning the replay for all race events... ${scanProgressStep}% at ${eventScan.speed || 16}x`
        : eventScan.status === "error"
          ? (eventScan.error || "Replay event scan failed.")
          : eventScan.status === "complete"
            ? "Replay scan complete. No matching events were found."
            : replayIsActive && eventScan.status !== "disabled" && leaderboardEventFilter === "all"
              ? "Waiting for the automatic replay event scan..."
      : leaderboardEventFilter === "swap"
      ? "Driver changes will appear here."
      : leaderboardEventFilter === "inc"
        ? "Incident points will appear here."
        : leaderboardEventFilter === "saved"
          ? "Events you save will appear here."
        : "Position changes will appear here.";
    leaderboardEventsListEl.innerHTML = `<div class='events-empty'>${emptyMessage}</div>`;
    return;
  }
  // A position group is always one direct pair: the car gaining a place and
  // the car losing that same place. Never render a whole reorder chain as one
  // group, including chains saved by older versions.
  const displayGroupIds = new Map(events.map((event) => [event.id, null]));
  const storedGroups = new Map();
  events.forEach((event) => {
    if (event.type !== "pos" || !event.groupId) return;
    if (!storedGroups.has(event.groupId)) storedGroups.set(event.groupId, []);
    storedGroups.get(event.groupId).push(event);
  });
  storedGroups.forEach((group, groupId) => {
    if (
      group.length === 2
      && Number(group[0].oldPosition) === Number(group[1].position)
      && Number(group[0].position) === Number(group[1].oldPosition)
    ) {
      group.forEach((event) => displayGroupIds.set(event.id, groupId));
    }
  });

  const ungroupedPositionBuckets = new Map();
  events.forEach((event) => {
    if (event.type !== "pos" || displayGroupIds.get(event.id)) return;
    const moment = event.sessionTime != null ? `s${Number(event.sessionTime).toFixed(3)}` : `w${event.createdAt}`;
    if (!ungroupedPositionBuckets.has(moment)) ungroupedPositionBuckets.set(moment, []);
    ungroupedPositionBuckets.get(moment).push(event);
  });
  ungroupedPositionBuckets.forEach((bucket, moment) => {
    const remaining = [...bucket];
    while (remaining.length) {
      const event = remaining.shift();
      const counterpartIndex = remaining.findIndex((candidate) => (
        Number(event.oldPosition) === Number(candidate.position)
        && Number(event.position) === Number(candidate.oldPosition)
      ));
      if (counterpartIndex < 0) continue;
      const counterpart = remaining.splice(counterpartIndex, 1)[0];
      const syntheticId = `display-pos-${moment}-${[event.id, counterpart.id].sort().join("-")}`;
      displayGroupIds.set(event.id, syntheticId);
      displayGroupIds.set(counterpart.id, syntheticId);
    }
  });

  const eventGroupCounts = new Map();
  events.forEach((event) => {
    const displayGroupId = displayGroupIds.get(event.id);
    if (displayGroupId) {
      eventGroupCounts.set(displayGroupId, (eventGroupCounts.get(displayGroupId) || 0) + 1);
    }
  });
  const displayGroupLaps = new Map();
  events.forEach((event) => {
    const displayGroupId = displayGroupIds.get(event.id);
    const eventLap = Number(event.lap);
    if (!displayGroupId || !Number.isFinite(eventLap)) return;
    displayGroupLaps.set(
      displayGroupId,
      Math.max(displayGroupLaps.get(displayGroupId) || eventLap, eventLap),
    );
  });
  const eventGroupElements = new Map();
  const createEventGroup = (type, labelText, ariaLabel, replayEvent) => {
    const group = document.createElement("section");
    group.className = `event-group event-group-${type}`;
    group.setAttribute("aria-label", ariaLabel);
    group.replayEvent = replayEvent;
    syncEventGroupViewed(group, replayEvent);
    const label = document.createElement("div");
    label.className = "event-group-label";
    const labelTitle = document.createElement("span");
    const saveIcon = document.createElement("button");
    const eyeIcon = document.createElement("button");
    labelTitle.textContent = labelText;
    saveIcon.className = "event-group-save";
    saveIcon.type = "button";
    saveIcon.setAttribute("aria-label", `Save ${labelText.toLowerCase()}`);
    saveIcon.setAttribute("aria-pressed", "false");
    saveIcon.title = "Save event";
    saveIcon.innerHTML = `
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M4 2.5h13.8L21.5 6v15.5h-19v-17A2 2 0 0 1 4 2.5Z"></path>
        <path d="M7 2.5h8v6H7Z"></path>
        <path d="M6.5 14a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v7.5h-11Z"></path>
      </svg>`;
    eyeIcon.className = "event-group-eye";
    eyeIcon.type = "button";
    eyeIcon.setAttribute("aria-label", `Play ${labelText.toLowerCase()} replay`);
    const replayTiming = getEventReplayTiming(replayEvent);
    eyeIcon.title = replayTiming
      ? replayTiming.estimated
        ? "Play replay around the estimated event timing, then return to live"
        : type === "pos"
          ? "Play the position change: 5 seconds before and 7 seconds after, then return to live"
          : "Play replay: 5 seconds before and 7 seconds after, then return to live"
      : "Replay is unavailable for events saved before replay timing was added";
    eyeIcon.disabled = !replayTiming;
    eyeIcon.dataset.replayEventId = replayEvent?.id || "";
    eyeIcon.innerHTML = `
      <svg viewBox="0 0 24 16" focusable="false">
        <path d="M1.5 8C4.2 3.8 7.7 1.7 12 1.7S19.8 3.8 22.5 8c-2.7 4.2-6.2 6.3-10.5 6.3S4.2 12.2 1.5 8Z"></path>
        <circle cx="12" cy="8" r="3.1"></circle>
      </svg>`;
    label.append(labelTitle, saveIcon, eyeIcon);
    group.appendChild(label);
    syncEventGroupViewed(group, replayEvent);
    syncEventGroupSaved(group, replayEvent);
    return group;
  };
  events.forEach((event) => {
    const displayGroupId = displayGroupIds.get(event.id);
    if (event.type === "pos" && eventGroupCounts.get(displayGroupId) !== 2) return;

    const item = document.createElement("div");
    item.className = `event-row event-${event.type}`;
    if (event.type === "pos") {
      const oldPosition = Number(event.oldPosition);
      const newPosition = Number(event.position);
      if (Number.isFinite(oldPosition) && Number.isFinite(newPosition)) {
        item.classList.add(newPosition < oldPosition ? "event-gain" : "event-loss");
      }
    }
    const description = event.description || (event.type === "swap"
      ? `${event.oldDriver} \u2192 ${event.newDriver}`
      : event.type === "inc"
        ? event.incidentPoints != null
          ? `+${event.incidentPoints}x${event.incidentTotal != null ? ` \u00b7 ${event.incidentTotal}x total` : ""}`
          : "Incident"
        : `P${event.oldPosition} \u2192 P${event.position}`);
    const car = document.createElement("span");
    const lap = document.createElement("span");
    const detail = document.createElement("strong");
    car.className = "event-car";
    lap.className = "event-lap";
    detail.className = "event-detail";
    car.textContent = `#${event.carNumber}`;
    lap.textContent = displayGroupLaps.get(displayGroupId) ?? event.lap;
    detail.textContent = description;
    item.append(car, lap, detail);

    if (displayGroupId && eventGroupCounts.get(displayGroupId) > 1) {
      let group = eventGroupElements.get(displayGroupId);
      if (!group) {
        group = createEventGroup("pos", "Position changes", "Cars involved in the same position change", event);
        eventGroupElements.set(displayGroupId, group);
        leaderboardEventsListEl.appendChild(group);
      }
      if (item.classList.contains("event-gain")) {
        group.replayEvent = event;
        syncEventGroupViewed(group, event);
        syncEventGroupSaved(group, event);
        group.querySelector(".event-group-eye").dataset.replayEventId = event.id;
        group.insertBefore(item, group.querySelector(".event-row"));
      } else {
        group.appendChild(item);
      }
    } else {
      const labelText = event.type === "swap"
        ? "Driver swap"
        : event.type === "inc"
          ? "Incident"
          : "Position change";
      const group = createEventGroup(event.type, labelText, `${labelText} event`, event);
      group.classList.add("event-group-single");
      group.appendChild(item);
      leaderboardEventsListEl.appendChild(group);
    }
  });
}

function activateEventReplayButton(button) {
  if (!button || button.disabled) return;
  // Red incident groups contain one event. Blue position-change groups contain
  // two rows, so use the representative event attached to that rendered group
  // (the car that gained the position) instead of resolving a potentially
  // stale id from the asynchronously refreshed global event list.
  const groupEvent = button.closest(".event-group")?.replayEvent;
  const replayEvent = groupEvent
    || leaderboardEvents.find((event) => event.id === button.dataset.replayEventId);
  playEventReplay(replayEvent, button);
}

leaderboardEventsListEl?.addEventListener("click", (event) => {
  const saveButton = event.target.closest(".event-group-save");
  if (saveButton) {
    const savedEvent = saveButton.closest(".event-group")?.replayEvent;
    toggleEventSaved(savedEvent, saveButton);
    return;
  }

  const replayButton = event.target.closest(".event-group-eye");
  if (!replayButton) return;
  activateEventReplayButton(replayButton);
});

async function playEventReplay(event, button) {
  const replayTiming = getEventReplayTiming(event);
  if (!event || !replayTiming) return;

  button.disabled = true;
  button.classList.remove("is-error");
  button.classList.add("is-loading");
  try {
    const response = await fetch("/api/replay/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        car_number: event.carNumber,
        session_num: replayTiming.sessionNum,
        session_time: replayTiming.sessionTime,
        estimated_timing: replayTiming.estimated,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Replay could not be started");
    }
    markEventViewed(event, button);
  } catch (error) {
    console.error("Unable to play event replay", error);
    button.classList.add("is-error");
    setTimeout(() => button.classList.remove("is-error"), 1600);
  } finally {
    button.classList.remove("is-loading");
    button.disabled = false;
  }
}

leaderboardEventFiltersEl?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-event-filter]");
  if (!button) return;
  leaderboardEventFilter = button.dataset.eventFilter;
  leaderboardEventFiltersEl.querySelectorAll("button").forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate === button);
  });
  renderLeaderboardEvents();
});

function renderLeaderboard(standings) {
  latestStandings = standings || [];
  renderClassFilters(latestStandings);
  leaderboardLiveCountEl.textContent = `${latestStandings.length} cars \u00b7 live`;

  const visibleStandings = leaderboardClassFilter === "all"
    ? latestStandings
    : latestStandings.filter((entry) => getClassKey(entry) === leaderboardClassFilter);

  if (visibleStandings.length === 0) {
    leaderboardListEl.innerHTML = "<div class='leaderboard-empty'>No standings available yet.</div>";
    return;
  }

  const classCounts = new Map();
  const fallbackClassPositions = new Map();
  latestStandings.forEach((entry) => {
    const classKey = getClassKey(entry);
    const nextPosition = (classCounts.get(classKey) || 0) + 1;
    classCounts.set(classKey, nextPosition);
    fallbackClassPositions.set(getLeaderboardRowKey(entry), nextPosition);
  });

  Array.from(leaderboardListEl.children)
    .filter((child) => !child.classList.contains("leaderboard-row"))
    .forEach((child) => child.remove());

  const existingRows = new Map(
    Array.from(leaderboardListEl.querySelectorAll(".leaderboard-row[data-car-key]"))
      .map((row) => [row.dataset.carKey, row]),
  );
  const previousOrder = Array.from(existingRows.keys());
  const nextOrder = visibleStandings.map(getLeaderboardRowKey);
  const orderChanged = previousOrder.length > 0 && (
    previousOrder.length !== nextOrder.length ||
    previousOrder.some((key, index) => key !== nextOrder[index])
  );
  const previousTops = orderChanged
    ? new Map(Array.from(existingRows, ([key, row]) => [key, row.getBoundingClientRect().top]))
    : new Map();

  const nextRows = visibleStandings.map((entry, index) => {
    const key = getLeaderboardRowKey(entry);
    const row = existingRows.get(key) || createLeaderboardRow();
    updateLeaderboardRow(row, entry, fallbackClassPositions.get(key));
    existingRows.delete(key);
    const rowAtIndex = leaderboardListEl.children[index];
    if (rowAtIndex !== row) {
      leaderboardListEl.insertBefore(row, rowAtIndex || null);
    }
    return row;
  });
  existingRows.forEach((row) => row.remove());

  if (orderChanged) animateLeaderboardPositionChanges(previousTops, nextRows);
}

async function focusCamera(carNumber) {
  if (!carNumber) {
    return;
  }

  try {
    const response = await fetch("/api/camera/focus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ car_number: carNumber }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("Unable to switch iRacing camera focus", error);
    renderAlerts(["Unable to switch iRacing camera focus."]);
  }
}

function getMapCarStanding(car, standingsByCarIdx) {
  return standingsByCarIdx.get(String(car?.car_idx));
}

function getMapCarClassKey(car, standingsByCarIdx) {
  if (car?.class_name || car?.class_id != null) return getClassKey(car);
  const standing = getMapCarStanding(car, standingsByCarIdx);
  return standing ? getClassKey(standing) : "unknown";
}

function isMapCarDimmed(car, standingsByCarIdx) {
  return mapClassFilter !== "all"
    && getMapCarClassKey(car, standingsByCarIdx) !== mapClassFilter;
}

function isMapCarInPit(car, standingsByCarIdx) {
  if (car?.is_on_pit_road != null) return Boolean(car.is_on_pit_road);
  const standing = getMapCarStanding(car, standingsByCarIdx);
  return Boolean(standing?.is_on_pit_road || standing?.car_status === "pit");
}

function setMapCarClassStyles(group, car, standingsByCarIdx) {
  const standing = getMapCarStanding(car, standingsByCarIdx);
  const classSource = (car?.class_name || car?.class_id != null) ? car : (standing || car || {});
  const className = formatClass(classSource).toUpperCase();
  const markerTextColor = className.includes("GTP") || className.includes("LMP")
    ? "#071015"
    : "#ffffff";
  const markerColor = getClassColor(classSource);
  if (group.style.getPropertyValue("--map-car-color") !== markerColor) {
    group.style.setProperty("--map-car-color", markerColor);
  }
  if (group.style.getPropertyValue("--map-car-text-color") !== markerTextColor) {
    group.style.setProperty("--map-car-text-color", markerTextColor);
  }
}

function setSvgAttribute(element, name, value) {
  const nextValue = String(value);
  if (element.getAttribute(name) !== nextValue) {
    element.setAttribute(name, nextValue);
  }
}

function renderTrackMap(trackMap, focusedSpeedMs, pitExitPrediction) {
  const trackMapCarsEl = document.getElementById("track-map-cars");
  if (!trackMapCarsEl) return;

  const mapCars = trackMap?.cars || [];
  const standingsByCarIdx = new Map(
    latestStandings.map((entry) => [String(entry.car_idx), entry]),
  );
  if (mapCars.length === 0) {
    trackMapCarsEl.replaceChildren();
    document.getElementById("pit-exit-map-cars")?.replaceChildren();
    document.getElementById("follow-map-cars")?.replaceChildren();
    return;
  }

  const trackPathEl = document.getElementById("track-path");
  let geometry = trackPathEl ? trackGeometryCache.get(trackPathEl) : null;
  if (!geometry) {
    const trackLength = trackPathEl && typeof trackPathEl.getTotalLength === "function"
      ? trackPathEl.getTotalLength()
      : 0;
    const viewBox = trackPathEl?.ownerSVGElement?.viewBox?.baseVal;
    const mapScale = viewBox && viewBox.width > 0 && viewBox.height > 0
      ? Math.min(viewBox.width / 520, viewBox.height / 380)
      : 1;

    const innerTrackPathEl = document.getElementById("track-path-inner");
    const innerTrackLength = innerTrackPathEl && typeof innerTrackPathEl.getTotalLength === "function"
      ? innerTrackPathEl.getTotalLength()
      : 0;

    // This SVG work is relatively expensive, so calculate it once per loaded
    // track rather than once per telemetry frame.
    let startFinishOffset = 0;
    let innerStartFinishOffset = 0;
    const startFinishEl = document.getElementById("track-start-finish-layer");
    if (trackLength > 0 && startFinishEl && typeof startFinishEl.getBBox === "function") {
      try {
        const box = startFinishEl.getBBox();
        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;
        const closestPathDistance = (path, length) => {
          let closestDistance = Infinity;
          let closestOffset = 0;
          for (let sample = 0; sample <= 720; sample += 1) {
            const distance = (sample / 720) * length;
            const point = path.getPointAtLength(distance);
            const squaredDistance = ((point.x - targetX) ** 2) + ((point.y - targetY) ** 2);
            if (squaredDistance < closestDistance) {
              closestDistance = squaredDistance;
              closestOffset = distance;
            }
          }
          return closestOffset;
        };
        startFinishOffset = closestPathDistance(trackPathEl, trackLength);
        if (innerTrackLength > 0) {
          innerStartFinishOffset = closestPathDistance(innerTrackPathEl, innerTrackLength);
        }
      } catch (_) {
        startFinishOffset = 0;
        innerStartFinishOffset = 0;
      }
    }

    // Compound SVG road shapes normally draw their inner and outer contours
    // in opposite directions. Detect which way the inner contour must be read
    // so both sides advance together from start/finish.
    let innerProgressDirection = 1;
    if (trackLength > 0 && innerTrackLength > 0) {
      const outerStep = Math.max(1, trackLength * 0.001);
      const innerStep = Math.max(1, innerTrackLength * 0.001);
      const outerNow = trackPathEl.getPointAtLength(startFinishOffset);
      const outerAhead = trackPathEl.getPointAtLength(
        (startFinishOffset - outerStep + trackLength) % trackLength,
      );
      const innerNow = innerTrackPathEl.getPointAtLength(innerStartFinishOffset);
      const innerPlus = innerTrackPathEl.getPointAtLength(
        (innerStartFinishOffset + innerStep) % innerTrackLength,
      );
      const dot = ((outerAhead.x - outerNow.x) * (innerPlus.x - innerNow.x))
        + ((outerAhead.y - outerNow.y) * (innerPlus.y - innerNow.y));
      innerProgressDirection = dot >= 0 ? 1 : -1;
    }

    geometry = {
      trackLength,
      trackPathEl,
      mapScale,
      startFinishOffset,
      innerTrackPathEl,
      innerTrackLength,
      innerStartFinishOffset,
      innerProgressDirection,
      viewWidth: viewBox?.width || 520,
      viewHeight: viewBox?.height || 380,
    };
    if (trackPathEl) trackGeometryCache.set(trackPathEl, geometry);
  }

  const { trackLength, mapScale } = geometry;
  const existingCars = new Map(
    Array.from(trackMapCarsEl.querySelectorAll(".map-car[data-car-idx]"))
      .map((element) => [element.dataset.carIdx, element]),
  );
  const visibleCarIds = new Set();
  const projectedCars = [];

  mapCars.forEach((car) => {
    let x = car.x;
    let y = car.y;

    // Use SVG path to position cars based on lap distance percentage
    if (trackLength > 0 && car.lap_dist_pct != null) {
      const progress = Math.max(0, Math.min(1, Number(car.lap_dist_pct)));
      // iRacing's road-surface outline is authored counter to the direction in
      // which LapDistPct increases. Walk backwards from start/finish so cars
      // travel around the map in the same direction as they do in the sim.
      const point = projectTrackPoint(progress, geometry);
      x = point.x;
      y = point.y;
    }

    if (x == null || y == null) {
      return;
    }
    projectedCars.push({ car, x, y });

    const carId = String(car.car_idx);
    visibleCarIds.add(carId);
    let group = existingCars.get(carId);
    let circle;
    let label;
    let pitRing;
    if (!group) {
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.dataset.carIdx = carId;
      pitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pitRing.setAttribute("class", "map-car-pit-ring");
      circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "map-car-marker");
      label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("text-anchor", "middle");
      group.appendChild(pitRing);
      group.appendChild(circle);
      group.appendChild(label);
      trackMapCarsEl.appendChild(group);
    } else {
      pitRing = group.querySelector(".map-car-pit-ring");
      circle = group.querySelector(".map-car-marker") || group.querySelector("circle");
      circle?.setAttribute("class", "map-car-marker");
      if (!pitRing) {
        pitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pitRing.setAttribute("class", "map-car-pit-ring");
        group.insertBefore(pitRing, circle);
      }
      label = group.querySelector("text");
    }

    setSvgAttribute(group, "transform", `translate(${x} ${y})`);
    setMapCarClassStyles(group, car, standingsByCarIdx);
    const groupClass = [
      "map-car",
      car.focused ? "focused" : "",
      isMapCarInPit(car, standingsByCarIdx) ? "in-pit" : "",
      isMapCarDimmed(car, standingsByCarIdx) ? "is-dimmed" : "",
    ].filter(Boolean).join(" ");
    setSvgAttribute(group, "class", groupClass);
    const markerRadius = (car.focused ? 10 : 7) * mapScale;
    setSvgAttribute(circle, "r", markerRadius);
    setSvgAttribute(pitRing, "r", markerRadius + (3 * mapScale));
    setSvgAttribute(label, "y", 4 * mapScale);
    const fontSize = `${9 * mapScale}px`;
    if (label.style.fontSize !== fontSize) label.style.fontSize = fontSize;
    setText(label, car.car_number || "--");
  });

  existingCars.forEach((element, carId) => {
    if (!visibleCarIds.has(carId)) element.remove();
  });

  renderPitExitMap(pitExitPrediction, geometry, standingsByCarIdx);
  renderFollowMap(projectedCars, geometry, trackPathEl, focusedSpeedMs, standingsByCarIdx);

}

function syncPitExitMapLayers() {
  const sourceMapEl = document.getElementById("track-map");
  const miniMapEl = document.getElementById("pit-exit-map");
  const layersEl = document.getElementById("pit-exit-map-layers");
  if (!sourceMapEl || !miniMapEl || !layersEl) return;

  const sourceViewBox = sourceMapEl.getAttribute("viewBox");
  if (sourceViewBox) miniMapEl.setAttribute("viewBox", sourceViewBox);

  const trackPathEl = document.getElementById("track-path");
  if (trackPathEl && typeof trackPathEl.getBBox === "function") {
    try {
      const box = trackPathEl.getBBox();
      if (box.width > 0 && box.height > 0) {
        // Use the same gutter as Track Map so both compact cards render the
        // circuit at the same visual size.
        const padding = Math.max(box.width, box.height) * 0.055;
        miniMapEl.setAttribute(
          "viewBox",
          `${box.x - padding} ${box.y - padding} ${box.width + (padding * 2)} ${box.height + (padding * 2)}`,
        );
      }
    } catch (_) {
      // Keep the source viewBox while the SVG is not measurable yet.
    }
  }

  const layerIds = [
    "track-inactive-layer",
    "track-pitroad-layer",
    "track-active-layer",
    "track-start-finish-layer",
    "track-turns-layer",
  ];
  const availableLayerIds = layerIds.filter((id) => document.getElementById(id));
  const idsToRender = availableLayerIds.length ? availableLayerIds : ["track-path"];

  layersEl.replaceChildren(...idsToRender.map((id) => {
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${id}`);
    use.classList.add(`pit-exit-layer-${id.replace("track-", "").replace("-layer", "")}`);
    if (id === "track-path") use.setAttribute("class", "pit-exit-map-fallback-track");
    return use;
  }));
}

function renderPitExitMap(prediction, geometry, standingsByCarIdx) {
  const miniMapEl = document.getElementById("pit-exit-map");
  const carsEl = document.getElementById("pit-exit-map-cars");
  if (!miniMapEl || !carsEl) return;

  if (!carsEl.previousElementSibling?.childElementCount) syncPitExitMapLayers();
  const mapScale = geometry.mapScale || 1;
  const projectedCars = (prediction?.cars || []).map((car) => {
    let x = car.x;
    let y = car.y;
    if (geometry.trackLength > 0 && car.lap_dist_pct != null) {
      const point = projectTrackPoint(car.lap_dist_pct, geometry);
      x = point.x;
      y = point.y;
    }
    return { car, x, y };
  }).filter(({ x, y }) => x != null && y != null);

  const orderedCars = projectedCars.toSorted(
    ({ car: a }, { car: b }) => Number(a.focused) - Number(b.focused),
  );
  const existingCars = new Map(
    Array.from(carsEl.querySelectorAll(".pit-exit-map-car[data-car-idx]"))
      .map((element) => [element.dataset.carIdx, element]),
  );
  const visibleCarIds = new Set();
  orderedCars.forEach(({ car, x, y }) => {
    const carId = String(car.car_idx);
    visibleCarIds.add(carId);
    let group = existingCars.get(carId);
    let circle;
    let pitRing;
    let label;
    if (!group) {
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.dataset.carIdx = carId;
      pitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pitRing.setAttribute("class", "pit-exit-map-pit-ring");
      circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "pit-exit-map-marker");
      label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      group.append(pitRing, circle, label);
    } else {
      pitRing = group.querySelector(".pit-exit-map-pit-ring");
      circle = group.querySelector(".pit-exit-map-marker");
      label = group.querySelector("text");
    }
    const groupClass = [
      "pit-exit-map-car",
      car.pit_exit ? "pit-exit" : "",
      car.focused ? "focused" : "",
      isMapCarInPit(car, standingsByCarIdx) ? "in-pit" : "",
    ].filter(Boolean).join(" ");
    setSvgAttribute(group, "class", groupClass);
    setMapCarClassStyles(group, car, standingsByCarIdx);
    setSvgAttribute(group, "transform", `translate(${x} ${y})`);

    const markerRadius = (car.pit_exit ? 14 : (car.focused ? 16 : 10)) * mapScale;
    setSvgAttribute(circle, "r", markerRadius);
    setSvgAttribute(pitRing, "r", markerRadius + (4 * mapScale));
    setSvgAttribute(label, "y", (car.focused ? 5.5 : 4.5) * mapScale);
    const fontSize = `${(car.focused ? 14 : 11) * mapScale}px`;
    if (label.style.fontSize !== fontSize) label.style.fontSize = fontSize;
    setText(label, car.pit_exit ? "" : (car.car_number || "--"));
    carsEl.appendChild(group);
  });
  existingCars.forEach((element, carId) => {
    if (!visibleCarIds.has(carId)) element.remove();
  });
}

function projectTrackPoint(progress, geometry) {
  const normalizedProgress = ((Number(progress) % 1) + 1) % 1;
  const outerDistance = (
    geometry.startFinishOffset - normalizedProgress * geometry.trackLength + geometry.trackLength
  ) % geometry.trackLength;
  const outer = geometry.trackPathEl.getPointAtLength(outerDistance);

  if (!geometry.innerTrackPathEl || geometry.innerTrackLength <= 0) return outer;
  const innerDistance = (
    geometry.innerStartFinishOffset
    + geometry.innerProgressDirection * normalizedProgress * geometry.innerTrackLength
    + geometry.innerTrackLength
  ) % geometry.innerTrackLength;
  const inner = geometry.innerTrackPathEl.getPointAtLength(innerDistance);
  return {
    x: (outer.x + inner.x) / 2,
    y: (outer.y + inner.y) / 2,
  };
}

function getFollowMapZoomMultiplier(speedMs) {
  if (speedMs == null || speedMs === "" || !Number.isFinite(Number(speedMs))) return 1;

  const speedKph = Math.max(0, Math.min(300, Number(speedMs) * 3.6));
  const normalizedSpeed = speedKph / 300;
  const smoothSpeed = normalizedSpeed * normalizedSpeed * (3 - 2 * normalizedSpeed);
  return 1.2 - (0.5 * smoothSpeed);
}

function renderFollowMap(
  projectedCars,
  geometry,
  trackPathEl,
  focusedSpeedMs,
  standingsByCarIdx,
) {
  const followWorldEl = document.getElementById("follow-map-world");
  const followRoadShadowEl = document.getElementById("follow-map-road-shadow");
  const followRoadEl = document.getElementById("follow-map-road");
  const followCarsEl = document.getElementById("follow-map-cars");
  if (
    !followWorldEl
    || !followRoadShadowEl
    || !followRoadEl
    || !followCarsEl
    || !trackPathEl
    || geometry.trackLength <= 0
  ) return;

  const focused = projectedCars.find(({ car }) => car.focused);
  if (!focused) {
    followCarsEl.replaceChildren();
    followRoadShadowEl.removeAttribute("d");
    followRoadEl.removeAttribute("d");
    return;
  }

  const progress = Math.max(0, Math.min(1, Number(focused.car.lap_dist_pct)));
  // Use a chord spanning both sides of the car. A single nearby SVG point is
  // noisy on a road-surface outline and made the map snap around in corners.
  const headingSampleProgress = 0.008;
  const behind = projectTrackPoint(progress - headingSampleProgress, geometry);
  const ahead = projectTrackPoint(progress + headingSampleProgress, geometry);
  const headingRadians = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
  const targetRotation = -90 - (headingRadians * 180 / Math.PI);
  // Keep a wider section of the circuit visible so the track uses more of the
  // card instead of showing only the two nearest road segments.
  const baseZoom = Math.max(0.1, Math.min(
    400 / (geometry.viewWidth * 0.42),
    300 / (geometry.viewHeight * 0.42),
  ));
  const targetZoom = baseZoom * getFollowMapZoomMultiplier(focusedSpeedMs);
  const focusedCarId = String(focused.car.car_idx);

  const now = performance.now();
  let followState = followMapStateCache.get(trackPathEl);
  if (!followState || followState.focusedCarId !== focusedCarId) {
    // A different car can be on a completely different section of the track.
    // Start that camera at its own heading instead of rotating all the way from
    // the previous car's heading, which made the map visibly spin on focus changes.
    followState = {
      focusedCarId,
      rotation: targetRotation,
      zoom: targetZoom,
      updatedAt: now,
    };
    followMapStateCache.set(trackPathEl, followState);
  } else {
    const elapsedSeconds = Math.max(0.001, Math.min(0.1, (now - followState.updatedAt) / 1000));
    const wrappedDelta = (
      ((targetRotation - followState.rotation + 540) % 360) - 180
    );
    const smoothing = 1 - Math.exp(-elapsedSeconds / 0.28);
    const maxRotationStep = 105 * elapsedSeconds;
    const smoothedStep = wrappedDelta * smoothing;
    followState.rotation += Math.max(
      -maxRotationStep,
      Math.min(maxRotationStep, smoothedStep),
    );
    const zoomSmoothing = 1 - Math.exp(-elapsedSeconds / 0.45);
    followState.zoom += (targetZoom - followState.zoom) * zoomSmoothing;
    followState.updatedAt = now;
  }
  const rotationDegrees = followState.rotation;
  const zoom = followState.zoom;

  // Project directly into the follow map's own coordinate system. Referencing
  // layers from the separate main SVG proved unreliable in Chromium and could
  // leave the road at its raw coordinates (or make it disappear altogether).
  const rotationRadians = rotationDegrees * Math.PI / 180;
  const rotationCos = Math.cos(rotationRadians);
  const rotationSin = Math.sin(rotationRadians);
  const toFollowPoint = (x, y) => {
    const dx = (x - focused.x) * zoom;
    const dy = (y - focused.y) * zoom;
    return {
      x: 200 + (dx * rotationCos) - (dy * rotationSin),
      y: 150 + (dx * rotationSin) + (dy * rotationCos),
    };
  };

  if (
    followState.roadUpdatedAt == null
    || now - followState.roadUpdatedAt >= FOLLOW_MAP_ROAD_INTERVAL_MS
  ) {
    if (!geometry.followTrackPoints) {
      const sampleCount = 240;
      geometry.followTrackPoints = Array.from({ length: sampleCount + 1 }, (_, index) => (
        projectTrackPoint(index / sampleCount, geometry)
      ));
    }
    const roadPath = geometry.followTrackPoints.map((point, index) => {
      const projected = toFollowPoint(point.x, point.y);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
    }).join(" ");
    followRoadShadowEl.setAttribute("d", roadPath);
    followRoadEl.setAttribute("d", roadPath);
    followState.roadUpdatedAt = now;
  }
  if (followWorldEl.hasAttribute("transform")) followWorldEl.removeAttribute("transform");

  const existingCars = new Map(
    Array.from(followCarsEl.querySelectorAll(".follow-map-car[data-car-idx]"))
      .map((element) => [element.dataset.carIdx, element]),
  );
  const visibleCarIds = new Set();
  const markerRadius = 7;
  const focusedRadius = 10;
  const fontSize = 9;

  projectedCars.forEach(({ car, x, y }) => {
    const carId = String(car.car_idx);
    visibleCarIds.add(carId);
    let group = existingCars.get(carId);
    let circle;
    let label;
    let halo;
    let pitRing;
    if (!group) {
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.dataset.carIdx = carId;
      halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      halo.setAttribute("class", "follow-map-halo");
      pitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pitRing.setAttribute("class", "follow-map-pit-ring");
      circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "follow-map-marker");
      label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      group.appendChild(halo);
      group.appendChild(pitRing);
      group.appendChild(circle);
      group.appendChild(label);
      followCarsEl.appendChild(group);
    } else {
      halo = group.querySelector(".follow-map-halo");
      circle = group.querySelector(".follow-map-marker");
      pitRing = group.querySelector(".follow-map-pit-ring");
      if (!pitRing) {
        pitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pitRing.setAttribute("class", "follow-map-pit-ring");
        group.insertBefore(pitRing, circle);
      }
      label = group.querySelector("text");
    }

    const followPoint = toFollowPoint(x, y);
    setSvgAttribute(group, "transform", `translate(${followPoint.x} ${followPoint.y})`);
    setMapCarClassStyles(group, car, standingsByCarIdx);
    const groupClass = [
      "follow-map-car",
      car.focused ? "focused" : "",
      isMapCarInPit(car, standingsByCarIdx) ? "in-pit" : "",
    ].filter(Boolean).join(" ");
    setSvgAttribute(group, "class", groupClass);
    setSvgAttribute(circle, "r", car.focused ? focusedRadius : markerRadius);
    setSvgAttribute(pitRing, "r", (car.focused ? focusedRadius : markerRadius) + 3.5);
    setSvgAttribute(circle, "stroke-width", 1.2);
    setSvgAttribute(halo, "r", car.focused ? focusedRadius + 6 : 0);
    setSvgAttribute(halo, "stroke-width", 1);
    setSvgAttribute(label, "font-size", fontSize);
    setText(label, car.car_number || "--");
  });

  existingCars.forEach((element, carId) => {
    if (!visibleCarIds.has(carId)) element.remove();
  });
}

function renderSessionNotice(snapshot, telemetry) {
  if (!sessionNoticeEl) {
    return;
  }

  const connected = Boolean(snapshot?.connected);
  const hasUsefulTelemetry = Boolean(
    telemetry && (
      telemetry.session_time != null ||
      telemetry.driver_name ||
      telemetry.track_name ||
      telemetry.fuel_level != null ||
      telemetry.lap_dist_pct != null
    )
  );
  const signature = `${connected}|${hasUsefulTelemetry}`;
  if (signature === lastSessionNoticeSignature) return;
  lastSessionNoticeSignature = signature;

  if (!connected) {
    sessionNoticeEl.style.display = "block";
    sessionNoticeEl.innerHTML = "<div style='display:flex;align-items:center;gap:8px;'><span style='width:10px;height:10px;border-radius:999px;background:#ff8f70;display:inline-block;'></span><strong style='color:#ffcfb3;'>Waiting for iRacing</strong></div><div style='margin-top:8px;color:#dce7ee;'>Start iRacing and enter an active session so telemetry can appear here.</div>";
    return;
  }

  if (!hasUsefulTelemetry) {
    sessionNoticeEl.style.display = "block";
    sessionNoticeEl.innerHTML = "<div style='display:flex;align-items:center;gap:8px;'><span style='width:10px;height:10px;border-radius:999px;background:#f8d86a;display:inline-block;'></span><strong style='color:#ffe59a;'>No usable session telemetry yet</strong></div><div style='margin-top:8px;color:#dce7ee;'>The app is connected to iRacing, but no live session data is being received yet. Check that the session is active and that the simulator is not in replay or pause.</div>";
    return;
  }

  sessionNoticeEl.style.display = "none";
  sessionNoticeEl.innerHTML = "";
}

function scheduleTrackMapFrame() {
  if (activeScreen !== "map" || mapRenderFrame !== null) return;
  mapRenderFrame = requestAnimationFrame(renderTrackMapAt60Hz);
}

function renderTrackMapAt60Hz(frameTime) {
  mapRenderFrame = null;
  if (activeScreen !== "map") return;

  const elapsed = frameTime - lastMapFrameAt;
  if (lastMapFrameAt === 0 || elapsed >= MAP_RENDER_INTERVAL_MS - 0.5) {
    lastMapFrameAt = elapsed >= MAP_RENDER_INTERVAL_MS
      ? frameTime - (elapsed % MAP_RENDER_INTERVAL_MS)
      : frameTime;
    const telemetry = latestMapTelemetry;
    renderTrackMap(
      telemetry.track_map || null,
      telemetry.player_inputs?.speed_ms,
      telemetry.pit_exit_prediction || null,
    );
  }

  scheduleTrackMapFrame();
}

function scheduleRender(snapshot) {
  pendingSnapshot = snapshot;
  if (renderFrame !== null) return;

  renderFrame = requestAnimationFrame((frameTime) => {
    renderFrame = null;
    const nextSnapshot = pendingSnapshot;
    pendingSnapshot = null;
    if (nextSnapshot) renderState(nextSnapshot, frameTime);
  });
}

function renderState(snapshot, frameTime = performance.now()) {
  const isNewSnapshot = snapshot !== latestSnapshot;
  latestSnapshot = snapshot;
  if (isNewSnapshot) lastSnapshotAt = Date.now();
  if (!isUpdatingRefreshRate && [10, 30, 60].includes(snapshot.refresh_rate_hz)) {
    showRefreshRate(snapshot.refresh_rate_hz);
  }
  if (typeof snapshot.ui_refresh_rate_ms === "number" && snapshot.ui_refresh_rate_ms > 0) {
    if (snapshot.ui_refresh_rate_ms !== currentRefreshMs) {
      currentRefreshMs = snapshot.ui_refresh_rate_ms;
      if (refreshTimer && !streamConnected) {
        clearInterval(refreshTimer);
        refreshTimer = setInterval(loadState, currentRefreshMs);
      }
    }
  }

  const sourceTelemetry = snapshot.telemetry || {};
  const updatedAtMs = Number(snapshot.updated_at) * 1000;
  const freshnessLimitMs = Math.max(2000, Number(snapshot.ui_refresh_rate_ms || 100) * 5);
  const hasRecentTelemetry = Boolean(
    snapshot.connected
    && Number.isFinite(updatedAtMs)
    && Date.now() - updatedAtMs <= freshnessLimitMs
  );
  // Old frames are deliberately not rendered. A frozen value is more
  // dangerous on a pit wall than an explicit unavailable marker.
  const telemetry = hasRecentTelemetry ? sourceTelemetry : {};
  latestMapTelemetry = telemetry;
  latestStandings = telemetry.standings || [];
  if (activeScreen === "map") renderMapClassFilters(latestStandings);
  if (
    telemetry.session_key
    && Number.isFinite(Number(telemetry.session_time))
    && replayTimingAnchor?.sessionKey !== telemetry.session_key
  ) {
    const snapshotWallTime = Number(snapshot.updated_at) * 1000;
    replayTimingAnchor = {
      sessionKey: telemetry.session_key,
      sessionTime: Number(telemetry.session_time),
      sessionNum: Number.isFinite(Number(telemetry.session_num))
        ? Number(telemetry.session_num)
        : 0,
      wallTime: Number.isFinite(snapshotWallTime) ? snapshotWallTime : Date.now(),
    };
  }
  selectEventSession(telemetry.session_key, telemetry.race_started === true);
  updateConnection(
    snapshot.connected,
    snapshot.connected && !hasRecentTelemetry ? "Telemetry is stale" : snapshot.error,
    hasRecentTelemetry,
  );
  setText(weatherLiveStatusEl, hasRecentTelemetry ? "Live" : (snapshot.connected ? "Stale" : "Offline"));
  weatherLiveStatusEl?.classList.toggle("is-live", hasRecentTelemetry);
  weatherLiveStatusEl?.classList.toggle("is-stale", !hasRecentTelemetry);

  const playerInputs = telemetry.player_inputs || {};
  const tireWear = telemetry.tire_wear || {};
  const totalCars = telemetry.driver_count || "--";

  renderSessionNotice(snapshot, telemetry);

  setText(leaderboardWatchingNumberEl, telemetry.driver_name
    ? `#${telemetry.car_number || "--"}`
    : "--");
  setText(leaderboardWatchingDriverEl, telemetry.driver_name
    ? [telemetry.driver_name, telemetry.team_name || telemetry.car_name].filter(Boolean).join(" | ")
    : "Waiting for camera focus...");
  setText(mapWatchingEl, telemetry.driver_name
    ? `#${telemetry.car_number || "--"}  ${telemetry.driver_name}`
    : "Venter på kamera...");

  setText(trackNameEl, telemetry.track_name || "Track Map");
  setText(sessionTrackNameEl, telemetry.track_name || "--");

  setTimeRemainingCountdown(telemetry.session_time_remain);
  setText(lapsRemainingEl, formatRaceLapCount(
    telemetry.current_lap,
    telemetry.session_laps_total,
  ));
  setText(pitRoadStatusEl, telemetry.on_pit_road ? "On pit road" : "Track");
  setText(windSpeedEl, typeof telemetry.weather?.wind_speed === "number"
    ? `${formatNumber(telemetry.weather.wind_speed, 1)} m/s`
    : "--");
  setText(humidityEl, typeof telemetry.weather?.humidity === "number"
    ? `${formatNumber(telemetry.weather.humidity, 0)}%`
    : "--");
  setText(windDirectionEl, formatWindDirection(telemetry.weather?.wind_direction));
  airTempEl.textContent = typeof telemetry.weather?.air_temp === "number"
    ? `${formatNumber(telemetry.weather.air_temp, 0)}°C`
    : "--";
  setText(trackTempEl, typeof telemetry.weather?.track_temp === "number"
    ? `${formatNumber(telemetry.weather.track_temp, 0)}°C`
    : "--");
  setText(trackWetnessEl, formatTrackWetness(telemetry.weather?.track_wetness));
  setText(trackSkiesEl, formatSkies(telemetry.weather?.skies));
  setText(trackDeclaredWetEl, typeof telemetry.weather?.weather_declared_wet === "boolean"
    ? (telemetry.weather.weather_declared_wet ? "YES" : "NO")
    : "--");
  setText(fuelLevelEl, formatNumber(telemetry.fuel_level, 1));
  setText(fuelUseEl, telemetry.fuel_use_per_hour != null
    ? `${formatNumber(telemetry.fuel_use_per_hour, 1)} kg/h`
    : "--");
  setText(focusGapEl, telemetry.focus_gap != null
    ? `${formatNumber(telemetry.focus_gap, 2)} s`
    : "--");

  setText(inputThrottleEl, formatInput(playerInputs.throttle));
  setText(inputBrakeEl, formatInput(playerInputs.brake));
  setText(inputClutchEl, formatInput(playerInputs.clutch));
  setBar(barThrottleEl, playerInputs.throttle);
  setBar(barBrakeEl, playerInputs.brake);
  setBar(barClutchEl, playerInputs.clutch);

  setText(carNumberEl, telemetry.car_number || "--");
  setText(driverNameEl, telemetry.driver_name || "Unknown driver");
  setText(carNameEl, telemetry.car_name || "Unknown car");
  setText(positionEl, telemetry.position != null ? `${telemetry.position}/${totalCars}` : "--");
  setText(classPositionEl, telemetry.class_position != null ? `${telemetry.class_position}` : "--");
  setText(lapsCompletedEl, formatInteger(telemetry.laps_completed));
  setText(lapProgressEl, telemetry.lap_dist_pct != null
    ? formatPercent(telemetry.lap_dist_pct * 100, 1)
    : "--");
  setText(focusGearEl, formatGear(telemetry.focus_gear));
  setText(focusRpmEl, formatInteger(telemetry.focus_rpm));
  setText(speedKphEl, formatKph(playerInputs.speed_ms));

  setText(tireLfEl, formatNumber(tireWear.lf, 2));
  setText(tireRfEl, formatNumber(tireWear.rf, 2));
  setText(tireLrEl, formatNumber(tireWear.lr, 2));
  setText(tireRrEl, formatNumber(tireWear.rr, 2));

  setText(lapTimeEl, formatSeconds(telemetry.lap_time));
  setText(bestLapEl, formatSeconds(telemetry.best_lap_time));
  setText(tireCompoundEl, formatTireType(telemetry.tire_compound));
  setText(fastRepairsEl, telemetry.fast_repairs_used != null ? telemetry.fast_repairs_used : "--");
  setText(steeringAngleEl, playerInputs.steering_angle != null
    ? `${formatNumber(playerInputs.steering_angle, 2)} rad`
    : "--");

  setText(leaderboardCurrentLapEl, telemetry.current_lap ?? "--");
  setText(leaderboardPositionEl, telemetry.position != null ? `P${telemetry.position}` : "--");
  setText(leaderboardLastLapEl, formatSeconds(telemetry.lap_time));
  setText(leaderboardBestLapEl, formatSeconds(telemetry.best_lap_time));

  renderAlerts(snapshot.alerts || []);
  if (activeScreen === "map") scheduleTrackMapFrame();
  if (frameTime - lastHeavyRenderAt >= HEAVY_RENDER_INTERVAL_MS) {
    lastHeavyRenderAt = frameTime;
    if (
      activeScreen === "leaderboard"
      &&
      leaderboardEventsEnabled
      && currentEventSessionKey
      && Date.now() - lastEventLoadAt >= 500
    ) {
      loadLeaderboardEvents(currentEventSessionKey);
    }
    if (activeScreen === "leaderboard") {
      renderLeaderboard(telemetry.standings || []);
      renderLeaderboardEvents();
    }
  }
  // If track name changed, fetch new SVG
  const trackName = telemetry.track_name || null;
  const trackKey = [telemetry.track_id, telemetry.track_internal_name, trackName]
    .filter((value) => value != null && value !== "")
    .join("|") || null;
  if (trackKey !== currentTrackName) {
    currentTrackName = trackKey;
    loadTrackSvg();
    // Update map header label
    const labelEl = document.querySelector('.screen[data-screen-panel="map"] .module-head .section-label');
    if (labelEl) {
      labelEl.textContent = trackName || "Track Map";
    }
  }
}

async function loadState() {
  if (isLoadingState) {
    return;
  }

  isLoadingState = true;
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const snapshot = await response.json();
    scheduleRender(snapshot);
  } catch (error) {
    if (Date.now() - lastSnapshotAt > 5000) {
      scheduleRender({
        connected: false,
        error: "Unable to reach Pit Wall backend",
        status: "Disconnected",
        telemetry: null,
        alerts: ["Check that the backend is running and reachable."],
        updated_at: null,
      });
    }
  } finally {
    isLoadingState = false;
  }
}

function stopPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function ensurePollingFallback() {
  if (!streamConnected && !refreshTimer) {
    refreshTimer = setInterval(loadState, currentRefreshMs);
  }
}

function startStreaming() {
  if (stream) {
    stream.close();
  }

  stream = new EventSource("/api/stream");

  stream.onopen = () => {
    streamConnected = true;
    stopPolling();
  };

  stream.onmessage = (event) => {
    try {
      const snapshot = JSON.parse(event.data);
      scheduleRender(snapshot);
    } catch (error) {
      ensurePollingFallback();
    }
  };

  stream.onerror = () => {
    streamConnected = false;
    ensurePollingFallback();
  };
}

setActiveScreen(activeScreen);
loadState();
ensurePollingFallback();
startStreaming();

// SSE only emits when the backend publishes a frame. Re-check freshness even
// if a feed freezes completely, so no value can remain labelled as live.
setInterval(() => {
  if (latestSnapshot) scheduleRender(latestSnapshot);
}, 1000);
