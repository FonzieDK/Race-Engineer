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
  assert.doesNotMatch(html, />GRIP LEVEL</);
  assert.doesNotMatch(html, />RUBBER LEVEL</);
  assert.doesNotMatch(html, />MARBLES</);
  assert.doesNotMatch(html, />STANDING WATER</);
  assert.doesNotMatch(html, />RACING LINE GRIP</);
  assert.doesNotMatch(html, />N\/A</);
  assert.doesNotMatch(html, /id="weather-live-status"/);
  assert.match(script, /formatTrackWetness\(telemetry\.weather\?\.track_wetness\)/);
  assert.match(script, /setText\(cloudCoverEl, formatSkies\(telemetry\.weather\?\.skies\)\)/);
  assert.match(script, /Date\.now\(\) - lastSnapshotAt <= freshnessLimitMs/);
  assert.match(script, /const telemetry = hasRecentTelemetry \? sourceTelemetry : \{\}/);
  assert.doesNotMatch(html, />Dirt</);
});
