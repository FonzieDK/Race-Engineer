const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");

test("oil temperature chart uses live paths and endpoint markers", () => {
  assert.match(html, /id="status-oil-temp-line" d=""/);
  assert.match(html, /id="status-oil-temp-area" d=""/);
  assert.match(html, /id="status-oil-temp-start"/);
  assert.match(html, /id="status-oil-temp-current"/);
});

test("oil temperature history is session-bound and limited to one hour", () => {
  assert.match(script, /const OIL_TEMPERATURE_HISTORY_MS = 60 \* 60 \* 1000/);
  assert.match(script, /oilTemperatureSessionKey !== nextSessionKey/);
  assert.match(script, /sample\[0\] >= cutoff/);
  assert.match(script, /renderOilTemperatureHistory\(telemetry\.oil_temperature, telemetry\.session_key\)/);
});

test("oil temperature chart retains sampled history in browser storage", () => {
  assert.match(script, /const OIL_TEMPERATURE_SAMPLE_MS = 5000/);
  assert.match(script, /localStorage\.setItem\(OIL_TEMPERATURE_STORAGE_KEY/);
  assert.match(script, /saved\?\.sessionKey === oilTemperatureSessionKey/);
});
