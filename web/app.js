const refreshRateControls = Array.from(document.querySelectorAll(".refresh-rate-control:not(.unit-settings)"));
const refreshRateToggles = Array.from(document.querySelectorAll(".refresh-rate-toggle"));
const refreshRateValues = Array.from(document.querySelectorAll(".refresh-rate-value"));
const refreshRateOptions = Array.from(document.querySelectorAll(".refresh-rate-option[data-hz]"));
const unitSettingsEl = document.getElementById("unit-settings");
const unitSettingsToggleEl = document.getElementById("unit-settings-toggle");
const unitSettingsModalEl = document.getElementById("unit-settings-modal");
const unitSettingsPanelEl = unitSettingsModalEl?.querySelector(".unit-modal-panel");
const unitPreferenceSelects = Array.from(document.querySelectorAll("[data-unit-preference]"));
const unitDropdowns = Array.from(document.querySelectorAll(".unit-dropdown[data-unit-dropdown]"));
const unitPresetButtons = Array.from(document.querySelectorAll("[data-unit-preset]"));
const unitModalCloseButtons = Array.from(document.querySelectorAll("[data-unit-modal-close]"));
const unitSettingsResetEl = document.getElementById("unit-settings-reset");
const startupCollectorToggleEl = document.getElementById("startup-collector-toggle");
const fullscreenToggleEl = document.getElementById("fullscreen-toggle");
const restartRaceEngineerEl = document.getElementById("restart-race-engineer");
const overlayTitleEl = document.getElementById("overlay-title");
const overlayFullscreenEl = document.getElementById("overlay-fullscreen");
const overlayLockEl = document.getElementById("overlay-lock");
const overlayCloseEl = document.getElementById("overlay-close");
const overlayOpacityEl = document.getElementById("overlay-opacity");
const OVERLAY_SCREENS = new Set(["overview", "leaderboard", "map", "car-setup-pit", "fuel"]);
const requestedOverlayScreen = new window.URLSearchParams(window.location.search).get("overlay");
const isOverlayMode = OVERLAY_SCREENS.has(requestedOverlayScreen);
if (isOverlayMode) {
  document.documentElement.classList.add("overlay-mode");
  document.body.classList.add("overlay-mode");
}
const iracingPauseEl = document.getElementById("iracing-pause");
const sessionTimeEl = document.getElementById("session-time");
const ingameTimeEl = document.getElementById("ingame-time");
const lapsRemainingEl = document.getElementById("laps-remaining");
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
const speedUnitLabelEl = document.getElementById("speed-unit-label");
const temperatureUnitEls = Array.from(document.querySelectorAll("[data-temperature-unit]"));
const engineTemperatureScaleEls = Array.from(document.querySelectorAll(".engine-rail + .system-scale span"));
const statusTireLfTempEl = document.getElementById("status-tire-lf-temp");
const statusTireRfTempEl = document.getElementById("status-tire-rf-temp");
const statusTireLrTempEl = document.getElementById("status-tire-lr-temp");
const statusTireRrTempEl = document.getElementById("status-tire-rr-temp");
const statusBrakeLfTempEl = document.getElementById("status-brake-lf-temp");
const statusBrakeRfTempEl = document.getElementById("status-brake-rf-temp");
const statusBrakeLrTempEl = document.getElementById("status-brake-lr-temp");
const statusBrakeRrTempEl = document.getElementById("status-brake-rr-temp");
const statusTireLfWearEl = document.getElementById("status-tire-lf-wear");
const statusTireRfWearEl = document.getElementById("status-tire-rf-wear");
const statusTireLrWearEl = document.getElementById("status-tire-lr-wear");
const statusTireRrWearEl = document.getElementById("status-tire-rr-wear");
const statusTireLfWearBarEl = document.getElementById("status-tire-lf-wear-bar");
const statusTireRfWearBarEl = document.getElementById("status-tire-rf-wear-bar");
const statusTireLrWearBarEl = document.getElementById("status-tire-lr-wear-bar");
const statusTireRrWearBarEl = document.getElementById("status-tire-rr-wear-bar");
const statusTirePressureGauges = Object.fromEntries(
  Array.from(document.querySelectorAll(".tyre-pressure-gauge[data-pressure-wheel]"))
    .map((element) => [element.dataset.pressureWheel, element]),
);
const pressureUnitEls = Array.from(document.querySelectorAll("[data-pressure-unit]"));
const statusEngineTempEl = document.getElementById("status-engine-temp");
const statusEngineTempBarEl = document.getElementById("status-engine-temp-bar");
const statusEngineTempChartEl = document.getElementById("status-engine-temp-chart");
const statusEngineTempAreaEl = document.getElementById("status-engine-temp-area");
const statusEngineTempLineEl = document.getElementById("status-engine-temp-line");
const statusEngineTempStartEl = document.getElementById("status-engine-temp-start");
const statusEngineTempCurrentEl = document.getElementById("status-engine-temp-current");
const statusEngineTempScaleEls = Array.from(
  document.querySelectorAll("#status-engine-temp-scale span"),
);
const statusOilTempEl = document.getElementById("status-oil-temp");
const statusOilTempChartEl = document.getElementById("status-oil-temp-chart");
const statusOilTempAreaEl = document.getElementById("status-oil-temp-area");
const statusOilTempLineEl = document.getElementById("status-oil-temp-line");
const statusOilTempStartEl = document.getElementById("status-oil-temp-start");
const statusOilTempCurrentEl = document.getElementById("status-oil-temp-current");
const statusOilTempScaleEls = Array.from(document.querySelectorAll("#status-oil-temp-scale span"));
const statusOilTempRangeStartEl = document.getElementById("status-oil-temp-range-start");
const statusRpmBarEl = document.getElementById("status-rpm-bar");
const statusFuelValueEl = document.getElementById("status-fuel-value");
const statusFuelBarEl = document.getElementById("status-fuel-bar");
const statusEmptyLapEl = document.getElementById("status-empty-lap");
const statusWaterTempEl = document.getElementById("status-water-temp");
const statusWaterTempChartEl = document.getElementById("status-water-temp-chart");
const statusWaterTempAreaEl = document.getElementById("status-water-temp-area");
const statusWaterTempLineEl = document.getElementById("status-water-temp-line");
const statusWaterTempStartEl = document.getElementById("status-water-temp-start");
const statusWaterTempCurrentEl = document.getElementById("status-water-temp-current");
const statusWaterTempScaleEls = Array.from(
  document.querySelectorAll(".car-status-metric-water .engine-sparkline-scale span"),
);
const statusTyreCards = Object.fromEntries(
  Array.from(document.querySelectorAll(".status-tyre[data-tire]"))
    .map((element) => [element.dataset.tire, element]),
);
const statusIndicators = Array.from(document.querySelectorAll("[data-status-for]"));

const WATER_TEMP_HISTORY_KEY = "race-engineer.water-temperature-history.v1";
const WATER_TEMP_HISTORY_MS = 60 * 60 * 1000;
const WATER_TEMP_SAMPLE_MS = 5 * 1000;
let waterTemperatureHistory = [];
let waterTemperatureSessionKey = null;
let lastWaterTemperatureHistorySaveAt = 0;

try {
  const savedWaterTemperatureHistory = JSON.parse(
    window.localStorage?.getItem(WATER_TEMP_HISTORY_KEY) || "null",
  );
  if (savedWaterTemperatureHistory && Array.isArray(savedWaterTemperatureHistory.points)) {
    waterTemperatureSessionKey = savedWaterTemperatureHistory.sessionKey || null;
    waterTemperatureHistory = savedWaterTemperatureHistory.points
      .filter((point) => Number.isFinite(point?.time) && Number.isFinite(point?.value));
  }
} catch {
  // A disabled or corrupt local store must not stop live telemetry rendering.
}

function saveWaterTemperatureHistory() {
  try {
    window.localStorage?.setItem(WATER_TEMP_HISTORY_KEY, JSON.stringify({
      sessionKey: waterTemperatureSessionKey,
      points: waterTemperatureHistory,
    }));
  } catch {
    // History remains available in memory when persistent storage is unavailable.
  }
}

function renderWaterTemperatureHistory() {
  if (!statusWaterTempLineEl || !statusWaterTempAreaEl) return;
  if (waterTemperatureHistory.length === 0) {
    statusEngineTempLineEl?.setAttribute("d", "");
    statusEngineTempAreaEl?.setAttribute("d", "");
    statusWaterTempLineEl.setAttribute("d", "");
    statusWaterTempAreaEl.setAttribute("d", "");
    setText(statusEngineTempStartEl, "--");
    setText(statusEngineTempCurrentEl, "--");
    setText(statusWaterTempStartEl, "--");
    setText(statusWaterTempCurrentEl, "--");
    return;
  }

  const values = waterTemperatureHistory.map((point) => point.value);
  setText(statusEngineTempStartEl, formatTemperature(values[0], 0));
  setText(statusEngineTempCurrentEl, formatTemperature(values[values.length - 1], 0));
  setText(statusWaterTempStartEl, formatTemperature(values[0], 0));
  setText(statusWaterTempCurrentEl, formatTemperature(values[values.length - 1], 0));
  const scaleMaximum = Math.max(50, Math.ceil(Math.max(...values) / 25) * 25);
  const firstTime = waterTemperatureHistory[0].time;
  const lastTime = waterTemperatureHistory[waterTemperatureHistory.length - 1].time;
  const timeSpan = Math.max(1, lastTime - firstTime);
  const coordinates = waterTemperatureHistory.map((point, index) => {
    const x = waterTemperatureHistory.length === 1
      ? 150
      : ((point.time - firstTime) / timeSpan) * 150;
    const y = 49 - (Math.max(0, Math.min(scaleMaximum, point.value)) / scaleMaximum) * 44;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  const linePath = coordinates;
  statusEngineTempLineEl?.setAttribute("d", linePath);
  statusEngineTempAreaEl?.setAttribute("d", `${linePath} L150 54 L0 54 Z`);
  statusWaterTempLineEl.setAttribute("d", linePath);
  statusWaterTempAreaEl.setAttribute("d", `${linePath} L150 54 L0 54 Z`);
  statusEngineTempScaleEls.forEach((element, index) => {
    const celsiusValue = scaleMaximum * (1 - index / 2);
    setText(element, formatTemperature(celsiusValue, 0, false).replace(/[^\d.-]/g, ""));
  });
  statusWaterTempScaleEls.forEach((element, index) => {
    const celsiusValue = scaleMaximum * (1 - index / 2);
    setText(element, formatTemperature(celsiusValue, 0, false).replace(/[^\d.-]/g, ""));
  });
  if (statusWaterTempChartEl) {
    const start = formatTemperature(values[0], 0);
    const current = formatTemperature(values[values.length - 1], 0);
    statusWaterTempChartEl.setAttribute(
      "aria-label",
      `Water temperature, start ${start}, current ${current}, last hour`,
    );
    statusEngineTempChartEl?.setAttribute(
      "aria-label",
      `Engine temperature, start ${start}, current ${current}, last hour`,
    );
  }
}

function recordWaterTemperature(value, sessionKey, now = Date.now()) {
  if (!Number.isFinite(value)) return;
  const normalizedSessionKey = sessionKey || null;
  let sessionChanged = false;
  if (waterTemperatureSessionKey !== normalizedSessionKey) {
    waterTemperatureSessionKey = normalizedSessionKey;
    waterTemperatureHistory = [];
    sessionChanged = true;
  }

  waterTemperatureHistory = waterTemperatureHistory.filter(
    (point) => point.time >= now - WATER_TEMP_HISTORY_MS && point.time <= now,
  );
  const lastPoint = waterTemperatureHistory[waterTemperatureHistory.length - 1];
  if (!lastPoint || now - lastPoint.time >= WATER_TEMP_SAMPLE_MS) {
    waterTemperatureHistory.push({ time: now, value });
  } else if (waterTemperatureHistory.length === 1) {
    waterTemperatureHistory.push({ time: now, value });
  } else {
    waterTemperatureHistory[waterTemperatureHistory.length - 1] = { time: now, value };
  }
  if (sessionChanged || now - lastWaterTemperatureHistorySaveAt >= WATER_TEMP_SAMPLE_MS) {
    saveWaterTemperatureHistory();
    lastWaterTemperatureHistorySaveAt = now;
  }
  renderWaterTemperatureHistory();
}

if (startupCollectorToggleEl && window.raceEngineer?.getStartupEnabled) {
  window.raceEngineer.getStartupEnabled().then((enabled) => {
    startupCollectorToggleEl.checked = Boolean(enabled);
  });
  startupCollectorToggleEl.addEventListener("change", async () => {
    startupCollectorToggleEl.disabled = true;
    try {
      startupCollectorToggleEl.checked = await window.raceEngineer.setStartupEnabled(
        startupCollectorToggleEl.checked,
      );
    } finally {
      startupCollectorToggleEl.disabled = false;
    }
  });
}
const pitTireChangeButtons = Array.from(document.querySelectorAll(".pit-tire-toggle[data-wheel]"));
const pitAllTiresToggleEl = document.querySelector("[data-pit-all-tires-toggle]");
const pitCarTearoffToggleEl = document.getElementById("pit-car-windscreen-tearoff");
const pitWindscreenTearoffEl = document.getElementById("pit-windscreen-tearoff");
const pitCrewTakeoverToggleEls = Array.from(document.querySelectorAll("[data-pit-crew-takeover-toggle]"));
const pitCrewTakeoverEl = document.getElementById("pit-crew-takeover");
const pitFastRepairToggleEls = Array.from(document.querySelectorAll("[data-pit-fast-repair-toggle]"));
const pitFastRepairEl = document.getElementById("pit-fast-repair");
const pitTireChangeEstimateEl = document.getElementById("pit-tire-change-estimate");
const pitSummaryTimeEl = document.getElementById("pit-summary-time");
const pitSummaryTiresEl = document.getElementById("pit-summary-tires");
const pitSummaryTireStateEl = document.getElementById("pit-summary-tire-state");
const pitSummaryRepairsEl = document.getElementById("pit-summary-repairs");
const pitSummaryStatusTextEl = document.getElementById("pit-summary-status-text");
const pitCarIcons = Array.from(document.querySelectorAll("[data-pit-car-icon]"));
const pitFuelAddEl = document.getElementById("pit-fuel-add");
const pitFuelGaugeEl = document.getElementById("pit-fuel-gauge");
const pitFuelAfterStopEl = document.getElementById("pit-fuel-after-stop");
const pitFuelPercentEl = document.getElementById("pit-fuel-percent");
const pitFuelScaleFillEl = document.getElementById("pit-fuel-scale-fill");
const pitFuelAddSummaryEl = document.getElementById("pit-fuel-add-summary");
const pitFuelAddedValueEl = document.getElementById("pit-fuel-added-value");
const pitFuelTotalValueEl = document.getElementById("pit-fuel-total-value");
const fuelCalStatusEl = document.getElementById("fuel-cal-status");
const fuelCalReserveEl = document.getElementById("fuel-cal-reserve");
const fuelCalModeButtons = Array.from(document.querySelectorAll("[data-fuel-mode]"));
const fuelCalTankFillEl = document.getElementById("fuel-cal-tank-fill");
const fuelCalRequiredMarkerEl = document.getElementById("fuel-cal-required-marker");
const fuelCalConfidenceEl = document.getElementById("fuel-cal-confidence");
let fuelCalMode = "balanced";
let latestFuelTelemetry = {};
let pitTireChangeEstimates = { 0: 0, 1: 5, 2: 10, 3: 15, 4: 20 };
const sessionTrackNameEl = document.getElementById("session-track-name");
const windSpeedEl = document.getElementById("wind-speed");
const windDirectionArrowEl = document.getElementById("wind-direction-arrow");
const humidityEl = document.getElementById("humidity");
const windDirectionEl = document.getElementById("wind-direction");
const airTempEl = document.getElementById("air-temp");
const trackTempEl = document.getElementById("track-temp");
const cloudCoverEl = document.getElementById("cloud-cover");
const rainStateEl = document.getElementById("rain-state");
const precipitationEl = document.getElementById("precipitation");
const fogEl = document.getElementById("fog");
const trackWetnessEl = document.getElementById("track-wetness");
const testWeatherDashboardEl = document.querySelector(".test-weather-dashboard");
const testWeatherTrackNameEl = document.getElementById("test-weather-track-name");
const testWeatherLiveStatusEl = document.getElementById("test-weather-live-status");
const testWeatherDetailLiveEl = document.getElementById("test-weather-detail-live");
const testWeatherPrecipitationEl = document.getElementById("test-weather-precipitation");
const testWeatherWindSpeedEl = document.getElementById("test-weather-wind-speed");
const testWeatherWindDirectionEl = document.getElementById("test-weather-wind-direction");
const testWeatherAirTempEl = document.getElementById("test-weather-air-temp");
const testWeatherHumidityEl = document.getElementById("test-weather-humidity");
const testWeatherTrackTempEl = document.getElementById("test-weather-track-temp");
const testWeatherWetnessEl = document.getElementById("test-weather-wetness");
const testWeatherSkiesEl = document.getElementById("test-weather-skies");
const testWeatherDeclaredWetEl = document.getElementById("test-weather-declared-wet");
const testWeatherMapStageEl = document.getElementById("test-weather-map-stage");
const testWeatherCloudLayerEl = document.getElementById("test-weather-cloud-layer");
const testWeatherRadarCanvasEl = document.getElementById("test-weather-radar-canvas");
const testWeatherRadarBadgeEl = document.getElementById("test-weather-radar-badge");
const testWeatherZoomToggleEl = document.getElementById("test-weather-zoom-toggle");
const testPitEl = document.querySelector(".test-pit");
const testStatusCopyEls = Array.from(document.querySelectorAll("[data-test-status-copy]"));
const carStatusSourceEl = document.querySelector(
  '[data-screen-panel="overview"] .car-status-module',
);
const testTireChangeStates = new Map();
const testTireChangePending = new Set();
const testTireChangeErrors = new Map();
const testTireChangeSyncAfter = new Map();

function updateTestTireToggleVisual(wheel) {
  testStatusCopyEls.forEach((target) => {
    const toggle = Array.from(target.querySelectorAll("[data-test-status-tire]"))
      .find((button) => button.dataset.testStatusTire === wheel);
    if (!toggle) return;
    const selected = testTireChangeStates.get(wheel) === true;
    toggle.setAttribute("aria-pressed", String(selected));
    toggle.disabled = testTireChangePending.has(wheel);
    toggle.classList.toggle("is-command-pending", testTireChangePending.has(wheel));
    toggle.classList.toggle("has-command-error", testTireChangeErrors.has(wheel));
    toggle.title = testTireChangeErrors.get(wheel)
      || `${wheel.toUpperCase()} tire change ${selected ? "selected" : "cleared"} in iRacing`;
  });
}

function syncTestTireChangesFromTelemetry(tireChanges) {
  if (!tireChanges || typeof tireChanges !== "object") return;
  Object.entries(tireChanges).forEach(([wheel, selected]) => {
    if (typeof selected !== "boolean") return;
    if (testTireChangePending.has(wheel)) return;
    if (Date.now() < (testTireChangeSyncAfter.get(wheel) || 0)) return;
    testTireChangeStates.set(wheel, selected);
    updateTestTireToggleVisual(wheel);
  });
}

function syncTestTireCompoundFromTelemetry(compound) {
  if (compound !== "dry" && compound !== "wet") return;
  document.querySelectorAll("[data-test-compound]").forEach((button) => {
    const isSelected = button.dataset.testCompound === compound;
    button.setAttribute("aria-pressed", String(isSelected));
    button.disabled = isSelected;
    button.classList.remove("has-command-error");
  });
}

async function selectTestTireCompound(compound, selectedButton, compoundGrid) {
  const compoundButtons = Array.from(
    compoundGrid.querySelectorAll("[data-test-compound]"),
  );
  compoundButtons.forEach((button) => {
    button.disabled = true;
    button.classList.remove("has-command-error");
  });

  try {
    const response = await fetch("/api/pit/tire-compound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compound }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    compoundButtons.forEach((button) => {
      const isSelected = button === selectedButton;
      button.setAttribute("aria-pressed", String(isSelected));
      button.disabled = isSelected;
    });
    ["lf", "rf", "lr", "rr"].forEach((wheel) => {
      testTireChangeStates.set(wheel, true);
      testTireChangeSyncAfter.set(wheel, Date.now() + 1500);
      updateTestTireToggleVisual(wheel);
    });
  } catch (error) {
    selectedButton.classList.add("has-command-error");
    selectedButton.title = error.message || "Unable to select tire compound in iRacing";
    compoundButtons.forEach((button) => { button.disabled = false; });
  }
}

async function toggleTestTireChange(wheel) {
  if (testTireChangePending.has(wheel)) return;
  const wasSelected = testTireChangeStates.get(wheel) === true;
  const enabled = !wasSelected;
  const telemetrySyncDeadline = Date.now() + 1500;
  ["lf", "rf", "lr", "rr"].forEach((position) => {
    testTireChangeSyncAfter.set(position, telemetrySyncDeadline);
  });
  testTireChangeStates.set(wheel, enabled);
  testTireChangePending.add(wheel);
  testTireChangeErrors.delete(wheel);
  updateTestTireToggleVisual(wheel);

  try {
    const response = await fetch("/api/pit/tire-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wheel, enabled }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    testTireChangeStates.set(wheel, enabled);
    const sourceToggle = pitTireChangeButtons.find((button) => button.dataset.wheel === wheel);
    sourceToggle?.setAttribute("aria-pressed", String(enabled));
  } catch (error) {
    testTireChangeErrors.set(
      wheel,
      error.message || "Unable to send tire-change command to iRacing",
    );
  } finally {
    testTireChangePending.delete(wheel);
    updateTestTireToggleVisual(wheel);
  }
}

async function toggleTestWindscreenTearoff(button) {
  if (button.classList.contains("is-command-pending")) return;
  const wasSelected = button.getAttribute("aria-pressed") === "true";
  const enabled = !wasSelected;
  button.classList.add("is-command-pending");
  button.classList.remove("has-command-error");
  button.disabled = true;
  button.setAttribute("aria-pressed", String(enabled));

  try {
    const response = await fetch("/api/pit/windscreen-tearoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    button.title = enabled
      ? "Windscreen tear-off selected in iRacing"
      : "Windscreen tear-off cleared in iRacing";
  } catch (error) {
    button.setAttribute("aria-pressed", String(wasSelected));
    button.classList.add("has-command-error");
    button.title = error.message || "Unable to send tear-off command to iRacing";
  } finally {
    button.classList.remove("is-command-pending");
    button.disabled = false;
  }
}

function renderTestStatusCopies() {
  if (!carStatusSourceEl) return;
  testStatusCopyEls.forEach((target) => {
    const statusCopy = carStatusSourceEl.cloneNode(true);
    statusCopy.querySelector(".section-label").textContent = target.dataset.copyTitle;
    statusCopy.querySelector(".tyre-connector-fr")
      ?.setAttribute("d", "M724 91H677V190H630");
    statusCopy.querySelector(".tyre-connector-rr")
      ?.setAttribute("d", "M724 536H684V452H645");
    statusCopy.querySelectorAll(".reference-corner > b").forEach((cornerLabel) => {
      cornerLabel.textContent = { FR: "RF", RL: "LR" }[cornerLabel.textContent.trim()]
        || cornerLabel.textContent;
    });
    statusCopy.querySelectorAll(".status-tyre").forEach((tireCard) => {
      tireCard.querySelector("span").textContent = "TIRE";
      tireCard.querySelector("small").remove();
      const wheel = tireCard.dataset.tire;
      const changeToggle = document.createElement("button");
      if (!testTireChangeStates.has(wheel)) {
        const sourceToggle = pitTireChangeButtons.find((button) => button.dataset.wheel === wheel);
        testTireChangeStates.set(
          wheel,
          sourceToggle?.getAttribute("aria-pressed") === "true",
        );
      }
      const isSelected = testTireChangeStates.get(wheel);
      changeToggle.type = "button";
      changeToggle.className = "test-status-tire-toggle";
      changeToggle.dataset.testStatusTire = wheel;
      changeToggle.setAttribute("aria-pressed", String(isSelected));
      changeToggle.setAttribute("aria-label", `Toggle ${wheel.toUpperCase()} tire change`);
      changeToggle.disabled = testTireChangePending.has(wheel);
      changeToggle.classList.toggle("is-command-pending", testTireChangePending.has(wheel));
      changeToggle.classList.toggle("has-command-error", testTireChangeErrors.has(wheel));
      changeToggle.title = testTireChangeErrors.get(wheel)
        || `${wheel.toUpperCase()} tire change ${isSelected ? "selected" : "cleared"} in iRacing`;
      changeToggle.textContent = "CHANGE";
      changeToggle.addEventListener("click", () => toggleTestTireChange(wheel));
      tireCard.querySelector("strong").replaceWith(changeToggle);
    });
    statusCopy.querySelectorAll(".corner-wear em").forEach((estimate) => {
      const label = document.createElement("span");
      const value = document.createElement("b");
      label.textContent = "EST.";
      value.textContent = "+2.5 S";
      estimate.style.setProperty("display", "inline-flex", "important");
      estimate.style.setProperty("opacity", "1", "important");
      estimate.style.setProperty("visibility", "visible", "important");
      estimate.style.setProperty("color", "#54cde1", "important");
      label.style.setProperty("color", "#54cde1", "important");
      label.style.setProperty("opacity", "1", "important");
      value.style.setProperty("color", "#ffffff", "important");
      value.style.setProperty("opacity", "1", "important");
      estimate.replaceChildren(label, value);
    });
    const repairButtonSource = document.querySelector(
      ".test-pit > .test-pit-car-grid .test-repair",
    );
    const copiedCarGrid = statusCopy.querySelector(".reference-car-status");
    if (repairButtonSource && copiedCarGrid) {
      const repairButton = repairButtonSource.cloneNode(true);
      const rightTireStack = document.createElement("div");
      rightTireStack.className = "test-right-tire-stack";
      const compoundGroup = document.createElement("div");
      compoundGroup.className = "test-compound-group";
      const rightFront = copiedCarGrid.querySelector(".reference-corner-fr");
      const rightRear = copiedCarGrid.querySelector(".reference-corner-rr");
      if (rightFront) rightTireStack.append(rightFront);
      ["DRY", "WET"].forEach((compound) => {
        const compoundButton = document.createElement("button");
        compoundButton.type = "button";
        compoundButton.className = `test-compound-card test-compound-card-${compound.toLowerCase()}`;
        compoundButton.dataset.testCompound = compound.toLowerCase();
        compoundButton.setAttribute("aria-pressed", "false");
        compoundButton.textContent = compound;
        compoundButton.addEventListener("click", () => {
          if (compoundButton.disabled) return;
          selectTestTireCompound(compound.toLowerCase(), compoundButton, copiedCarGrid);
        });
        compoundGroup.append(compoundButton);
      });
      rightTireStack.append(compoundGroup);
      if (rightRear) rightTireStack.append(rightRear);
      copiedCarGrid.append(rightTireStack);
      copiedCarGrid.append(repairButton);
      const topRepairButton = repairButton.cloneNode(true);
      topRepairButton.classList.add("test-repair-top");
      topRepairButton.classList.add("test-windscreen-tearoff");
      topRepairButton.removeAttribute("data-test-service-toggle");
      topRepairButton.hidden = false;
      topRepairButton.setAttribute("aria-hidden", "false");
      topRepairButton.setAttribute("aria-label", "Toggle windshield tearoff");
      topRepairButton.querySelector("span").innerHTML = [
        '<svg viewBox="0 0 32 24" aria-hidden="true" focusable="false">',
        '<path d="M5 19 8 6h16l3 13H5Z"></path>',
        '<path d="M9 16c4-4 10-5 15-2"></path>',
        "</svg>",
      ].join("");
      topRepairButton.querySelector("b").textContent = "WINDSHIELD";
      topRepairButton.querySelector("small").textContent = "TEAROFF";
      copiedCarGrid.append(topRepairButton);
      repairButton.addEventListener("click", () => {
        const isSelected = repairButton.getAttribute("aria-pressed") === "true";
        repairButton.setAttribute("aria-pressed", String(!isSelected));
      });
      topRepairButton.addEventListener(
        "click",
        () => toggleTestWindscreenTearoff(topRepairButton),
      );
    }
    statusCopy.querySelectorAll("[id]").forEach((element) => {
      element.dataset.sourceId = element.id;
      element.removeAttribute("id");
    });
    statusCopy.querySelectorAll("[aria-describedby]").forEach(
      (element) => element.removeAttribute("aria-describedby"),
    );
    statusCopy.setAttribute("aria-label", target.dataset.copyTitle);
    target.replaceChildren(statusCopy);
  });
}

function syncTestStatusCopyTelemetry() {
  if (!carStatusSourceEl) return;
  const sourceElements = Array.from(carStatusSourceEl.querySelectorAll("[id]"));
  testStatusCopyEls.forEach((target) => {
    const copyElements = new Map(
      Array.from(target.querySelectorAll("[data-source-id]"))
        .map((element) => [element.dataset.sourceId, element]),
    );
    sourceElements.forEach((source) => {
      const copy = copyElements.get(source.id);
      if (!copy || copy.closest(".status-tyre, .corner-wear")) return;
      if (source.children.length === 0) copy.textContent = source.textContent;
      ["style", "d", "data-state", "aria-label"].forEach((attribute) => {
        if (source.hasAttribute(attribute)) {
          copy.setAttribute(attribute, source.getAttribute(attribute));
        } else {
          copy.removeAttribute(attribute);
        }
      });
    });
  });
}

renderTestStatusCopies();
if (carStatusSourceEl) {
  let testStatusCopyFrame = null;
  new window.MutationObserver(() => {
    if (testStatusCopyFrame != null) return;
    testStatusCopyFrame = requestAnimationFrame(() => {
      testStatusCopyFrame = null;
      syncTestStatusCopyTelemetry();
    });
  }).observe(carStatusSourceEl, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });
}

testPitEl?.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-test-tire], [data-test-service-toggle]");
  if (!toggle) return;
  const isSelected = toggle.getAttribute("aria-pressed") === "true";
  toggle.setAttribute("aria-pressed", String(!isSelected));
  toggle.classList.toggle("is-selected", !isSelected);
});

document.getElementById("test-pit-now")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.classList.toggle("is-confirmed");
  button.querySelector("strong").textContent = button.classList.contains("is-confirmed")
    ? "Pit stop confirmed ✓"
    : "Pit now →";
});
const mapWatchingEl = document.getElementById("map-watching");
const leaderboardListEl = document.getElementById("leaderboard-list");
const leaderboardClassFiltersEl = document.getElementById("leaderboard-class-filters");
const mapClassFiltersEl = document.getElementById("map-class-filters");
const switchTrackMapEl = document.getElementById("switch-track-map");
const mainMapTitleEl = document.getElementById("main-map-title");
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
let currentTrackName = null;
const trackGeometryCache = new WeakMap();
const followMapStateCache = new WeakMap();
const mapCarSampleHistory = new Map();
let mapSampleClock = null;
let isTestWeatherZoomedOut = false;
let testWeatherRadarFrame = null;
let testWeatherRadarLastDrawAt = 0;
const testWeatherRadarSurfaceEl = document.createElement("canvas");
const testWeatherRadarState = {
  precipitation: null,
  rainState: "none",
  windSpeed: 0,
  windDirection: 90,
  hasRecentTelemetry: false,
};

function setText(element, value) {
  if (element && element.textContent !== String(value)) {
    element.textContent = value;
  }
}

function updatePitFuelPreview() {
  const fuelAtEntry = 12.4;
  const tankCapacity = 120;
  const requestedFuel = Number(pitFuelAddEl?.value);
  const fuelAdded = Number.isFinite(requestedFuel) ? Math.max(0, requestedFuel) : 0;
  const fuelAfterStop = Math.min(tankCapacity, fuelAtEntry + fuelAdded);
  const fuelPercent = (fuelAfterStop / tankCapacity) * 100;

  setText(pitFuelAfterStopEl, fuelAfterStop.toFixed(1));
  setText(pitFuelPercentEl, `L \u00b7 ${fuelPercent.toFixed(1)}% full`);
  setText(pitFuelAddSummaryEl, `+${fuelAdded.toFixed(1)} L`);
  setText(pitFuelAddedValueEl, `${fuelAdded.toFixed(1)} L`);
  setText(pitFuelTotalValueEl, `${fuelAfterStop.toFixed(1)} L`);
  pitFuelGaugeEl?.style.setProperty("--fuel-level", `${fuelPercent}%`);
  pitFuelGaugeEl?.style.setProperty("--fuel-arc-level", `${fuelPercent * 0.75}%`);
  if (pitFuelScaleFillEl) pitFuelScaleFillEl.style.width = `${fuelPercent}%`;
  if (pitFuelGaugeEl) {
    pitFuelGaugeEl.setAttribute(
      "aria-label",
      `Fuel after stop: ${fuelAfterStop.toFixed(1)} litres, ${fuelPercent.toFixed(1)} percent full`,
    );
  }
  document.getElementById("pit-fuel-equation")?.setAttribute(
    "aria-label",
    `${fuelAtEntry.toFixed(1)} litres at pit entry plus ${fuelAdded.toFixed(1)} litres added equals ${fuelAfterStop.toFixed(1)} litres after the stop`,
  );
}

pitFuelAddEl?.addEventListener("input", updatePitFuelPreview);
updatePitFuelPreview();

fuelCalModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    fuelCalMode = button.dataset.fuelMode || "balanced";
    fuelCalModeButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    renderFuelCalculator(latestFuelTelemetry);
  });
});

fuelCalReserveEl?.addEventListener("change", () => {
  renderFuelCalculator(latestFuelTelemetry);
});

function updatePitTireChangeEstimate() {
  const selectedTireCount = pitTireChangeButtons.filter(
    (button) => button.getAttribute("aria-pressed") === "true",
  ).length;
  const estimatedSeconds = Number(pitTireChangeEstimates[selectedTireCount]);
  setText(pitTireChangeEstimateEl, `EST: ${estimatedSeconds.toFixed(1)} s`);
  setText(pitSummaryTimeEl, `${estimatedSeconds.toFixed(1)} s`);
  setText(pitSummaryTiresEl, `${selectedTireCount} / 4`);
  setText(pitSummaryTireStateEl, selectedTireCount > 0 ? "New" : "None");
  setText(
    pitSummaryStatusTextEl,
    selectedTireCount > 0 || pitFastRepairEl?.checked
      ? "All requested services are configured."
      : "Pit services ready.",
  );
}

function syncPitAllTiresToggle() {
  const allSelected = pitTireChangeButtons.length > 0 && pitTireChangeButtons.every(
    (button) => button.getAttribute("aria-pressed") === "true",
  );
  pitAllTiresToggleEl?.setAttribute("aria-pressed", String(allSelected));
}

pitTireChangeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const wasSelected = button.getAttribute("aria-pressed") === "true";
    const enabled = !wasSelected;
    const wheel = button.dataset.wheel;
    const wheelLabel = { lf: "FL", rf: "FR", lr: "RL", rr: "RR" }[wheel] || wheel.toUpperCase();
    button.disabled = true;
    button.classList.add("is-command-pending");
    button.classList.remove("has-command-error");

    try {
      const response = await fetch("/api/pit/tire-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wheel, enabled }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      button.setAttribute("aria-pressed", String(enabled));
      updatePitTireChangeEstimate();
      syncPitAllTiresToggle();
      button.title = enabled
        ? `${wheelLabel} tire change selected in iRacing`
        : `${wheelLabel} tire change cleared in iRacing`;
    } catch (error) {
      button.setAttribute("aria-pressed", String(wasSelected));
      button.classList.add("has-command-error");
      button.title = error.message || "Unable to send pit command to iRacing";
    } finally {
      button.classList.remove("is-command-pending");
      button.disabled = !pitCrewTakeoverEl?.checked;
    }
  });
});

pitAllTiresToggleEl?.addEventListener("click", async () => {
  if (pitAllTiresToggleEl.disabled) return;
  const enabled = pitAllTiresToggleEl.getAttribute("aria-pressed") !== "true";
  const previousStates = new Map(
    pitTireChangeButtons.map((button) => [button, button.getAttribute("aria-pressed")]),
  );
  pitAllTiresToggleEl.disabled = true;
  pitAllTiresToggleEl.classList.remove("has-command-error");
  pitTireChangeButtons.forEach((button) => {
    button.disabled = true;
    button.classList.add("is-command-pending");
  });

  try {
    const response = await fetch("/api/pit/tire-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wheel: "all", enabled }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    pitTireChangeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(enabled));
      button.classList.remove("has-command-error");
    });
    pitAllTiresToggleEl.setAttribute("aria-pressed", String(enabled));
    pitAllTiresToggleEl.title = enabled
      ? "All tire changes selected in iRacing"
      : "All tire changes cleared in iRacing";
  } catch (error) {
    previousStates.forEach((state, button) => button.setAttribute("aria-pressed", state));
    pitAllTiresToggleEl.classList.add("has-command-error");
    pitAllTiresToggleEl.title = error.message || "Unable to send tire commands to iRacing";
    syncPitAllTiresToggle();
  } finally {
    pitTireChangeButtons.forEach((button) => {
      button.classList.remove("is-command-pending");
      button.disabled = !pitCrewTakeoverEl?.checked;
    });
    pitAllTiresToggleEl.disabled = !pitCrewTakeoverEl?.checked;
    updatePitTireChangeEstimate();
  }
});

syncPitAllTiresToggle();

function syncPitWindscreenTearoff() {
  pitCarTearoffToggleEl?.setAttribute(
    "aria-pressed",
    String(Boolean(pitWindscreenTearoffEl?.checked)),
  );
}

async function setPitWindscreenTearoff(enabled) {
  const wasSelected = pitCarTearoffToggleEl?.getAttribute("aria-pressed") === "true";
  if (pitCarTearoffToggleEl) pitCarTearoffToggleEl.disabled = true;
  if (pitWindscreenTearoffEl) pitWindscreenTearoffEl.disabled = true;
  pitCarTearoffToggleEl?.classList.remove("has-command-error");

  try {
    const response = await fetch("/api/pit/windscreen-tearoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    pitCarTearoffToggleEl?.setAttribute("aria-pressed", String(enabled));
    if (pitWindscreenTearoffEl) pitWindscreenTearoffEl.checked = enabled;
    if (pitCarTearoffToggleEl) {
      pitCarTearoffToggleEl.title = enabled
        ? "Windscreen tear-off selected in iRacing"
        : "Windscreen tear-off cleared in iRacing";
    }
  } catch (error) {
    pitCarTearoffToggleEl?.setAttribute("aria-pressed", String(wasSelected));
    if (pitWindscreenTearoffEl) pitWindscreenTearoffEl.checked = wasSelected;
    pitCarTearoffToggleEl?.classList.add("has-command-error");
    if (pitCarTearoffToggleEl) {
      pitCarTearoffToggleEl.title = error.message || "Unable to send pit command to iRacing";
    }
  } finally {
    if (pitCarTearoffToggleEl) pitCarTearoffToggleEl.disabled = !pitCrewTakeoverEl?.checked;
    if (pitWindscreenTearoffEl) pitWindscreenTearoffEl.disabled = !pitCrewTakeoverEl?.checked;
  }
}

pitCarTearoffToggleEl?.addEventListener("click", () => {
  const enabled = pitCarTearoffToggleEl.getAttribute("aria-pressed") !== "true";
  setPitWindscreenTearoff(enabled);
});
pitWindscreenTearoffEl?.addEventListener("change", () => {
  setPitWindscreenTearoff(pitWindscreenTearoffEl.checked);
});
syncPitWindscreenTearoff();

function syncPitCrewTakeover() {
  const hasControl = Boolean(pitCrewTakeoverEl?.checked);
  pitCrewTakeoverToggleEls.forEach((button) => {
    button.setAttribute("aria-pressed", String(hasControl));
    button.setAttribute(
      "aria-label",
      hasControl ? "Release pit crew controls" : "Take over pit crew controls",
    );
    button.title = hasControl ? "Release pit crew controls" : "Take over pit crew controls";
    const label = button.querySelector("[data-pit-crew-takeover-label]");
    if (label) {
      label.replaceChildren(
        document.createTextNode(hasControl ? "Release" : "Take over"),
        document.createElement("br"),
        document.createTextNode("pit crew"),
      );
    }
  });
  pitTireChangeButtons.forEach((button) => { button.disabled = !hasControl; });
  if (pitAllTiresToggleEl) pitAllTiresToggleEl.disabled = !hasControl;
  if (pitCarTearoffToggleEl) pitCarTearoffToggleEl.disabled = !hasControl;
  if (pitWindscreenTearoffEl) pitWindscreenTearoffEl.disabled = !hasControl;
  if (pitFuelAddEl) pitFuelAddEl.disabled = !hasControl;
}

pitCrewTakeoverToggleEls.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!pitCrewTakeoverEl) return;
    const takingControl = !pitCrewTakeoverEl.checked;
    button.disabled = true;
    button.classList.remove("has-command-error");
    try {
      if (takingControl) {
        const response = await fetch("/api/iracing/take-seat", { method: "POST" });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
      } else {
        const response = await fetch("/api/iracing/leave-seat", { method: "POST" });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
      }
      pitCrewTakeoverEl.checked = takingControl;
      syncPitCrewTakeover();
    } catch (error) {
      button.classList.add("has-command-error");
      button.title = error.message || `Unable to activate ${takingControl ? "Take Seat" : "Leave Seat"} in iRacing`;
    } finally {
      button.disabled = false;
    }
  });
});
pitCrewTakeoverEl?.addEventListener("change", syncPitCrewTakeover);
syncPitCrewTakeover();

function syncPitFastRepair() {
  pitFastRepairToggleEls.forEach((button) => {
    button.setAttribute("aria-pressed", String(Boolean(pitFastRepairEl?.checked)));
  });
  setText(pitSummaryRepairsEl, pitFastRepairEl?.checked ? "✓ Selected" : "✓ None");
  updatePitTireChangeEstimate();
}

function formatFastRepairsRemaining(limit, used) {
  if (String(limit || "").trim().toLowerCase() === "unlimited") return "∞";
  const numericLimit = Number(limit);
  const numericUsed = Number(used);
  if (!Number.isFinite(numericLimit) || !Number.isFinite(numericUsed)) return "--";
  return String(Math.max(0, Math.floor(numericLimit - numericUsed)));
}

pitFastRepairToggleEls.forEach((button) => {
  button.addEventListener("click", () => {
    if (!pitFastRepairEl || button.disabled) return;
    pitFastRepairEl.checked = !pitFastRepairEl.checked;
    syncPitFastRepair();
  });
});
pitFastRepairEl?.addEventListener("change", syncPitFastRepair);
syncPitFastRepair();

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
  } catch {
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
      } catch {
        // Fallback: set innerHTML if outerHTML fails
        el.innerHTML = svgText;
      }
      fitTrackMapToContent(document.getElementById("track-map"));
      arrangeTrackMaps();
      syncPitExitMapLayers();
      syncTestWeatherMapLayers();

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

const tabs = Array.from(document.querySelectorAll(".tab"));
const screens = Array.from(document.querySelectorAll(".screen"));
const carStatusModuleEl = document.querySelector(".car-status-module");
const carStatusPanelEl = document.querySelector("[data-car-status-panel]");
const carStatusTargetEl = document.querySelector("[data-car-status-target]");
if (carStatusModuleEl && carStatusPanelEl && carStatusTargetEl) {
  carStatusTargetEl.prepend(carStatusModuleEl);
  carStatusPanelEl.classList.add("is-car-status-relocated");
}

let activeScreen = isOverlayMode ? requestedOverlayScreen : "overview";
let screenActivationVersion = 0;
let screenActivationPending = false;
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
let lastAuxiliaryMapRenderAt = 0;
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
let replayTimingAnchor = null;
const OIL_TEMPERATURE_HISTORY_MS = 60 * 60 * 1000;
const OIL_TEMPERATURE_SAMPLE_MS = 5000;
const OIL_TEMPERATURE_STORAGE_KEY = "raceEngineerOilTemperatureHistory";
let oilTemperatureSessionKey = null;
let oilTemperatureHistory = [];
const DEFAULT_UNIT_PREFERENCES = Object.freeze({
  speed: "kmh",
  temperature: "celsius",
  pressure: "bar",
  fuel: "liters",
});
let unitPreferences = { ...DEFAULT_UNIT_PREFERENCES };

try {
  const savedPreferences = JSON.parse(localStorage.getItem("raceEngineerUnitPreferences") || "null");
  if (savedPreferences && typeof savedPreferences === "object") {
    unitPreferences = { ...unitPreferences, ...savedPreferences };
  } else if (localStorage.getItem("raceEngineerUnitSystem") === "us") {
    unitPreferences = { speed: "mph", temperature: "fahrenheit", pressure: "psi", fuel: "us-gallons" };
  }
} catch {
  // Keep the defaults when persistent browser storage is unavailable.
}

const HEAVY_RENDER_INTERVAL_MS = 100;
const MAP_RENDER_INTERVAL_MS = 1000 / 60;
const AUXILIARY_MAP_RENDER_INTERVAL_MS = MAP_RENDER_INTERVAL_MS;
const LEADERBOARD_POSITION_ANIMATION_MS = 520;
const FOLLOW_MAP_ROAD_INTERVAL_MS = MAP_RENDER_INTERVAL_MS;
const VIEWED_EVENTS_STORAGE_KEY = "race-engineer.viewed-events.v1";
const SAVED_EVENTS_STORAGE_KEY = "race-engineer.saved-events.v1";

const TRACK_MAP_LABELS = {
  "track-map": "Track Map",
  "pit-exit-map": "Pit Exit Prediction",
  "follow-map": "Dynamic Map",
};

function getTrackMapLabel(mapId, pitExitPrediction = null) {
  if (mapId !== "pit-exit-map") return TRACK_MAP_LABELS[mapId];
  const position = Number(pitExitPrediction?.position);
  return `Pit Exit Prediction -${Number.isInteger(position) && position > 0 ? ` P${position}` : ""}`;
}

function refreshTrackMapLabels(pitExitPrediction = null) {
  const stages = [
    [document.querySelector(".trackmap-stage"), mainMapTitleEl],
    [document.querySelector(".pit-exit-map-stage"), primaryMapTitleEl],
    [document.querySelector(".dynamic-map-stage"), secondaryMapTitleEl],
  ];
  stages.forEach(([stage, title]) => {
    const mapId = stage?.querySelector(":scope > svg[id]")?.id;
    if (mapId && title) setText(title, getTrackMapLabel(mapId, pitExitPrediction));
  });
}

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

  const pitExitPrediction = latestSnapshot?.telemetry?.pit_exit_prediction || null;
  const mainLabel = getTrackMapLabel(layout.main.id, pitExitPrediction);
  refreshTrackMapLabels(pitExitPrediction);
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

testWeatherZoomToggleEl?.addEventListener("click", () => {
  isTestWeatherZoomedOut = !isTestWeatherZoomedOut;
  testWeatherZoomToggleEl.setAttribute("aria-pressed", String(isTestWeatherZoomedOut));
  testWeatherZoomToggleEl.setAttribute(
    "aria-label",
    isTestWeatherZoomedOut ? "Restore normal track map zoom" : "Zoom track map out three times",
  );
  testWeatherZoomToggleEl.setAttribute(
    "title",
    isTestWeatherZoomedOut ? "Restore normal zoom" : "Zoom track map out 3×",
  );
  syncTestWeatherMapLayers();
});

function loadViewedEventKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem(VIEWED_EVENTS_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

const viewedEventKeys = loadViewedEventKeys();
const savedEventKeys = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_EVENTS_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
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
  } catch {
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
  } catch {
    // Saving still works for this page load if storage is blocked.
  }
  syncEventGroupSaved(button?.closest(".event-group"), event);
  if (leaderboardEventFilter === "saved") {
    lastEventRenderSignature = "";
    renderLeaderboardEvents();
  }
}

tabs.forEach((tab) => {
  tab.title = "Højreklik for at åbne som overlay";
  tab.addEventListener("click", () => {
    const nextScreen = tab.dataset.screen;
    if (nextScreen) {
      setActiveScreen(nextScreen);
    }
  });
  tab.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const nextScreen = tab.dataset.screen;
    if (OVERLAY_SCREENS.has(nextScreen)) window.raceEngineer?.openOverlay?.(nextScreen);
  });
});

function syncOverlayLock(locked) {
  if (!isOverlayMode || !overlayLockEl) return;
  overlayLockEl.classList.toggle("is-locked", locked);
  overlayLockEl.setAttribute("aria-pressed", String(locked));
  overlayLockEl.setAttribute(
    "aria-label",
    locked ? "Unlock overlay position" : "Lock overlay position",
  );
  overlayLockEl.textContent = locked ? "Position locked · Ctrl+Shift+O" : "Lock position";
}

function syncOverlayFullscreen(isFullscreen) {
  if (!isOverlayMode || !overlayFullscreenEl) return;
  overlayFullscreenEl.classList.toggle("is-active", isFullscreen);
  overlayFullscreenEl.setAttribute("aria-pressed", String(isFullscreen));
  overlayFullscreenEl.textContent = isFullscreen ? "Exit full" : "Fullscreen";
}

if (isOverlayMode) {
  setText(overlayTitleEl, `${TRACK_MAP_LABELS[requestedOverlayScreen] || tabs.find((tab) => (
    tab.dataset.screen === requestedOverlayScreen
  ))?.textContent || "Race-Engineer"} Overlay`);
  overlayLockEl?.addEventListener("click", async () => {
    const locked = overlayLockEl.getAttribute("aria-pressed") !== "true";
    syncOverlayLock(await window.raceEngineer?.setOverlayLocked?.(locked));
  });
  overlayFullscreenEl?.addEventListener("click", async () => {
    syncOverlayFullscreen(await window.raceEngineer?.toggleOverlayFullscreen?.());
  });
  overlayFullscreenEl?.addEventListener("pointerdown", (event) => event.stopPropagation());
  overlayCloseEl?.addEventListener("click", () => window.raceEngineer?.closeOverlay?.());
  overlayOpacityEl?.addEventListener("input", () => {
    window.raceEngineer?.setOverlayOpacity?.(Number(overlayOpacityEl.value) / 100);
  });
  window.raceEngineer?.onOverlayLockChanged?.(syncOverlayLock);
  window.raceEngineer?.onOverlayFullscreenChanged?.(syncOverlayFullscreen);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "F11") return;
    event.preventDefault();
    overlayFullscreenEl?.click();
  });
  window.raceEngineer?.onOverlayScreenChanged?.((screenName) => {
    if (!OVERLAY_SCREENS.has(screenName)) return;
    activeScreen = screenName;
    setActiveScreen(screenName);
    const label = tabs.find((tab) => tab.dataset.screen === screenName)?.textContent || "Race-Engineer";
    setText(overlayTitleEl, `${label} Overlay`);
  });
}

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

function setUnitDropdownOpen(control, isOpen) {
  if (!control) return;
  if (isOpen) {
    unitDropdowns.forEach((candidate) => {
      if (candidate !== control) setUnitDropdownOpen(candidate, false);
    });
    refreshRateControls.forEach((candidate) => setRefreshRateMenuOpen(candidate, false));
  }
  control.querySelector(".unit-dropdown-toggle")
    ?.setAttribute("aria-expanded", String(isOpen));
  control.querySelector(".unit-dropdown-menu")
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
  if (!control?.closest(".unit-modal")) setUnitSettingsOpen(false);
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

function setUnitSettingsOpen(isOpen) {
  if (!unitSettingsModalEl) return;
  if (!isOpen) unitDropdowns.forEach((control) => setUnitDropdownOpen(control, false));
  unitSettingsEl?.classList.toggle("is-open", isOpen);
  unitSettingsModalEl.classList.toggle("is-open", isOpen);
  unitSettingsModalEl.setAttribute("aria-hidden", String(!isOpen));
  unitSettingsToggleEl?.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("has-unit-modal", isOpen);
  if (isOpen) {
    syncUnitSettings();
    requestAnimationFrame(() => unitSettingsPanelEl?.focus());
  } else if (document.activeElement && unitSettingsModalEl.contains(document.activeElement)) {
    unitSettingsToggleEl?.focus();
  }
}

function syncUnitSettings() {
  unitPreferenceSelects.forEach((select) => {
    const preference = select.dataset.unitPreference;
    if (preference && unitPreferences[preference]) select.value = unitPreferences[preference];
  });
  unitDropdowns.forEach((control) => {
    const preference = control.dataset.unitDropdown;
    const selectedValue = unitPreferences[preference];
    const selectedOption = Array.from(control.querySelectorAll(".unit-dropdown-option"))
      .find((option) => option.dataset.value === selectedValue);
    setText(control.querySelector(".unit-dropdown-value"), selectedOption?.textContent || "--");
    control.querySelectorAll(".unit-dropdown-option").forEach((option) => {
      const isSelected = option.dataset.value === selectedValue;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-selected", String(isSelected));
    });
  });
  const isMetricPreset = unitPreferences.speed === "kmh"
    && unitPreferences.temperature === "celsius"
    && unitPreferences.pressure === "bar"
    && unitPreferences.fuel === "liters";
  const isUsPreset = unitPreferences.speed === "mph"
    && unitPreferences.temperature === "fahrenheit"
    && unitPreferences.pressure === "psi"
    && unitPreferences.fuel === "us-gallons";
  unitPresetButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.unitPreset === "metric" ? isMetricPreset : isUsPreset);
  });
  const usesFahrenheit = unitPreferences.temperature === "fahrenheit";
  setText(speedUnitLabelEl, `Speed · ${unitPreferences.speed === "mph" ? "mph" : "km/h"}`);
  temperatureUnitEls.forEach((element) => setText(element, usesFahrenheit ? "°F" : "°C"));
  const pressureUnitLabel = unitPreferences.pressure === "psi"
    ? "psi"
    : unitPreferences.pressure === "kpa" ? "kPa" : "bar";
  pressureUnitEls.forEach((element) => setText(element, pressureUnitLabel));
  const pressureScaleBarValues = [2.5, 2, 1.5, 1];
  Object.values(statusTirePressureGauges).forEach((gauge) => {
    gauge.querySelectorAll(".pressure-tick").forEach((tick, index) => {
      const valueBar = pressureScaleBarValues[index];
      setText(tick, unitPreferences.pressure === "psi"
        ? (valueBar * 14.50377).toFixed(0)
        : unitPreferences.pressure === "kpa"
          ? (valueBar * 100).toFixed(0)
          : valueBar.toFixed(1));
    });
  });
  const scaleValues = usesFahrenheit
    ? [32, 68, 104, 140, 176, 212, 248, 284]
    : [0, 20, 40, 60, 80, 100, 120, 140];
  engineTemperatureScaleEls.forEach((element, index) => setText(element, scaleValues[index]));
}

function saveUnitPreferences() {
  try {
    localStorage.setItem("raceEngineerUnitPreferences", JSON.stringify(unitPreferences));
  } catch {
    // The choices still apply for the current session.
  }
  syncUnitSettings();
  if (latestSnapshot) scheduleRender(latestSnapshot);
}

function temperatureForDisplay(value) {
  return unitPreferences.temperature === "fahrenheit" ? (value * 9 / 5) + 32 : value;
}

function saveOilTemperatureHistory() {
  try {
    localStorage.setItem(OIL_TEMPERATURE_STORAGE_KEY, JSON.stringify({
      sessionKey: oilTemperatureSessionKey,
      samples: oilTemperatureHistory,
    }));
  } catch {
    // The in-memory history remains available if browser storage is unavailable.
  }
}

function resetOilTemperatureHistory(sessionKey) {
  oilTemperatureSessionKey = sessionKey || null;
  oilTemperatureHistory = [];
  try {
    const saved = JSON.parse(localStorage.getItem(OIL_TEMPERATURE_STORAGE_KEY) || "null");
    if (saved?.sessionKey === oilTemperatureSessionKey && Array.isArray(saved.samples)) {
      oilTemperatureHistory = saved.samples.filter((sample) => (
        Array.isArray(sample)
        && Number.isFinite(sample[0])
        && Number.isFinite(sample[1])
        && Date.now() - sample[0] <= OIL_TEMPERATURE_HISTORY_MS
      ));
    }
  } catch {
    // Start with an empty history when saved data cannot be read.
  }
}

function renderOilTemperatureHistory(value, sessionKey, now = Date.now()) {
  const nextSessionKey = sessionKey || oilTemperatureSessionKey;
  if (oilTemperatureSessionKey !== nextSessionKey) resetOilTemperatureHistory(nextSessionKey);

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    const lastSample = oilTemperatureHistory.at(-1);
    if (!lastSample || now - lastSample[0] >= OIL_TEMPERATURE_SAMPLE_MS) {
      oilTemperatureHistory.push([now, numericValue]);
      saveOilTemperatureHistory();
    } else {
      lastSample[1] = numericValue;
    }
  }

  const cutoff = now - OIL_TEMPERATURE_HISTORY_MS;
  oilTemperatureHistory = oilTemperatureHistory.filter((sample) => sample[0] >= cutoff);
  const samples = oilTemperatureHistory;
  const hasHistory = samples.length > 0;
  [statusOilTempStartEl, statusOilTempCurrentEl].forEach((element) => {
    element?.classList.toggle("is-visible", hasHistory);
  });
  if (!hasHistory) {
    statusOilTempLineEl?.setAttribute("d", "");
    statusOilTempAreaEl?.setAttribute("d", "");
    statusOilTempChartEl?.setAttribute("aria-label", "Oil temperature history unavailable");
    return;
  }

  const displaySamples = samples.map(([timestamp, temperature]) => [
    timestamp,
    temperatureForDisplay(temperature),
  ]);
  const values = displaySamples.map((sample) => sample[1]);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max(5, (rawMax - rawMin) * 0.15);
  const scaleMin = Math.floor((rawMin - padding) / 5) * 5;
  const scaleMax = Math.ceil((rawMax + padding) / 5) * 5;
  const timeMin = displaySamples[0][0];
  const timeMax = Math.max(now, timeMin + 1);
  const points = displaySamples.map(([timestamp, temperature]) => {
    const x = ((timestamp - timeMin) / (timeMax - timeMin)) * 150;
    const y = 49 - ((temperature - scaleMin) / (scaleMax - scaleMin)) * 44;
    return [Math.max(0, Math.min(150, x)), Math.max(5, Math.min(49, y))];
  });
  const linePath = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const [startX, startY] = points[0];
  const [currentX, currentY] = points.at(-1);
  statusOilTempLineEl?.setAttribute("d", linePath);
  statusOilTempAreaEl?.setAttribute("d", `${linePath} L${currentX.toFixed(2)} 54 L${startX.toFixed(2)} 54 Z`);
  statusOilTempStartEl?.setAttribute("cx", startX.toFixed(2));
  statusOilTempStartEl?.setAttribute("cy", startY.toFixed(2));
  statusOilTempCurrentEl?.setAttribute("cx", currentX.toFixed(2));
  statusOilTempCurrentEl?.setAttribute("cy", currentY.toFixed(2));
  const scaleMiddle = (scaleMax + scaleMin) / 2;
  [scaleMax, scaleMiddle, scaleMin].forEach((scaleValue, index) => {
    setText(statusOilTempScaleEls[index], formatNumber(scaleValue, 0));
  });
  const elapsedMs = now - timeMin;
  setText(statusOilTempRangeStartEl, elapsedMs >= OIL_TEMPERATURE_HISTORY_MS - OIL_TEMPERATURE_SAMPLE_MS
    ? "-60 min"
    : "Start");
  statusOilTempChartEl?.setAttribute(
    "aria-label",
    `Oil temperature from ${formatNumber(values[0], 0)} to ${formatNumber(values.at(-1), 0)} degrees over ${Math.max(1, Math.round(elapsedMs / 60000))} minutes`,
  );
}

unitSettingsToggleEl?.addEventListener("click", () => {
  refreshRateControls.forEach((control) => setRefreshRateMenuOpen(control, false));
  setUnitSettingsOpen(true);
});

unitPreferenceSelects.forEach((select) => select.addEventListener("change", () => {
  unitPreferences = { ...unitPreferences, [select.dataset.unitPreference]: select.value };
  saveUnitPreferences();
}));

unitDropdowns.forEach((control) => {
  const toggle = control.querySelector(".unit-dropdown-toggle");
  toggle?.addEventListener("click", () => {
    setUnitDropdownOpen(control, toggle.getAttribute("aria-expanded") !== "true");
  });
  control.querySelectorAll(".unit-dropdown-option").forEach((option) => {
    option.addEventListener("click", () => {
      const select = unitPreferenceSelects.find(
        (candidate) => candidate.dataset.unitPreference === control.dataset.unitDropdown,
      );
      setUnitDropdownOpen(control, false);
      if (select && select.value !== option.dataset.value) {
        select.value = option.dataset.value;
        select.dispatchEvent(new window.Event("change", { bubbles: true }));
      }
      toggle?.focus();
    });
  });
});

unitPresetButtons.forEach((button) => button.addEventListener("click", () => {
  unitPreferences = button.dataset.unitPreset === "us"
    ? { speed: "mph", temperature: "fahrenheit", pressure: "psi", fuel: "us-gallons" }
    : { ...DEFAULT_UNIT_PREFERENCES };
  saveUnitPreferences();
}));

unitSettingsResetEl?.addEventListener("click", () => {
  unitPreferences = { ...DEFAULT_UNIT_PREFERENCES };
  saveUnitPreferences();
});

unitModalCloseButtons.forEach((button) => button.addEventListener("click", () => setUnitSettingsOpen(false)));

syncUnitSettings();

document.addEventListener("click", (event) => {
  refreshRateControls.forEach((control) => {
    if (!control.contains(event.target)) setRefreshRateMenuOpen(control, false);
  });
  unitDropdowns.forEach((control) => {
    if (!control.contains(event.target)) setUnitDropdownOpen(control, false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const openControl = refreshRateControls.find((control) => control.classList.contains("is-open"));
    const openUnitDropdown = unitDropdowns.find((control) => control.classList.contains("is-open"));
    const unitMenuWasOpen = unitSettingsModalEl?.classList.contains("is-open");
    refreshRateControls.forEach((control) => setRefreshRateMenuOpen(control, false));
    unitDropdowns.forEach((control) => setUnitDropdownOpen(control, false));
    if (!openUnitDropdown) setUnitSettingsOpen(false);
    openControl?.querySelector(".refresh-rate-toggle")?.focus();
    openUnitDropdown?.querySelector(".unit-dropdown-toggle")?.focus();
    if (!openControl && !openUnitDropdown && unitMenuWasOpen) unitSettingsToggleEl?.focus();
  }
});

function syncFullscreenButton(isFullscreen) {
  if (!fullscreenToggleEl) return;

  fullscreenToggleEl.classList.toggle("is-active", isFullscreen);
  fullscreenToggleEl.setAttribute("aria-pressed", String(isFullscreen));
  fullscreenToggleEl.title = isFullscreen ? "Exit borderless fullscreen" : "Open borderless fullscreen";
  fullscreenToggleEl.setAttribute("aria-label", fullscreenToggleEl.title);
  const label = fullscreenToggleEl.querySelector("span");
  if (label) label.textContent = isFullscreen ? "Exit full" : "Fullscreen";
}

fullscreenToggleEl?.addEventListener("click", async () => {
  try {
    if (window.raceEngineer?.toggleFullscreen) {
      syncFullscreenButton(await window.raceEngineer.toggleFullscreen());
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
    syncFullscreenButton(Boolean(document.fullscreenElement));
  } catch (error) {
    console.error("Unable to toggle fullscreen", error);
  }
});

window.raceEngineer?.onFullscreenChanged?.(syncFullscreenButton);
document.addEventListener("fullscreenchange", () => {
  if (!window.raceEngineer?.toggleFullscreen) {
    syncFullscreenButton(Boolean(document.fullscreenElement));
  }
});

restartRaceEngineerEl?.addEventListener("click", async () => {
  if (restartRaceEngineerEl.disabled) return;

  restartRaceEngineerEl.disabled = true;
  restartRaceEngineerEl.classList.add("is-restarting");
  restartRaceEngineerEl.querySelector("span").textContent = "Restarting";

  if (window.raceEngineer?.restartApp) {
    try {
      await window.raceEngineer.restartApp();
      return;
    } catch {
      // Fall through to a page reload when Electron IPC is unavailable.
    }
  }

  window.location.reload();
});

function setActiveScreen(screenName) {
  activeScreen = screenName;
  const activationVersion = ++screenActivationVersion;
  screenActivationPending = true;

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.screen === screenName);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("is-visible", screen.dataset.screenPanel === screenName);
  });

  if (screenName === "map") {
    lastMapFrameAt = 0;
  }

  // Let Chromium paint the selected tab and visible panel before rebuilding
  // leaderboards or cloning SVG map layers. Those operations can be expensive
  // with a full grid, and doing them in this click handler makes the tab feel
  // unresponsive even though its state has already changed.
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (activationVersion !== screenActivationVersion || activeScreen !== screenName) return;

      try {
        if (latestSnapshot) {
          const telemetry = latestSnapshot.telemetry || {};
          if (screenName === "leaderboard") {
            renderLeaderboard(telemetry.standings || []);
            renderLeaderboardEvents();
          } else if (screenName === "map") {
            fitTrackMapToContent(document.getElementById("track-map"));
            syncPitExitMapLayers();
            renderMapClassFilters(telemetry.standings || []);
          } else if (screenName === "test") {
            syncTestWeatherMapLayers();
            scheduleSimulatedPrecipitationField();
          }
        }

        if (screenName === "map") scheduleTrackMapFrame();
      } finally {
        if (activationVersion === screenActivationVersion) screenActivationPending = false;
      }
    }, 0);
  });
}

function formatNumber(value, digits = 1, fallback = "--") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return value.toFixed(digits);
}

function formatWearPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(100, percent)))}%`;
}

function updatePitCarIcon(carName, className) {
  const normalizedName = String(carName || "").toUpperCase();
  const normalizedClass = String(className || "").toUpperCase();
  let iconName = "gt3";
  if (normalizedName.includes("AMG")) iconName = "amg";
  else if (normalizedClass.includes("GTP")) iconName = "gtp";
  else if (normalizedClass.includes("GT3")) iconName = "gt3";
  pitCarIcons.forEach((icon) => {
    icon.hidden = icon.dataset.pitCarIcon !== iconName;
  });
}

function updatePitCarIconFromTelemetry(telemetry) {
  const source = telemetry || {};
  const playerCarName = source.player_car_name
    || (source.is_player_car ? source.car_name : "");
  updatePitCarIcon(playerCarName, source.player_class_name || source.class_name);
}

async function syncPitCarIconFromState() {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return;
    const snapshot = await response.json();
    updatePitCarIconFromTelemetry(snapshot.telemetry);
  } catch {
    // Keep the last valid icon while the local telemetry service reconnects.
  }
}

// Keep car selection independent from the main dashboard renderer. This also
// guarantees the correct icon if another panel fails while telemetry is live.
syncPitCarIconFromState();
setInterval(syncPitCarIconFromState, 1000);

function setStatusBar(element, value, minimum, maximum, dimension = "width") {
  if (!element) return;
  const percent = typeof value === "number" && Number.isFinite(value) && maximum > minimum
    ? Math.max(0, Math.min(100, ((value - minimum) / (maximum - minimum)) * 100))
    : 0;
  const nextValue = `${percent}%`;
  if (element.style[dimension] !== nextValue) {
    element.style[dimension] = nextValue;
  }
}

function setVisualState(element, state) {
  if (element && element.dataset.state !== state) element.dataset.state = state;
}

function setSystemState(name, state, barElement) {
  setVisualState(barElement, state);
  statusIndicators
    .filter((element) => element.dataset.statusFor === name)
    .forEach((element) => setVisualState(element, state));
}

function getThermalState(value, coldMaximum, normalMaximum, warningMaximum) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unavailable";
  if (value < coldMaximum) return "cold";
  if (value <= normalMaximum) return "normal";
  if (value <= warningMaximum) return "warning";
  return "critical";
}

function getLevelState(value, warningMinimum, normalMinimum) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unavailable";
  if (value < warningMinimum) return "critical";
  if (value < normalMinimum) return "warning";
  return "normal";
}

function setWearStatusBar(element, value) {
  setStatusBar(element, value, 0, 1);
  const normalized = typeof value === "number" && Number.isFinite(value)
    ? (value <= 1 ? value : value / 100)
    : null;
  setVisualState(element, normalized == null ? "unavailable" : getLevelState(normalized, 0.25, 0.6));
}

function formatTemperature(value, digits = 0, includeUnit = true) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  const usesFahrenheit = unitPreferences.temperature === "fahrenheit";
  const converted = usesFahrenheit ? (value * 9) / 5 + 32 : value;
  return `${converted.toFixed(digits)}${includeUnit ? (usesFahrenheit ? "°F" : "°C") : ""}`;
}

function formatWindSpeed(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return unitPreferences.speed === "mph"
    ? `${(value * 2.236936).toFixed(1)} mph`
    : `${value.toFixed(1)} m/s`;
}

function formatFuelVolume(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  if (unitPreferences.fuel === "us-gallons") return `${(value * 0.264172).toFixed(1)} US gal`;
  if (unitPreferences.fuel === "imperial-gallons") return `${(value * 0.219969).toFixed(1)} imp gal`;
  return `${value.toFixed(1)} L`;
}

function formatPressure(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  value = value > 10 ? value : value * 100;
  if (unitPreferences.pressure === "psi") return (value * 0.1450377).toFixed(1);
  if (unitPreferences.pressure === "kpa") return value.toFixed(0);
  return (value / 100).toFixed(2);
}

function estimateEmptyLap(telemetry) {
  const fuelLevel = Number(telemetry.player_fuel_level ?? telemetry.fuel_level);
  const fuelUsePerHour = Number(telemetry.player_fuel_use_per_hour ?? telemetry.fuel_use_per_hour);
  const fuelDensity = Number(telemetry.fuel_density);
  const lapSeconds = Number(telemetry.best_lap_time || telemetry.lap_time);
  const currentLap = Number(telemetry.current_lap);
  if (
    !Number.isFinite(fuelLevel) || fuelLevel < 0
    || !Number.isFinite(fuelUsePerHour) || fuelUsePerHour <= 0
    || !Number.isFinite(fuelDensity) || fuelDensity <= 0
    || !Number.isFinite(lapSeconds) || lapSeconds <= 0
    || !Number.isFinite(currentLap) || currentLap < 0
  ) return "lap --";

  const litersPerLap = (fuelUsePerHour * lapSeconds) / (3600 * fuelDensity);
  if (!(litersPerLap > 0)) return "lap --";
  return `lap ${Math.floor(currentLap + fuelLevel / litersPerLap)}`;
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

function updateWindDirectionArrow(value) {
  if (!windDirectionArrowEl) return;
  const hasDirection = typeof value === "number" && Number.isFinite(value);
  const degrees = hasDirection ? ((value % 360) + 360) % 360 : 0;
  windDirectionArrowEl.style.transform = `rotate(${degrees - 90}deg)`;
  windDirectionArrowEl.style.opacity = hasDirection ? "1" : "0.35";
}

function formatTrackWetness(value) {
  const states = ["UNKNOWN", "DRY", "MOSTLY DRY", "VERY LIGHTLY WET", "LIGHTLY WET", "MODERATELY WET", "VERY WET", "EXTREMELY WET"];
  return Number.isInteger(value) && states[value] ? states[value] : "--";
}

function formatSkies(value) {
  const states = ["CLEAR", "PARTLY CLOUDY", "MOSTLY CLOUDY", "OVERCAST"];
  return Number.isInteger(value) && states[value] ? states[value] : "--";
}

function getRainVisualState(rainState, precipitation) {
  const normalizedState = String(rainState ?? "").trim().toLowerCase();
  const namedStates = [
    ["very-heavy", /very\s*heavy|extreme|torrential/],
    ["heavy", /heavy/],
    ["moderate", /moderate|medium/],
    ["light", /light|drizzle/],
    ["none", /none|dry|no\s*(rain|precip)/],
  ];
  const namedMatch = namedStates.find(([, pattern]) => pattern.test(normalizedState));
  if (namedMatch) return namedMatch[0];

  // Some SDK wrappers expose RainState as the ordered enum instead of its label.
  if (Number.isInteger(rainState) && rainState >= 0 && rainState <= 4) {
    return ["none", "light", "moderate", "heavy", "very-heavy"][rainState];
  }

  const rain = getRainPresentation(precipitation);
  if (rain.percent == null || rain.percent < 1) return "none";
  if (rain.percent < 20) return "light";
  if (rain.percent < 55) return "moderate";
  if (rain.percent < 80) return "heavy";
  return "very-heavy";
}

function rainVisualLabel(value) {
  return {
    none: "",
    light: "Light rain",
    moderate: "Moderate rain",
    heavy: "Heavy rain",
    "very-heavy": "Very heavy rain",
  }[value] || "";
}

function formatRainState(rainState, precipitation) {
  const visualState = getRainVisualState(rainState, precipitation);
  return {
    none: "NO RAIN",
    light: "LIGHT",
    moderate: "MODERATE",
    heavy: "HEAVY",
    "very-heavy": "VERY HEAVY",
  }[visualState] || "--";
}

function renderLiveCloudCover(skies, windSpeed, windDirection, rainState, precipitation) {
  const coverStates = ["clear", "partly", "mostly", "overcast"];
  const cover = Number.isInteger(skies) ? coverStates[skies] : null;
  const label = formatSkies(skies);
  const speed = typeof windSpeed === "number" && Number.isFinite(windSpeed)
    ? Math.max(0, windSpeed)
    : 0;
  const direction = typeof windDirection === "number" && Number.isFinite(windDirection)
    ? ((windDirection + 180) % 360 + 360) % 360
    : 90;
  const rain = getRainVisualState(rainState, precipitation);
  const rainLabel = rainVisualLabel(rain);

  if (testWeatherCloudLayerEl) {
    testWeatherCloudLayerEl.dataset.cloudCover = cover || "unknown";
    testWeatherCloudLayerEl.dataset.rain = rain;
    testWeatherCloudLayerEl.style.setProperty("--cloud-direction", `${direction}deg`);
    testWeatherCloudLayerEl.style.setProperty(
      "--cloud-duration",
      `${Math.max(16, Math.min(80, 72 - speed * 4)).toFixed(1)}s`,
    );
    testWeatherCloudLayerEl.setAttribute(
      "aria-label",
      [cover ? `Live cloud cover: ${label}` : "Live cloud cover unavailable", rainLabel]
        .filter(Boolean)
        .join("; "),
    );
  }
}

function getRainPresentation(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { percent: null, label: "No precipitation data", color: "#71838f" };
  }
  const percent = Math.max(0, Math.min(100, value));
  if (percent < 1) return { percent, label: "Dry at start / finish", color: "#24c978" };
  if (percent < 20) return { percent, label: "Light rain at start / finish", color: "#70d345" };
  if (percent < 55) return { percent, label: "Moderate rain at start / finish", color: "#e3c83d" };
  if (percent < 80) return { percent, label: "Heavy rain at start / finish", color: "#ff9138" };
  return { percent, label: "Very heavy rain at start / finish", color: "#ff4650" };
}

function simulatedPrecipitationNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fade = (value) => value * value * (3 - 2 * value);
  const sample = (sampleX, sampleY) => {
    const value = Math.sin(sampleX * 127.1 + sampleY * 311.7 + 41.37) * 43758.5453;
    return value - Math.floor(value);
  };
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const top = sample(x0, y0) * (1 - tx) + sample(x0 + 1, y0) * tx;
  const bottom = sample(x0, y0 + 1) * (1 - tx) + sample(x0 + 1, y0 + 1) * tx;
  return top * (1 - ty) + bottom * ty;
}

function simulatedPrecipitationFbm(x, y) {
  let value = 0;
  let amplitude = 0.56;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave += 1) {
    value += simulatedPrecipitationNoise(x * frequency, y * frequency) * amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

function simulatedPrecipitationColor(intensity, shade) {
  const stops = [
    [0, [39, 215, 230]],
    [0.28, [48, 197, 118]],
    [0.56, [111, 181, 62]],
    [0.78, [248, 235, 47]],
    [1, [255, 139, 38]],
  ];
  const upperIndex = stops.findIndex(([position]) => position >= intensity);
  const upper = stops[upperIndex < 0 ? stops.length - 1 : upperIndex];
  const lower = stops[Math.max(0, (upperIndex < 0 ? stops.length : upperIndex) - 1)];
  const range = Math.max(0.001, upper[0] - lower[0]);
  const mix = Math.max(0, Math.min(1, (intensity - lower[0]) / range));
  return lower[1].map((channel, index) => Math.max(
    0,
    Math.min(255, Math.round(channel + (upper[1][index] - channel) * mix + shade)),
  ));
}

function drawSimulatedPrecipitationField(timestamp = performance.now()) {
  const canvas = testWeatherRadarCanvasEl;
  if (!canvas) return;
  const context = canvas.getContext("2d", { alpha: true });
  const precipitation = testWeatherRadarState.precipitation;
  if (!context || precipitation == null || precipitation < 0.5) {
    context?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove("is-active");
    testWeatherMapStageEl?.classList.remove("has-simulated-radar");
    return;
  }

  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  if (displayWidth < 2 || displayHeight < 2) return;
  const width = Math.min(240, Math.max(100, Math.round(displayWidth / 5)));
  const height = Math.min(170, Math.max(70, Math.round(width * displayHeight / displayWidth)));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const rainSeverity = {
    none: 0,
    light: 0.18,
    moderate: 0.45,
    heavy: 0.74,
    "very-heavy": 1,
  }[testWeatherRadarState.rainState] || 0;
  const telemetryIntensity = Math.max(precipitation / 100, rainSeverity * 0.7);
  const threshold = 0.75 - telemetryIntensity * 0.47;
  const field = new Float32Array(width * height);
  const seconds = timestamp / 1000;
  const travel = seconds * (0.012 + Math.min(25, testWeatherRadarState.windSpeed) * 0.0024);
  const windRadians = (testWeatherRadarState.windDirection + 180) * Math.PI / 180;
  const travelX = Math.sin(windRadians) * travel;
  const travelY = -Math.cos(windRadians) * travel;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / width * 3.5 + travelX + 9.7;
      const ny = y / height * 3.5 + travelY + 4.3;
      const broadCells = simulatedPrecipitationFbm(nx, ny);
      const ridges = 1 - Math.abs(simulatedPrecipitationFbm(nx * 1.37 + 18, ny * 1.37 - 7) * 2 - 1);
      const raw = broadCells * 0.79 + ridges * 0.21;
      field[y * width + x] = Math.max(0, Math.min(1, (raw - threshold) / (1 - threshold)));
    }
  }

  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const intensity = field[index];
      if (intensity <= 0.015) continue;
      const left = field[y * width + Math.max(0, x - 1)];
      const right = field[y * width + Math.min(width - 1, x + 1)];
      const up = field[Math.max(0, y - 1) * width + x];
      const down = field[Math.min(height - 1, y + 1) * width + x];
      const steppedIntensity = Math.round(intensity * 12) / 12;
      const neighbourStep = Math.round(Math.max(left, right, up, down) * 12) / 12;
      const isContour = Math.abs(steppedIntensity - neighbourStep) > 0.04;
      const heightShade = (left - right + up - down) * 92
        + intensity * 20
        + (isContour ? 24 : 0);
      const [red, green, blue] = simulatedPrecipitationColor(steppedIntensity, heightShade);
      const pixelIndex = index * 4;
      image.data[pixelIndex] = red;
      image.data[pixelIndex + 1] = green;
      image.data[pixelIndex + 2] = blue;
      image.data[pixelIndex + 3] = Math.round(
        Math.min(0.98, (0.2 + intensity * 0.8) * (0.58 + telemetryIntensity * 0.6)) * 255,
      );
    }
  }

  if (testWeatherRadarSurfaceEl.width !== width || testWeatherRadarSurfaceEl.height !== height) {
    testWeatherRadarSurfaceEl.width = width;
    testWeatherRadarSurfaceEl.height = height;
  }
  const surfaceContext = testWeatherRadarSurfaceEl.getContext("2d", { alpha: true });
  if (!surfaceContext) return;
  surfaceContext.clearRect(0, 0, width, height);
  surfaceContext.putImageData(image, 0, 0);

  context.clearRect(0, 0, width, height);
  context.save();
  context.imageSmoothingEnabled = true;

  // A dark displaced silhouette gives every rain cell a lifted terrain edge.
  context.globalAlpha = 0.72;
  context.filter = "brightness(0.12) saturate(0.5) blur(2px)";
  context.drawImage(testWeatherRadarSurfaceEl, 0, 4);

  // A broad coloured bloom separates active precipitation from the cloud deck.
  context.globalCompositeOperation = "screen";
  context.globalAlpha = 0.3;
  context.filter = "blur(3.5px) saturate(1.5)";
  context.drawImage(testWeatherRadarSurfaceEl, 0, 0);

  // The crisp top layer carries the contour bands and directional lighting.
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.98;
  context.filter = "contrast(1.14) saturate(1.18) drop-shadow(0 2px 1.5px rgba(0, 8, 10, 0.82))";
  context.drawImage(testWeatherRadarSurfaceEl, 0, -1);
  context.restore();
  canvas.classList.add("is-active");
  testWeatherMapStageEl?.classList.add("has-simulated-radar");
}

function scheduleSimulatedPrecipitationField() {
  if (testWeatherRadarFrame != null || activeScreen !== "test") return;
  testWeatherRadarFrame = requestAnimationFrame((timestamp) => {
    testWeatherRadarFrame = null;
    if (timestamp - testWeatherRadarLastDrawAt >= 90) {
      testWeatherRadarLastDrawAt = timestamp;
      drawSimulatedPrecipitationField(timestamp);
    }
    if (
      activeScreen === "test"
      && testWeatherRadarState.hasRecentTelemetry
      && testWeatherRadarState.precipitation >= 0.5
      && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      scheduleSimulatedPrecipitationField();
    }
  });
}

function updateSimulatedPrecipitationField(weather, hasRecentTelemetry) {
  const precipitation = typeof weather.precipitation === "number"
    ? Math.max(0, Math.min(100, weather.precipitation))
    : null;
  testWeatherRadarState.precipitation = precipitation;
  testWeatherRadarState.rainState = getRainVisualState(weather.rain_state, precipitation);
  testWeatherRadarState.windSpeed = typeof weather.wind_speed === "number" ? weather.wind_speed : 0;
  testWeatherRadarState.windDirection = typeof weather.wind_direction === "number"
    ? weather.wind_direction
    : 90;
  testWeatherRadarState.hasRecentTelemetry = hasRecentTelemetry;
  setText(
    testWeatherRadarBadgeEl,
    precipitation == null ? "SIMULATED PRECIPITATION" : `SIMULATED · ${precipitation.toFixed(1)}%`,
  );
  if (!hasRecentTelemetry || precipitation == null || precipitation < 0.5) {
    testWeatherRadarCanvasEl?.classList.remove("is-active");
    testWeatherMapStageEl?.classList.remove("has-simulated-radar");
  }
  scheduleSimulatedPrecipitationField();
}

function renderTestWeather(snapshot, telemetry, hasRecentTelemetry) {
  // The former weather test screen has been removed. Avoid all radar and
  // formatting work while keeping this isolated renderer easy to restore.
  if (!testWeatherDashboardEl) return;
  const weather = telemetry.weather || {};
  const liveLabel = hasRecentTelemetry ? "Live" : (snapshot.connected ? "Stale" : "Offline");
  [testWeatherLiveStatusEl, testWeatherDetailLiveEl].forEach((element) => {
    setText(element, liveLabel);
    element?.classList.toggle("is-live", hasRecentTelemetry);
    element?.classList.toggle("is-stale", !hasRecentTelemetry && Boolean(snapshot.connected));
  });

  setText(testWeatherTrackNameEl, telemetry.track_name || "Waiting for track");

  const rain = getRainPresentation(weather.precipitation);
  const rainValue = rain.percent == null ? "--" : `${formatNumber(rain.percent, 1)}%`;
  setText(testWeatherPrecipitationEl, rainValue);
  if (testWeatherDashboardEl) {
    testWeatherDashboardEl.style.setProperty("--rain-intensity", String((rain.percent || 0) / 100));
    testWeatherDashboardEl.style.setProperty("--rain-color", rain.color);
  }

  const windSpeed = typeof weather.wind_speed === "number" ? weather.wind_speed : null;
  const windDirection = typeof weather.wind_direction === "number" ? weather.wind_direction : null;
  renderLiveCloudCover(
    weather.skies,
    windSpeed,
    windDirection,
    weather.rain_state,
    weather.precipitation,
  );
  updateSimulatedPrecipitationField(weather, hasRecentTelemetry);
  setText(testWeatherWindSpeedEl, formatWindSpeed(windSpeed));
  setText(testWeatherWindDirectionEl, formatWindDirection(windDirection));
  setText(testWeatherAirTempEl, formatTemperature(weather.air_temp));
  setText(testWeatherHumidityEl, typeof weather.humidity === "number"
    ? `${formatNumber(weather.humidity, 0)}%`
    : "--");
  setText(testWeatherTrackTempEl, formatTemperature(weather.track_temp));
  setText(testWeatherWetnessEl, formatTrackWetness(weather.track_wetness));
  setText(testWeatherSkiesEl, formatSkies(weather.skies));
  setText(testWeatherDeclaredWetEl, typeof weather.weather_declared_wet === "boolean"
    ? (weather.weather_declared_wet ? "YES" : "NO")
    : "--");
}

function formatInteger(value, fallback = "--") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.round(value).toString();
}

function formatRaceLapCount(currentLap, totalLaps, totalIsEstimated = false) {
  if (typeof currentLap !== "number" || Number.isNaN(currentLap)) {
    return "--";
  }
  const hasTotal = typeof totalLaps === "number" && !Number.isNaN(totalLaps);
  const total = hasTotal
    ? `${totalIsEstimated ? "~" : ""}${Math.round(totalLaps)}`
    : "--";
  return `${Math.round(currentLap)} / ${total}`;
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

function getFocusedStandingEntry(telemetry) {
  const standings = Array.isArray(telemetry?.standings) ? telemetry.standings : [];
  const focusedCarIdx = String(telemetry?.focus_car_idx ?? "");
  return standings.find(
    (entry) => String(entry?.car_idx ?? "") === focusedCarIdx,
  ) || standings.find((entry) => entry?.focused === true);
}

function getFocusedClassCarCount(telemetry) {
  const standings = Array.isArray(telemetry?.standings) ? telemetry.standings : [];
  const focusedEntry = getFocusedStandingEntry(telemetry);
  if (!focusedEntry) return null;

  const focusedClassId = focusedEntry.class_id;
  if (focusedClassId !== undefined && focusedClassId !== null && focusedClassId !== "") {
    return standings.filter((entry) => String(entry?.class_id) === String(focusedClassId)).length;
  }

  const focusedClassKey = getClassKey(focusedEntry);
  return standings.filter((entry) => getClassKey(entry) === focusedClassKey).length;
}

function getFocusedClassName(telemetry) {
  if (telemetry?.class_name && telemetry.class_name !== "--") return telemetry.class_name;
  const focusedEntry = getFocusedStandingEntry(telemetry);
  return focusedEntry ? formatClass(focusedEntry) : null;
}

function getClassColor(entry) {
  const name = formatClass(entry).toUpperCase();
  if (name.includes("GTP")) return "#ffd400";
  if (name.includes("LMP")) return "#12afe8";
  if (name.includes("GT3")) return "#e32636";
  if (name.includes("GT4")) return "#9b5de5";
  return "#168a9c";
}

function getClassTextColor(entry) {
  const name = formatClass(entry).toUpperCase();
  return name.includes("GTP") || name.includes("LMP") || name.includes("GT3") ? "#000000" : "#ffffff";
}

function getCarStatus(entry) {
  const statuses = {
    retired: { label: "RET", className: "is-retired" },
    garage: { label: "GARAGE", className: "is-garage" },
    pit: { label: "PIT LANE", className: "is-pit" },
    pit_stall: { label: "PIT STALL", className: "is-pit" },
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

function formatIngameTime(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return "--";
  return formatClock(value % 86400);
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

function formatSpeed(speedMs) {
  if (typeof speedMs !== "number" || Number.isNaN(speedMs)) {
    return "--";
  }
  return Math.round(speedMs * (unitPreferences.speed === "mph" ? 2.236936 : 3.6)).toString();
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
  const isLmp2 = normalizedClassName.includes("LMP2");
  const classPlateType = isGt3 ? " is-gt3" : isGtp ? " is-gtp" : isLmp2 ? " is-lmp2" : "";
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
    driverName: Array.isArray(entry.team_driver_names) && entry.team_driver_names.length > 1
      ? entry.team_driver_names.join(" / ")
      : entry.driver_name ?? "Unknown driver",
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
  const escapeHtml = window.raceEngineerUi.escapeHtml;
  row.innerHTML = `
      <span>${escapeHtml(values.classPosition)}</span>
      <span><b class="class-chip${values.classPlateType}" style="--class-color:${values.classColor};--class-text-color:${values.classTextColor}"><span class="class-chip-name">${escapeHtml(values.className)}</span></b></span>
      <span class="car-number-cell">#${escapeHtml(values.carNumber)}</span>
      <span class="car-brand-cell">${renderCarBrandLogo(values.carName)}</span>
      <span class="team-cell">${escapeHtml(values.teamName)}</span>
      <span class="driver-cell">${escapeHtml(values.driverName)}</span>
      <span>${escapeHtml(values.classGap)}</span>
      <span>${escapeHtml(values.interval)}</span>
      <span class="last-lap-cell">${escapeHtml(values.lastLap)}</span>
      <span class="best-lap-cell">${escapeHtml(values.bestLap)}</span>
      <span>${escapeHtml(values.lapsCompleted)}</span>
      <span>${escapeHtml(values.lapsSincePit)}</span>
      <span>${escapeHtml(values.pitDuration)}</span>
      <span class="tire-cell">${escapeHtml(values.tireType)}</span>
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
  // The camera car must always remain visible, even when the engineer has a
  // different class filter selected.
  return !car?.focused
    && mapClassFilter !== "all"
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

function getMapSampleTime(telemetryTick, receivedAt) {
  const tick = Number(telemetryTick);
  if (!Number.isFinite(tick)) return receivedAt;
  if (!mapSampleClock || tick <= mapSampleClock.tick) {
    mapSampleClock = { tick, time: receivedAt };
    return receivedAt;
  }

  const tickDurationMs = 1000 / 60;
  const sampleTime = mapSampleClock.time + ((tick - mapSampleClock.tick) * tickDurationMs);
  // Re-anchor after a pause, replay seek or a material clock drift while still
  // preserving the simulator's regular tick spacing during normal streaming.
  if (Math.abs(sampleTime - receivedAt) > 100) {
    mapSampleClock = { tick, time: receivedAt };
    return receivedAt;
  }
  mapSampleClock = { tick, time: sampleTime };
  return sampleTime;
}

function recordMapTelemetrySample(trackMap, receivedAt, telemetryTick) {
  const sampleTime = getMapSampleTime(telemetryTick, receivedAt);
  const visibleCarIds = new Set();
  (trackMap?.cars || []).forEach((car) => {
    const progress = Number(car?.lap_dist_pct);
    if (!Number.isFinite(progress)) return;
    const carId = String(car.car_idx);
    visibleCarIds.add(carId);
    const samples = mapCarSampleHistory.get(carId) || [];
    samples.push({ progress: ((progress % 1) + 1) % 1, receivedAt: sampleTime });
    if (samples.length > 8) samples.splice(0, samples.length - 8);
    mapCarSampleHistory.set(carId, samples);
  });
  mapCarSampleHistory.forEach((_, carId) => {
    if (!visibleCarIds.has(carId)) mapCarSampleHistory.delete(carId);
  });
}

function interpolateLapProgress(samples, renderAt, fallbackProgress) {
  if (!Array.isArray(samples) || samples.length < 2) return fallbackProgress;

  let before = samples[0];
  let after = samples[samples.length - 1];
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index].receivedAt >= renderAt) {
      before = samples[index - 1];
      after = samples[index];
      break;
    }
    before = samples[index - 1];
    after = samples[index];
  }

  const sampleDuration = after.receivedAt - before.receivedAt;
  if (!(sampleDuration > 0)) return after.progress;
  const progressDelta = ((after.progress - before.progress + 1.5) % 1) - 0.5;
  // A large delta is a replay seek/session reset, not normal driving.
  if (Math.abs(progressDelta) > 0.08) return fallbackProgress;

  const maxExtrapolation = sampleDuration * 0.75;
  const elapsed = Math.max(0, Math.min(
    renderAt - before.receivedAt,
    sampleDuration + maxExtrapolation,
  ));
  return ((before.progress + (progressDelta * (elapsed / sampleDuration))) % 1 + 1) % 1;
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
      } catch {
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
        (startFinishOffset + outerStep) % trackLength,
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
      // iRacing's official active-track contour is wound opposite to the
      // circuit direction shown by its direction arrow. CarIdxLapDistPct
      // increases in the arrow's direction, so read the contour backwards.
      trackProgressDirection: -1,
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
  const frameTime = performance.now();
  const interpolationDelay = Math.max(50, Math.min(140, currentRefreshMs * 1.5));
  const interpolationTime = frameTime - interpolationDelay;

  // Draw the camera car last so a tightly packed group cannot cover it.
  const orderedMapCars = [...mapCars].sort(
    (a, b) => Number(Boolean(a?.focused)) - Number(Boolean(b?.focused)),
  );
  orderedMapCars.forEach((car) => {
    let x = car.x;
    let y = car.y;

    // Use SVG path to position cars based on lap distance percentage
    if (trackLength > 0 && car.lap_dist_pct != null) {
      const rawProgress = Math.max(0, Math.min(1, Number(car.lap_dist_pct)));
      const progress = interpolateLapProgress(
        mapCarSampleHistory.get(String(car.car_idx)),
        interpolationTime,
        rawProgress,
      );
      const point = projectTrackPoint(progress, geometry);
      x = point.x;
      y = point.y;
    }

    if (x == null || y == null) {
      return;
    }
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

    projectedCars.push({ car, x, y });

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
    if (car.focused) trackMapCarsEl.appendChild(group);
  });

  existingCars.forEach((element, carId) => {
    if (!visibleCarIds.has(carId)) element.remove();
  });

  const auxiliaryMapsDue = frameTime - lastAuxiliaryMapRenderAt >= AUXILIARY_MAP_RENDER_INTERVAL_MS;
  if (largeTrackMapIndex === 1 || auxiliaryMapsDue) {
    renderPitExitMap(pitExitPrediction, geometry, standingsByCarIdx);
  }
  if (largeTrackMapIndex === 2 || auxiliaryMapsDue) {
    renderFollowMap(projectedCars, geometry, trackPathEl, focusedSpeedMs, standingsByCarIdx);
  }
  if (auxiliaryMapsDue) lastAuxiliaryMapRenderAt = frameTime;

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
    } catch {
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

function setTestWeatherViewBox(weatherMapEl, centerX, centerY, width, height, padding) {
  const zoomScale = isTestWeatherZoomedOut ? 3 : 1;
  const viewWidth = (width + padding * 2) * zoomScale;
  const viewHeight = (height + padding * 2) * zoomScale;
  weatherMapEl.setAttribute(
    "viewBox",
    `${centerX - viewWidth / 2} ${centerY - viewHeight / 2} ${viewWidth} ${viewHeight}`,
  );
}

function syncTestWeatherMapLayers() {
  const sourceMapEl = document.getElementById("track-map");
  const weatherMapEl = document.getElementById("test-weather-map");
  const contentEl = document.getElementById("test-weather-map-content");
  const layersEl = document.getElementById("test-weather-map-layers");
  const outlineEl = document.getElementById("test-weather-track-outline");
  if (!sourceMapEl || !weatherMapEl || !layersEl) return;

  const sourceViewBox = sourceMapEl.getAttribute("viewBox");
  if (sourceViewBox) weatherMapEl.setAttribute("viewBox", sourceViewBox);

  layersEl.replaceChildren();

  const sourceTrackPathEl = document.getElementById("track-path");
  const trackPathData = sourceTrackPathEl?.getAttribute("d");
  if (outlineEl && trackPathData) {
    outlineEl.setAttribute("d", trackPathData);
    outlineEl.removeAttribute("hidden");
    try {
      const box = outlineEl.getBBox();
      if (box.width > 0 && box.height > 0) {
        const padding = Math.max(box.width, box.height) * 0.2;
        setTestWeatherViewBox(
          weatherMapEl,
          box.x + box.width / 2,
          box.y + box.height / 2,
          box.width,
          box.height,
          padding,
        );
      }
    } catch {
      // Keep the official viewBox if the test screen is not measurable yet.
    }
  } else {
    outlineEl?.setAttribute("hidden", "");
    const fallbackUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
    fallbackUse.setAttribute("href", "#track-path");
    fallbackUse.setAttribute("class", "test-weather-fallback-track");
    layersEl.appendChild(fallbackUse);
  }

  // iRacing's circuit preview uses a portrait orientation. Rotate only the
  // circuit artwork; the live cloud field and labels remain screen-aligned.
  const measurementEl = trackPathData ? outlineEl : layersEl;
  if (contentEl && measurementEl && typeof measurementEl.getBBox === "function") {
    try {
      // Measure the visible weather-map copy. The source circuit normally sits
      // on a hidden tab here, where Chromium reports a 0 x 0 bounding box.
      const box = measurementEl.getBBox();
      if (box.width > 0 && box.height > 0) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const padding = Math.max(box.width, box.height) * 0.2;
        contentEl.setAttribute("transform", `rotate(90 ${centerX} ${centerY})`);
        setTestWeatherViewBox(weatherMapEl, centerX, centerY, box.height, box.width, padding);
      }
    } catch {
      contentEl.removeAttribute("transform");
    }
  }

}

function renderPitExitMap(prediction, geometry, standingsByCarIdx) {
  const miniMapEl = document.getElementById("pit-exit-map");
  const carsEl = document.getElementById("pit-exit-map-cars");
  refreshTrackMapLabels(prediction);
  if (!miniMapEl || !carsEl) return;

  if (!carsEl.previousElementSibling?.childElementCount) syncPitExitMapLayers();
  const mapScale = geometry.mapScale || 1;
  const frameTime = performance.now();
  const interpolationDelay = Math.max(50, Math.min(140, currentRefreshMs * 1.5));
  const interpolationTime = frameTime - interpolationDelay;
  const focusedLiveCar = (prediction?.cars || []).find((car) => car.focused && !car.pit_exit);
  const projectedCars = (prediction?.cars || []).map((car) => {
    let x = car.x;
    let y = car.y;
    if (geometry.trackLength > 0 && car.lap_dist_pct != null) {
      const rawProgress = ((Number(car.lap_dist_pct) % 1) + 1) % 1;
      let progress = interpolateLapProgress(
        mapCarSampleHistory.get(String(car.car_idx)),
        interpolationTime,
        rawProgress,
      );
      // The prediction ghost follows the focused car with a fixed pit-loss
      // offset. Reuse the focused car's smooth motion so the ghost does not
      // jump at the telemetry refresh rate when this map occupies the large stage.
      if (car.pit_exit && focusedLiveCar?.lap_dist_pct != null) {
        const focusedRawProgress = ((Number(focusedLiveCar.lap_dist_pct) % 1) + 1) % 1;
        const focusedProgress = interpolateLapProgress(
          mapCarSampleHistory.get(String(focusedLiveCar.car_idx)),
          interpolationTime,
          focusedRawProgress,
        );
        const ghostOffset = ((rawProgress - focusedRawProgress + 1.5) % 1) - 0.5;
        progress = ((focusedProgress + ghostOffset) % 1 + 1) % 1;
      }
      const point = projectTrackPoint(progress, geometry);
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
    let isNewGroup = false;
    if (!group) {
      isNewGroup = true;
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.dataset.carIdx = carId;
      pitRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pitRing.setAttribute("class", "pit-exit-map-pit-ring");
      circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "pit-exit-map-marker");
      label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      group.append(pitRing, circle, label);
      carsEl.appendChild(group);
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
      isMapCarDimmed(car, standingsByCarIdx) ? "is-dimmed" : "",
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
    // Existing nodes already have the correct stable order. Re-appending every
    // car on every animation frame caused needless SVG style/layout work.
    if (!isNewGroup && car.focused && group !== carsEl.lastElementChild) {
      carsEl.appendChild(group);
    }
  });
  existingCars.forEach((element, carId) => {
    if (!visibleCarIds.has(carId)) element.remove();
  });
}

function projectTrackPoint(progress, geometry) {
  const normalizedProgress = ((Number(progress) % 1) + 1) % 1;
  const trackProgressDirection = geometry.trackProgressDirection ?? -1;
  const outerDistance = (
    geometry.startFinishOffset
    + trackProgressDirection * normalizedProgress * geometry.trackLength
    + geometry.trackLength
  ) % geometry.trackLength;
  const outer = geometry.trackPathEl.getPointAtLength(outerDistance);

  if (!geometry.innerTrackPathEl || geometry.innerTrackLength <= 0) return outer;
  const innerDistance = (
    geometry.innerStartFinishOffset
    + trackProgressDirection
      * geometry.innerProgressDirection
      * normalizedProgress
      * geometry.innerTrackLength
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

  const orderedCars = [...projectedCars].sort(
    ({ car: a }, { car: b }) => Number(Boolean(a?.focused)) - Number(Boolean(b?.focused)),
  );
  orderedCars.forEach(({ car, x, y }) => {
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
    if (car.focused) followCarsEl.appendChild(group);
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

  iracingPauseEl?.classList.toggle("is-hidden", connected);
  iracingPauseEl?.setAttribute("aria-hidden", String(connected));

  if (!connected) {
    sessionNoticeEl.style.display = "none";
    sessionNoticeEl.innerHTML = "";
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

function renderFuelStrategy(telemetry) {
  const strategy = telemetry?.fuel_strategy || {};
  const numeric = (value) => value != null && Number.isFinite(Number(value)) ? Number(value) : NaN;
  const currentFuel = numeric(telemetry?.player_fuel_level ?? telemetry?.fuel_level);
  const capacity = numeric(telemetry?.fuel_capacity);
  const remaining = numeric(telemetry?.session_laps_remain_estimated ?? telemetry?.session_laps_remain);
  const average = numeric(strategy.average_5_laps ?? strategy.selected_consumption);
  const last = numeric(strategy.last_lap);
  const maximum = numeric(strategy.maximum);
  const sampleCount = Math.max(0, Number(strategy.sample_count) || 0);
  const reserve = Math.max(0, Number(fuelCalReserveEl?.value) || 0.5);
  const rates = {
    attack: Number.isFinite(maximum) && maximum > 0 ? maximum : average,
    balanced: average,
    save: average * 0.96,
  };
  const selectedRate = rates[fuelCalMode];
  const ready = Number.isFinite(currentFuel) && currentFuel >= 0
    && Number.isFinite(remaining) && remaining >= 0
    && Number.isFinite(selectedRate) && selectedRate > 0;
  const required = ready ? selectedRate * (remaining + reserve) : NaN;
  const recommended = ready ? Math.max(0, required - currentFuel) : NaN;
  const atFinish = ready ? currentFuel - (selectedRate * remaining) : NaN;
  const estimatedRange = ready ? currentFuel / selectedRate : numeric(strategy.estimated_laps);
  const fillRate = numeric(strategy.fill_rate_lps) > 0 ? numeric(strategy.fill_rate_lps) : 2.5;
  const volume = (value) => Number.isFinite(value) ? formatFuelVolume(value) : "--";
  const laps = (value) => Number.isFinite(value) ? `${value.toFixed(1)} laps` : "--";

  setText(document.getElementById("map-fuel-current"), volume(currentFuel));
  setText(document.getElementById("map-fuel-capacity"), Number.isFinite(capacity) ? volume(capacity) : "FULL");
  setText(document.getElementById("map-fuel-laps"), laps(estimatedRange));
  setText(document.getElementById("map-fuel-laps-remaining"), laps(remaining));
  setText(document.getElementById("map-fuel-at-finish"), volume(atFinish));
  setText(document.getElementById("map-fuel-last"), volume(last));
  setText(document.getElementById("map-fuel-consumption"), volume(average));
  setText(document.getElementById("map-fuel-maximum"), volume(maximum));
  setText(document.getElementById("map-fuel-needed"), volume(required));
  setText(document.getElementById("map-fuel-add"), ready ? `+${volume(recommended)}` : "--");
  setText(document.getElementById("map-fuel-refuel-time"), ready ? `${(recommended / fillRate).toFixed(1)} s` : "--");
  setText(document.getElementById("map-fuel-samples"), `${sampleCount} ${sampleCount === 1 ? "LAP" : "LAPS"}`);
  setText(
    document.getElementById("map-fuel-confidence"),
    sampleCount >= 8 ? "HIGH CONFIDENCE"
      : sampleCount >= 3 ? "MEDIUM CONFIDENCE"
        : sampleCount > 0 ? "LOW CONFIDENCE" : "NO DATA",
  );
  setText(document.getElementById("map-fuel-mode"), `${fuelCalMode.toUpperCase()} · ${reserve.toFixed(2)} LAP RESERVE`);
  setText(
    document.getElementById("map-fuel-state"),
    !ready ? "WAITING"
      : atFinish < 0 ? "PIT REQUIRED"
        : atFinish < selectedRate * reserve ? "MARGINAL" : "FUEL OK",
  );
  const levelFill = document.getElementById("map-fuel-level-fill");
  if (levelFill) {
    levelFill.style.width = (
      Number.isFinite(currentFuel) && Number.isFinite(capacity) && capacity > 0
        ? `${Math.min(100, Math.max(0, (currentFuel / capacity) * 100))}%`
        : "0%"
    );
  }
}

function renderFuelCalculator(telemetry) {
  latestFuelTelemetry = telemetry || {};
  const strategy = telemetry?.fuel_strategy || {};
  const numeric = (value) => value != null && Number.isFinite(Number(value)) ? Number(value) : NaN;
  const currentFuel = numeric(telemetry?.player_fuel_level ?? telemetry?.fuel_level);
  const capacity = numeric(telemetry?.fuel_capacity);
  const remaining = numeric(
    telemetry?.session_laps_remain_estimated
      ?? telemetry?.session_laps_remain
      ?? (
        numeric(strategy.target_laps) - numeric(strategy.reserve_laps)
      ),
  );
  const average = numeric(strategy.average_5_laps ?? strategy.selected_consumption);
  const last = numeric(strategy.last_lap);
  const maximum = numeric(strategy.maximum);
  const sampleCount = Math.max(0, Number(strategy.sample_count) || 0);
  const reserve = Math.max(0, Number(fuelCalReserveEl?.value) || 0.5);
  const fillRate = numeric(strategy.fill_rate_lps) > 0 ? numeric(strategy.fill_rate_lps) : 2.5;
  const hasFuel = Number.isFinite(currentFuel) && currentFuel >= 0;
  const hasConsumption = Number.isFinite(average) && average > 0;
  const hasRemaining = Number.isFinite(remaining) && remaining >= 0;
  const ready = hasFuel && hasConsumption && hasRemaining;
  const safeRate = Number.isFinite(maximum) && maximum > 0 ? maximum : average;
  const rates = {
    attack: safeRate,
    balanced: average,
    save: average * 0.96,
  };
  const selectedRate = rates[fuelCalMode];
  const targetLaps = hasRemaining ? remaining + reserve : NaN;
  const required = ready ? selectedRate * targetLaps : NaN;
  const recommendedAdd = ready ? Math.max(0, required - currentFuel) : NaN;
  const finishWithoutStop = ready ? currentFuel - (selectedRate * remaining) : NaN;
  const finishReserve = ready ? currentFuel + recommendedAdd - (selectedRate * remaining) : NaN;
  const range = hasFuel && hasConsumption ? currentFuel / selectedRate : NaN;
  const fuelPercent = hasFuel && Number.isFinite(capacity) && capacity > 0
    ? Math.min(100, Math.max(0, (currentFuel / capacity) * 100))
    : 0;
  const requiredPercent = ready && Number.isFinite(capacity) && capacity > 0
    ? Math.min(100, Math.max(0, (required / capacity) * 100))
    : 0;
  const volume = (value) => Number.isFinite(value) ? formatFuelVolume(value) : "--";
  const laps = (value) => Number.isFinite(value) ? `${value.toFixed(1)} laps` : "--";
  const scenarioAdd = (rate) => (
    hasFuel && hasRemaining && Number.isFinite(rate)
      ? Math.max(0, rate * targetLaps - currentFuel)
      : NaN
  );

  renderFuelDashboard(telemetry, {
    currentFuel, capacity, remaining, average, last, maximum, sampleCount,
    selectedRate, required, recommendedAdd, finishWithoutStop, finishReserve,
    range, fuelPercent, fillRate, safeRate, targetLaps,
  });

  setText(document.getElementById("fuel-cal-current"), volume(currentFuel));
  setText(document.getElementById("fuel-cal-capacity"), Number.isFinite(capacity) ? volume(capacity) : "FULL");
  setText(document.getElementById("fuel-cal-range"), laps(range));
  setText(document.getElementById("fuel-cal-laps-remaining"), laps(remaining));
  setText(document.getElementById("fuel-cal-at-finish"), volume(finishWithoutStop));
  setText(document.getElementById("fuel-cal-last"), volume(last));
  setText(document.getElementById("fuel-cal-average"), volume(average));
  setText(document.getElementById("fuel-cal-maximum"), volume(maximum));
  setText(document.getElementById("fuel-cal-sample-count"), `${sampleCount} ${sampleCount === 1 ? "LAP" : "LAPS"}`);
  setText(document.getElementById("fuel-cal-attack-add"), volume(scenarioAdd(safeRate)));
  setText(document.getElementById("fuel-cal-balanced-add"), volume(scenarioAdd(average)));
  setText(document.getElementById("fuel-cal-save-add"), volume(scenarioAdd(average * 0.96)));
  setText(document.getElementById("fuel-cal-attack-rate"), Number.isFinite(safeRate) ? `${volume(safeRate)} / lap` : "Highest use");
  setText(document.getElementById("fuel-cal-balanced-rate"), hasConsumption ? `${volume(average)} / lap` : "5-lap average");
  setText(document.getElementById("fuel-cal-save-rate"), hasConsumption ? `${volume(average * 0.96)} / lap target` : "4% target saving");
  setText(document.getElementById("fuel-cal-required"), volume(required));
  setText(document.getElementById("fuel-cal-recommended"), ready ? `+${volume(recommendedAdd)}` : "--");
  setText(document.getElementById("fuel-cal-finish-reserve"), volume(finishReserve));
  setText(document.getElementById("fuel-cal-refuel-time"), ready ? `${(recommendedAdd / fillRate).toFixed(1)} s` : "--");

  if (fuelCalTankFillEl) fuelCalTankFillEl.style.width = `${fuelPercent}%`;
  if (fuelCalRequiredMarkerEl) fuelCalRequiredMarkerEl.style.left = `${requiredPercent}%`;

  const confidence = sampleCount >= 8 ? "HIGH" : sampleCount >= 3 ? "MEDIUM" : sampleCount > 0 ? "LOW" : "NO DATA";
  setText(fuelCalConfidenceEl, `${confidence} CONFIDENCE`);
  fuelCalConfidenceEl?.classList.toggle("is-high", confidence === "HIGH");
  fuelCalConfidenceEl?.classList.toggle("is-medium", confidence === "MEDIUM");

  fuelCalStatusEl?.classList.remove("is-waiting", "is-warning", "is-critical");
  if (!ready) {
    fuelCalStatusEl?.classList.add("is-waiting");
    setText(document.getElementById("fuel-cal-state-label"), "WAITING FOR DATA");
    setText(
      document.getElementById("fuel-cal-state-message"),
      hasFuel ? "Complete a lap to calculate fuel" : "Waiting for live fuel telemetry",
    );
    setText(document.getElementById("fuel-cal-state-detail"), `${sampleCount} valid consumption samples`);
  } else if (finishWithoutStop < 0) {
    fuelCalStatusEl?.classList.add("is-critical");
    setText(document.getElementById("fuel-cal-state-label"), "PIT REQUIRED");
    setText(document.getElementById("fuel-cal-state-message"), `Add ${volume(recommendedAdd)} to reach the finish`);
    setText(document.getElementById("fuel-cal-state-detail"), `${reserve.toFixed(2)} lap reserve included · ${confidence.toLowerCase()} confidence`);
  } else if (finishWithoutStop < selectedRate * reserve) {
    fuelCalStatusEl?.classList.add("is-warning");
    setText(document.getElementById("fuel-cal-state-label"), "FUEL MARGINAL");
    setText(document.getElementById("fuel-cal-state-message"), `${volume(finishWithoutStop)} expected at the finish`);
    setText(document.getElementById("fuel-cal-state-detail"), "Increase reserve or prepare to fuel save");
  } else {
    setText(document.getElementById("fuel-cal-state-label"), "FUEL OK");
    setText(document.getElementById("fuel-cal-state-message"), `${laps(finishWithoutStop / selectedRate)} of fuel in hand`);
    setText(document.getElementById("fuel-cal-state-detail"), `${fuelCalMode.toUpperCase()} model · ${volume(selectedRate)} per lap`);
  }

}

function renderFuelDashboard(telemetry, fuel) {
  const strategy = telemetry?.fuel_strategy || {};
  const value = (number, digits = 1) => Number.isFinite(number) ? `${number.toFixed(digits)} L` : "--";
  const lapCount = (number) => Number.isFinite(number) ? number.toFixed(1) : "--";
  const addFor = (rate) => (
    Number.isFinite(rate) && Number.isFinite(fuel.targetLaps) && Number.isFinite(fuel.currentFuel)
      ? Math.max(0, rate * fuel.targetLaps - fuel.currentFuel)
      : NaN
  );
  const density = Number(telemetry?.fuel_density);
  const fuelMass = Number.isFinite(density) && Number.isFinite(fuel.currentFuel)
    ? density * fuel.currentFuel : NaN;
  const tankReserve = Number.isFinite(fuel.capacity) ? fuel.capacity * 0.02 : NaN;
  const usableCapacity = Number.isFinite(fuel.capacity) ? fuel.capacity - tankReserve : NaN;
  const usePerHour = Number(telemetry?.player_fuel_use_per_hour ?? telemetry?.fuel_use_per_hour);
  const lap = Number(telemetry?.current_lap ?? telemetry?.laps_completed);
  const sessionLaps = Number(telemetry?.session_laps_total);
  const onPitRoad = Boolean(telemetry?.player_on_pit_road ?? telemetry?.on_pit_road);
  const currentLap = Number.isFinite(lap) ? Math.max(1, Math.floor(lap)) : 1;
  const plannedLaps = Number.isFinite(fuel.targetLaps) ? Math.max(0, Math.ceil(fuel.targetLaps)) : NaN;
  const needsStop = Number.isFinite(fuel.recommendedAdd) && fuel.recommendedAdd > 0.05;
  const pitLap = (
    needsStop && Number.isFinite(fuel.range)
      ? currentLap + Math.max(1, Math.floor(fuel.range))
      : NaN
  );
  const fuelAfterStop = (
    Number.isFinite(fuel.currentFuel) && Number.isFinite(fuel.recommendedAdd)
      ? Math.min(fuel.capacity || Infinity, fuel.currentFuel + fuel.recommendedAdd)
      : NaN
  );
  const scenarioFinish = (rate, added) => (
    Number.isFinite(rate) && Number.isFinite(added)
    && Number.isFinite(fuel.currentFuel) && Number.isFinite(fuel.targetLaps)
      ? fuel.currentFuel + added - rate * fuel.targetLaps
      : NaN
  );
  const safeAdd = addFor(fuel.safeRate);
  const balancedAdd = addFor(fuel.average);
  const saveRate = fuel.average * 0.96;
  const saveAdd = addFor(saveRate);
  const weather = telemetry?.weather || {};

  setText(document.getElementById("fuel-live-current"), value(fuel.currentFuel));
  setText(document.getElementById("fuel-live-range"), lapCount(fuel.range));
  setText(document.getElementById("fuel-live-remaining"), lapCount(fuel.remaining));
  setText(document.getElementById("fuel-live-percent"), Number.isFinite(fuel.fuelPercent) ? `${fuel.fuelPercent.toFixed(0)}%` : "--");
  setText(document.getElementById("fuel-live-capacity"), value(fuel.capacity));
  setText(document.getElementById("fuel-status-current"), value(fuel.currentFuel));
  setText(document.getElementById("fuel-status-tank-capacity"), value(fuel.capacity));
  setText(document.getElementById("fuel-status-usable-capacity"), value(usableCapacity));
  setText(document.getElementById("fuel-status-reserve"), value(tankReserve));
  setText(document.getElementById("fuel-live-density"), Number.isFinite(density) ? `${density.toFixed(3)} kg/L` : "--");
  setText(document.getElementById("fuel-live-mass"), Number.isFinite(fuelMass) ? `${fuelMass.toFixed(1)} kg` : "--");
  setText(document.getElementById("fuel-live-lap"), Number.isFinite(lap) ? `${Math.max(1, Math.floor(lap))}` : "--");
  setText(document.getElementById("fuel-live-session-laps"), Number.isFinite(sessionLaps) ? `${Math.floor(sessionLaps)}` : "--");
  setText(document.getElementById("fuel-live-pit"), onPitRoad ? "YES" : "NO");
  setText(document.getElementById("fuel-live-samples"), `${fuel.sampleCount} laps`);
  setText(document.getElementById("fuel-live-confidence"), fuel.sampleCount >= 8 ? "HIGH CONFIDENCE" : fuel.sampleCount >= 3 ? "MEDIUM CONFIDENCE" : "COLLECTING LAP DATA");
  setText(document.getElementById("fuel-live-finish"), value(fuel.finishReserve));
  setText(document.getElementById("fuel-live-add"), Number.isFinite(fuel.recommendedAdd) ? `+${value(fuel.recommendedAdd)}` : "--");
  setText(document.getElementById("fuel-live-reserve"), value(fuel.finishReserve));
  setText(document.getElementById("fuel-live-refuel"), Number.isFinite(fuel.recommendedAdd) ? `${(fuel.recommendedAdd / fuel.fillRate).toFixed(1)} s` : "--");
  setText(document.getElementById("fuel-live-safe"), value(addFor(fuel.safeRate)));
  setText(document.getElementById("fuel-live-balanced"), value(addFor(fuel.average)));
  setText(document.getElementById("fuel-live-save"), value(addFor(fuel.average * 0.96)));
  setText(document.getElementById("fuel-live-last"), value(fuel.last, 2));
  setText(document.getElementById("fuel-live-average"), value(fuel.average, 2));
  setText(document.getElementById("fuel-live-maximum"), value(fuel.maximum, 2));
  setText(document.getElementById("fuel-live-hour"), Number.isFinite(usePerHour) ? `${usePerHour.toFixed(1)} kg/h` : "--");
  setText(document.getElementById("fuel-plan-laps-one"), Number.isFinite(plannedLaps) ? `${currentLap} – ${currentLap + plannedLaps}` : "--");
  setText(document.getElementById("fuel-plan-rate-one"), value(fuel.selectedRate, 2));
  setText(document.getElementById("fuel-plan-start-one"), value(fuel.currentFuel));
  setText(document.getElementById("fuel-plan-end-one"), value(fuel.finishWithoutStop));
  setText(document.getElementById("fuel-plan-pit-one"), Number.isFinite(pitLap) ? `${pitLap}` : "–");
  setText(document.getElementById("fuel-plan-add-one"), needsStop ? value(fuel.recommendedAdd) : "–");
  setText(document.getElementById("fuel-plan-total-one"), value(fuelAfterStop));
  setText(document.getElementById("fuel-plan-laps-two"), needsStop && Number.isFinite(pitLap) && Number.isFinite(plannedLaps) ? `${pitLap} – ${currentLap + plannedLaps}` : "–");
  setText(document.getElementById("fuel-plan-rate-two"), needsStop ? value(fuel.selectedRate, 2) : "–");
  setText(document.getElementById("fuel-plan-start-two"), needsStop ? value(fuelAfterStop) : "–");
  setText(document.getElementById("fuel-plan-end-two"), needsStop ? value(fuel.finishReserve) : "–");
  setText(document.getElementById("fuel-plan-pit-two"), "–");
  setText(document.getElementById("fuel-plan-add-two"), "–");
  setText(document.getElementById("fuel-plan-total-two"), needsStop ? value(fuel.finishReserve) : "–");
  setText(document.getElementById("fuel-plan-current-finish"), value(fuel.finishReserve));
  setText(document.getElementById("fuel-plan-current-stops"), Number.isFinite(fuel.recommendedAdd) ? `${needsStop ? 1 : 0}` : "--");
  setText(document.getElementById("fuel-plan-current-margin"), value(fuel.finishReserve));
  setText(document.getElementById("fuel-plan-early-finish"), value(scenarioFinish(fuel.safeRate, safeAdd)));
  setText(document.getElementById("fuel-plan-early-stops"), Number.isFinite(safeAdd) ? `${safeAdd > 0.05 ? 1 : 0}` : "--");
  setText(document.getElementById("fuel-plan-early-add"), value(safeAdd));
  setText(document.getElementById("fuel-plan-late-finish"), value(scenarioFinish(fuel.average, balancedAdd)));
  setText(document.getElementById("fuel-plan-late-stops"), Number.isFinite(balancedAdd) ? `${balancedAdd > 0.05 ? 1 : 0}` : "--");
  setText(document.getElementById("fuel-plan-late-add"), value(balancedAdd));
  setText(document.getElementById("fuel-plan-save-finish"), value(scenarioFinish(saveRate, saveAdd)));
  setText(document.getElementById("fuel-plan-save-stops"), Number.isFinite(saveAdd) ? `${saveAdd > 0.05 ? 1 : 0}` : "--");
  setText(document.getElementById("fuel-plan-save-add"), value(saveAdd));
  setText(document.getElementById("fuel-calculator-laps"), Number.isFinite(plannedLaps) ? `${plannedLaps}` : "--");
  setText(
    document.getElementById("fuel-calculator-window"),
    Number.isFinite(pitLap) ? `LAP ${Math.max(currentLap, pitLap - 2)} – ${pitLap + 2}` : "NO STOP",
  );
  setText(document.getElementById("fuel-calculator-optimal"), Number.isFinite(pitLap) ? `${pitLap}` : "–");
  setText(document.getElementById("fuel-calculator-total"), value(fuelAfterStop));
  setText(
    document.getElementById("fuel-calculator-margin-laps"),
    Number.isFinite(fuel.finishReserve) && Number.isFinite(fuel.selectedRate) && fuel.selectedRate > 0
      ? `+${Math.max(0, fuel.finishReserve / fuel.selectedRate).toFixed(1)} LAPS`
      : "--",
  );
  setText(document.getElementById("fuel-variable-track-temp"), formatTemperature(weather.track_temp));
  setText(document.getElementById("fuel-variable-air-temp"), formatTemperature(weather.air_temp));
  setText(
    document.getElementById("fuel-variable-wind"),
    Number.isFinite(Number(weather.wind_speed)) ? formatWindSpeed(Number(weather.wind_speed)) : "--",
  );
  setText(
    document.getElementById("fuel-variable-track-rubber"),
    telemetry?.weather?.track_rubber || "--",
  );
  setText(
    document.getElementById("fuel-variable-traffic"),
    telemetry?.traffic?.car_ahead || telemetry?.traffic?.car_behind ? "Medium" : "Clear",
  );
  setText(document.getElementById("fuel-stint-laps"), Number.isFinite(fuel.remaining) ? `NOW – ${Math.ceil(fuel.remaining)}` : "--");
  setText(document.getElementById("fuel-stint-rate"), value(fuel.selectedRate, 2));
  setText(document.getElementById("fuel-stint-start"), value(fuel.currentFuel));
  setText(document.getElementById("fuel-stint-end"), value(fuel.finishWithoutStop));
  setText(document.getElementById("fuel-stint-action"), Number.isFinite(fuel.recommendedAdd) && fuel.recommendedAdd > 0.05 ? `ADD ${value(fuel.recommendedAdd)}` : "NO STOP");

  const level = document.getElementById("fuel-live-level");
  if (level) level.style.width = `${fuel.fuelPercent || 0}%`;
  const dial = document.getElementById("fuel-live-dial");
  if (dial) dial.style.setProperty("--fuel-pct", `${(fuel.fuelPercent || 0) * 2.7}deg`);

  const samples = Array.isArray(strategy.lap_samples) ? strategy.lap_samples.map(Number).filter(Number.isFinite) : [];
  const averageOf = (values) => values.length
    ? values.reduce((sum, sample) => sum + sample, 0) / values.length
    : NaN;
  const averageAll = averageOf(samples);
  const averageFive = averageOf(samples.slice(-5));
  const averageTen = averageOf(samples.slice(-10));
  const currentDelta = Number.isFinite(fuel.last) && Number.isFinite(averageFive)
    ? fuel.last - averageFive
    : NaN;
  setText(document.getElementById("fuel-per-lap-primary"), value(fuel.average, 2));
  setText(document.getElementById("fuel-per-lap-summary-primary"), value(fuel.average, 2));
  setText(document.getElementById("fuel-per-lap-average"), value(averageAll, 2));
  setText(document.getElementById("fuel-per-lap-five"), value(averageFive, 2));
  setText(document.getElementById("fuel-per-lap-ten"), value(averageTen, 2));
  setText(
    document.getElementById("fuel-delta-value"),
    Number.isFinite(currentDelta) ? `${currentDelta >= 0 ? "+" : ""}${currentDelta.toFixed(2)} L / LAP` : "--",
  );
  const deltaLine = document.getElementById("fuel-delta-line");
  const deltaArea = document.getElementById("fuel-delta-area");
  if (deltaLine && deltaArea && samples.length > 1 && Number.isFinite(averageFive)) {
    const deltaPoints = samples.slice(-20).map((sample, index, values) => {
      const x = 260 * index / Math.max(1, values.length - 1);
      const delta = Math.max(-0.25, Math.min(0.25, sample - averageFive));
      const y = 45 - (delta / 0.25) * 30;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    deltaLine.setAttribute("d", `M${deltaPoints.join(" L")}`);
    deltaArea.setAttribute("d", `M${deltaPoints[0]} L${deltaPoints.join(" L")} L260 75 L0 75 Z`);
  } else {
    deltaLine?.setAttribute("d", "");
    deltaArea?.setAttribute("d", "");
  }
  const maxFuel = Number.isFinite(fuel.capacity) && fuel.capacity > 0 ? fuel.capacity : Math.max(fuel.currentFuel || 1, 1);
  const totalLaps = Math.max(1, Number.isFinite(fuel.remaining) ? fuel.remaining : 10);
  const point = (index, amount, count = totalLaps) => {
    const x = 48 + (832 * index / Math.max(1, count));
    const y = 246 - (216 * Math.max(0, Math.min(maxFuel, amount)) / maxFuel);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  const projected = document.getElementById("fuel-chart-projected");
  const actual = document.getElementById("fuel-chart-actual");
  const current = document.getElementById("fuel-chart-current");
  if (projected && Number.isFinite(fuel.currentFuel) && Number.isFinite(fuel.selectedRate)) {
    const endFuel = fuel.currentFuel - fuel.selectedRate * totalLaps;
    projected.setAttribute("d", `M${point(0, fuel.currentFuel)} L${point(totalLaps, endFuel)}`);
  } else projected?.setAttribute("d", "");
  if (actual && samples.length && Number.isFinite(fuel.currentFuel)) {
    let amount = fuel.currentFuel + samples.reduce((sum, sample) => sum + sample, 0);
    const points = [point(0, amount, samples.length)];
    samples.forEach((sample, index) => { amount -= sample; points.push(point(index + 1, amount, samples.length)); });
    actual.setAttribute("d", `M${points.join(" L")}`);
  } else actual?.setAttribute("d", "");
  if (current) {
    const [cx, cy] = point(0, fuel.currentFuel || 0).split(" ");
    current.setAttribute("cx", cx); current.setAttribute("cy", cy);
  }
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
  renderFuelStrategy(snapshot.telemetry || {});
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
  const freshnessLimitMs = Math.max(2000, Number(snapshot.ui_refresh_rate_ms || 100) * 5);
  const hasRecentTelemetry = Boolean(
    snapshot.connected
    && Object.keys(sourceTelemetry).length > 0
    && Date.now() - lastSnapshotAt <= freshnessLimitMs
  );
  // Old frames are deliberately not rendered. A frozen value is more
  // dangerous trackside than an explicit unavailable marker.
  const telemetry = hasRecentTelemetry ? sourceTelemetry : {};
  renderFuelCalculator(telemetry);
  const pitTireChanges = telemetry.pit_tire_changes || {};
  const fastRepairsRemaining = formatFastRepairsRemaining(
    telemetry.fast_repairs_limit,
    telemetry.player_fast_repairs_used,
  );
  const hasNoFastRepairs = fastRepairsRemaining === "0";
  const testRepairButtons = document.querySelectorAll(
    ".test-pit-status-copy .test-repair:not(.test-repair-top)",
  );
  const hasAvailableFastRepair = fastRepairsRemaining === "∞"
    || (Number.isFinite(Number(fastRepairsRemaining)) && Number(fastRepairsRemaining) > 0);
  testRepairButtons.forEach((testRepairButton) => {
    testRepairButton.hidden = !hasAvailableFastRepair;
    testRepairButton.setAttribute("aria-hidden", String(!hasAvailableFastRepair));
    if (!hasAvailableFastRepair) testRepairButton.setAttribute("aria-pressed", "false");
  });
  pitFastRepairToggleEls.forEach((button) => {
    button.disabled = hasNoFastRepairs;
    button.title = hasNoFastRepairs ? "No fast repairs remaining" : "";
  });
  if (pitFastRepairEl) {
    pitFastRepairEl.disabled = hasNoFastRepairs;
    if (hasNoFastRepairs && pitFastRepairEl.checked) {
      pitFastRepairEl.checked = false;
      syncPitFastRepair();
    }
  }
  if (
    typeof telemetry.pit_windscreen_tearoff === "boolean"
    && !pitCarTearoffToggleEl?.disabled
  ) {
    pitCarTearoffToggleEl?.setAttribute(
      "aria-pressed",
      String(telemetry.pit_windscreen_tearoff),
    );
    if (pitWindscreenTearoffEl) {
      pitWindscreenTearoffEl.checked = telemetry.pit_windscreen_tearoff;
    }
    pitCarTearoffToggleEl?.classList.remove("has-command-error");
  }
  if (typeof telemetry.pit_windscreen_tearoff === "boolean") {
    document.querySelectorAll(".test-windscreen-tearoff").forEach((button) => {
      if (button.classList.contains("is-command-pending")) return;
      button.setAttribute(
        "aria-pressed",
        String(telemetry.pit_windscreen_tearoff),
      );
      button.classList.remove("has-command-error");
    });
  }
  const telemetryTireEstimates = telemetry.tire_change_estimates;
  if (telemetryTireEstimates && typeof telemetryTireEstimates === "object") {
    pitTireChangeEstimates = {
      ...pitTireChangeEstimates,
      ...telemetryTireEstimates,
    };
    if (pitTireChangeEstimateEl) {
      pitTireChangeEstimateEl.title = telemetry.tire_change_estimate_source === "learned"
        ? "Estimated from measured tire service time for this car"
        : "Default estimate until a tire service has been measured for this car";
    }
  }
  pitTireChangeButtons.forEach((button) => {
    const selected = pitTireChanges[button.dataset.wheel];
    if (!button.classList.contains("is-command-pending") && typeof selected === "boolean") {
      button.setAttribute("aria-pressed", String(selected));
      button.classList.remove("has-command-error");
    }
  });
  syncTestTireChangesFromTelemetry(pitTireChanges);
  syncTestTireCompoundFromTelemetry(telemetry.pit_tire_compound);
  syncPitAllTiresToggle();
  updatePitTireChangeEstimate();
  if (isNewSnapshot) recordMapTelemetrySample(
    telemetry.track_map,
    frameTime,
    telemetry.telemetry_tick,
  );
  latestMapTelemetry = telemetry;
  latestStandings = telemetry.standings || [];
  if (activeScreen === "map" && !screenActivationPending) renderMapClassFilters(latestStandings);
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
  renderTestWeather(snapshot, telemetry, hasRecentTelemetry);

  const playerInputs = telemetry.player_inputs || {};
  const tireWear = telemetry.tire_wear || {};
  const tireTemperature = telemetry.tire_temperature || {};
  const tirePressure = telemetry.tire_pressure || {};
  const brakeTemperature = telemetry.brake_temperature || {};
  const playerRpm = telemetry.player_rpm ?? telemetry.focus_rpm;
  const playerFuelLevel = telemetry.player_fuel_level ?? telemetry.fuel_level;
  const focusedClassCarCount = getFocusedClassCarCount(telemetry);
  const focusedClassName = getFocusedClassName(telemetry);

  renderSessionNotice(snapshot, telemetry);

  setText(leaderboardWatchingNumberEl, telemetry.driver_name
    ? `#${telemetry.car_number || "--"}`
    : "--");
  setText(leaderboardWatchingDriverEl, telemetry.driver_name
    ? [telemetry.driver_name, telemetry.team_name || telemetry.car_name].filter(Boolean).join(" | ")
    : "Waiting for camera focus...");
  setText(mapWatchingEl, telemetry.driver_name
    ? `#${telemetry.car_number || "--"}  ${telemetry.driver_name}`
    : "Waiting for camera...");
  setText(sessionTrackNameEl, telemetry.track_name || "--");

  setTimeRemainingCountdown(telemetry.session_time_remain);
  setText(ingameTimeEl, formatIngameTime(telemetry.session_time_of_day));
  setText(lapsRemainingEl, formatRaceLapCount(
    telemetry.current_lap,
    telemetry.session_laps_total,
    telemetry.session_laps_remain_estimated === true,
  ));
  setText(windSpeedEl, formatWindSpeed(telemetry.weather?.wind_speed));
  setText(humidityEl, typeof telemetry.weather?.humidity === "number"
    ? `${formatNumber(telemetry.weather.humidity, 0)}%`
    : "--");
  setText(windDirectionEl, formatWindDirection(telemetry.weather?.wind_direction));
  updateWindDirectionArrow(telemetry.weather?.wind_direction);
  setText(airTempEl, formatTemperature(telemetry.weather?.air_temp));
  setText(trackTempEl, formatTemperature(telemetry.weather?.track_temp));
  setText(cloudCoverEl, formatSkies(telemetry.weather?.skies));
  setText(rainStateEl, formatRainState(
    telemetry.weather?.rain_state,
    telemetry.weather?.precipitation,
  ));
  setText(precipitationEl, typeof telemetry.weather?.precipitation === "number"
    ? `${formatNumber(telemetry.weather.precipitation, 0)}%`
    : "--");
  setText(fogEl, typeof telemetry.weather?.fog === "number"
    ? `${formatNumber(telemetry.weather.fog, 0)}%`
    : "--");
  setText(trackWetnessEl, formatTrackWetness(telemetry.weather?.track_wetness));
  setText(carNumberEl, telemetry.car_number || "--");
  setText(driverNameEl, telemetry.driver_name || "Unknown driver");
  setText(carNameEl, telemetry.car_name || "Unknown car");
  updatePitCarIconFromTelemetry(telemetry);
  setText(positionEl, telemetry.class_position != null
    ? `${telemetry.class_position}/${focusedClassCarCount || "--"}`
    : "--");
  setText(classPositionEl, focusedClassName || "--");
  setText(lapsCompletedEl, formatInteger(telemetry.laps_completed));
  setText(lapProgressEl, telemetry.lap_dist_pct != null
    ? formatPercent(telemetry.lap_dist_pct * 100, 1)
    : "--");
  setText(focusGearEl, formatGear(telemetry.focus_gear));
  setText(focusRpmEl, formatInteger(telemetry.focus_rpm));
  setText(speedKphEl, formatSpeed(telemetry.focused_speed_ms ?? playerInputs.speed_ms));

  setText(statusTireLfTempEl, formatTemperature(tireTemperature.lf, 0, false));
  setText(statusTireRfTempEl, formatTemperature(tireTemperature.rf, 0, false));
  setText(statusTireLrTempEl, formatTemperature(tireTemperature.lr, 0, false));
  setText(statusTireRrTempEl, formatTemperature(tireTemperature.rr, 0, false));
  Object.entries(statusTyreCards).forEach(([position, element]) => {
    setVisualState(element, getThermalState(tireTemperature[position], 60, 100, 120));
  });
  setText(statusBrakeLfTempEl, formatTemperature(brakeTemperature.lf, 0, false));
  setText(statusBrakeRfTempEl, formatTemperature(brakeTemperature.rf, 0, false));
  setText(statusBrakeLrTempEl, formatTemperature(brakeTemperature.lr, 0, false));
  setText(statusBrakeRrTempEl, formatTemperature(brakeTemperature.rr, 0, false));
  [[statusBrakeLfTempEl, brakeTemperature.lf], [statusBrakeRfTempEl, brakeTemperature.rf],
    [statusBrakeLrTempEl, brakeTemperature.lr], [statusBrakeRrTempEl, brakeTemperature.rr]]
    .forEach(([element, value]) => setVisualState(element, getThermalState(value, 300, 750, 900)));
  setText(statusTireLfWearEl, formatWearPercent(tireWear.lf));
  setText(statusTireRfWearEl, formatWearPercent(tireWear.rf));
  setText(statusTireLrWearEl, formatWearPercent(tireWear.lr));
  setText(statusTireRrWearEl, formatWearPercent(tireWear.rr));
  setWearStatusBar(statusTireLfWearBarEl, tireWear.lf);
  setWearStatusBar(statusTireRfWearBarEl, tireWear.rf);
  setWearStatusBar(statusTireLrWearBarEl, tireWear.lr);
  setWearStatusBar(statusTireRrWearBarEl, tireWear.rr);
  Object.entries(statusTirePressureGauges).forEach(([position, gauge]) => {
    const pressureSource = tirePressure[position];
    const rawPressure = Number(pressureSource);
    const pressureBar = pressureSource != null && Number.isFinite(rawPressure)
      ? (rawPressure > 10 ? rawPressure / 100 : rawPressure)
      : null;
    const displayPressure = formatPressure(
      pressureSource != null && Number.isFinite(rawPressure) ? rawPressure : null,
    );
    setText(gauge.querySelector("strong"), displayPressure);
    const level = pressureBar == null
      ? 0
      : Math.max(0, Math.min(100, ((pressureBar - 1) / 1.5) * 100));
    gauge.querySelector(".tyre-pressure-scale i")
      ?.style.setProperty("--pressure-level", `${level}%`);
    gauge.classList.toggle("is-unavailable", pressureBar == null);
  });

  setText(statusEngineTempEl, formatTemperature(telemetry.engine_temperature));
  setStatusBar(statusEngineTempBarEl, telemetry.engine_temperature, 60, 130);
  setSystemState("engine", getThermalState(telemetry.engine_temperature, 60, 115, 125), statusEngineTempBarEl);
  setText(statusOilTempEl, formatTemperature(telemetry.oil_temperature));
  renderOilTemperatureHistory(telemetry.oil_temperature, telemetry.session_key);
  setStatusBar(statusRpmBarEl, playerRpm, 0, telemetry.rpm_limit || 10000);
  const rpmRatio = typeof playerRpm === "number" && playerRpm >= 0
    ? playerRpm / (telemetry.rpm_limit || 10000)
    : null;
  setSystemState("rpm", rpmRatio == null ? "unavailable" : getLevelState(1 - rpmRatio, 0.05, 0.15), statusRpmBarEl);
  setText(statusFuelValueEl, formatFuelVolume(playerFuelLevel));
  setStatusBar(statusFuelBarEl, playerFuelLevel, 0, telemetry.fuel_capacity || 100);
  const fuelRatio = typeof playerFuelLevel === "number" && playerFuelLevel >= 0
    ? playerFuelLevel / (telemetry.fuel_capacity || 100)
    : null;
  setSystemState("fuel", fuelRatio == null ? "unavailable" : getLevelState(fuelRatio, 0.1, 0.25), statusFuelBarEl);
  setText(statusWaterTempEl, formatTemperature(telemetry.water_temperature));
  recordWaterTemperature(
    telemetry.engine_temperature,
    telemetry.session_key,
    Number.isFinite(Number(snapshot.updated_at))
      ? Number(snapshot.updated_at) * 1000
      : Date.now(),
  );
  setText(statusEmptyLapEl, estimateEmptyLap(telemetry).replace(/^lap\s*/, ""));

  setText(leaderboardCurrentLapEl, telemetry.current_lap ?? "--");
  setText(leaderboardPositionEl, telemetry.position != null ? `P${telemetry.position}` : "--");
  setText(leaderboardLastLapEl, formatSeconds(telemetry.lap_time));
  setText(leaderboardBestLapEl, formatSeconds(telemetry.best_lap_time));

  renderAlerts(snapshot.alerts || []);
  if (activeScreen === "map" && !screenActivationPending) scheduleTrackMapFrame();
  if (frameTime - lastHeavyRenderAt >= HEAVY_RENDER_INTERVAL_MS) {
    lastHeavyRenderAt = frameTime;
    if (
      activeScreen === "leaderboard"
      && !screenActivationPending
      && leaderboardEventsEnabled
      && currentEventSessionKey
      && Date.now() - lastEventLoadAt >= 500
    ) {
      loadLeaderboardEvents(currentEventSessionKey);
    }
    if (activeScreen === "leaderboard" && !screenActivationPending) {
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
    mapCarSampleHistory.clear();
    mapSampleClock = null;
    loadTrackSvg();
    refreshTrackMapLabels(telemetry.pit_exit_prediction || null);
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
    updatePitCarIconFromTelemetry(snapshot.telemetry);
    scheduleRender(snapshot);
  } catch {
    if (Date.now() - lastSnapshotAt > 5000) {
      scheduleRender({
        connected: false,
        error: "Unable to reach Race-Engineer backend",
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
      updatePitCarIconFromTelemetry(snapshot.telemetry);
      scheduleRender(snapshot);
    } catch {
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

// Re-check freshness if the stream freezes. An EventSource can remain open
// without delivering frames, so recover through the state endpoint as well.
setInterval(() => {
  if (!latestSnapshot || Date.now() - lastSnapshotAt > 1000) {
    loadState();
    return;
  }
  scheduleRender(latestSnapshot);
}, 1000);
