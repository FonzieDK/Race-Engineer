const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");

test("water temperature chart is driven by live one-hour history", () => {
  assert.match(html, /id="status-water-temp-chart"/);
  assert.match(html, /id="status-water-temp-area"[^>]*d=""/);
  assert.match(html, /id="status-water-temp-line"[^>]*d=""/);
  assert.match(html, /id="status-water-temp-start"/);
  assert.match(html, /id="status-water-temp-current"/);
  assert.doesNotMatch(html, /class="car-status-metric car-status-metric-engine"/);
  assert.match(app, /const WATER_TEMP_HISTORY_MS = 60 \* 60 \* 1000/);
  assert.match(app, /function recordWaterTemperature\(value, sessionKey/);
  assert.match(app, /point\.time >= now - WATER_TEMP_HISTORY_MS/);
  assert.match(app, /recordWaterTemperature\(\s*telemetry\.engine_temperature/);
});
