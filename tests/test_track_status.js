const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");

test("track status uses the same detail-row layout as weather status", () => {
  assert.match(html, /id="track-temp"/);
  assert.match(html, /id="track-wetness"/);
  assert.match(html, /id="track-skies"/);
  assert.match(html, /id="track-declared-wet"/);
  assert.match(html, /id="weather-live-status"[^>]*>Waiting</);
  assert.match(script, /formatTrackWetness\(telemetry\.weather\?\.track_wetness\)/);
  assert.match(script, /formatSkies\(telemetry\.weather\?\.skies\)/);
  assert.match(script, /Date\.now\(\) - updatedAtMs <= freshnessLimitMs/);
  assert.match(script, /const telemetry = hasRecentTelemetry \? sourceTelemetry : \{\}/);
  assert.doesNotMatch(html, />Dirt</);
});
