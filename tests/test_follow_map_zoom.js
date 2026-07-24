const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadZoomMultiplier() {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  const start = source.indexOf("function getFollowMapZoomMultiplier(");
  assert.notEqual(start, -1, "getFollowMapZoomMultiplier must exist in app.js");

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let end = bodyStart;
  for (; end < source.length; end += 1) {
    if (source[end] === "{") depth += 1;
    if (source[end] === "}") depth -= 1;
    if (depth === 0) break;
  }

  const context = {};
  vm.runInNewContext(
    `${source.slice(start, end + 1)}; this.result = getFollowMapZoomMultiplier;`,
    context,
  );
  return context.result;
}

test("follow map zooms in at low speed and out at high speed", () => {
  const zoomMultiplier = loadZoomMultiplier();

  assert.ok(zoomMultiplier(0) > zoomMultiplier(100 / 3.6));
  assert.ok(zoomMultiplier(100 / 3.6) > zoomMultiplier(200 / 3.6));
  assert.ok(zoomMultiplier(200 / 3.6) > zoomMultiplier(300 / 3.6));
});

test("follow map zoom is clamped and preserves the old zoom without speed", () => {
  const zoomMultiplier = loadZoomMultiplier();

  assert.equal(zoomMultiplier(null), 1);
  assert.equal(zoomMultiplier(-10), zoomMultiplier(0));
  assert.equal(zoomMultiplier(400 / 3.6), zoomMultiplier(300 / 3.6));
});

test("follow map resets its heading when camera focus changes car", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");

  assert.match(source, /followState\.focusedCarId !== focusedCarId/);
  assert.match(source, /focusedCarId,\s*rotation: targetRotation/);
});

test("follow map projects the road locally and rerenders after the track SVG loads", () => {
  const root = path.join(__dirname, "..");
  const source = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");

  assert.match(html, /id="follow-map-road-shadow"/);
  assert.match(html, /id="follow-map-road"/);
  assert.doesNotMatch(html, /<use href="#track-/);
  assert.match(source, /if \(latestSnapshot\)/);
  assert.match(source, /const toFollowPoint = \(x, y\) =>/);
  assert.match(source, /followRoadEl\.setAttribute\("d", roadPath\)/);
  assert.match(source, /translate\(\$\{followPoint\.x\} \$\{followPoint\.y\}\)/);
});

test("track map rendering is locked to its own 60 Hz animation loop", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");

  assert.match(source, /const MAP_RENDER_INTERVAL_MS = 1000 \/ 60/);
  assert.match(source, /const AUXILIARY_MAP_RENDER_INTERVAL_MS = MAP_RENDER_INTERVAL_MS/);
  assert.match(source, /const FOLLOW_MAP_ROAD_INTERVAL_MS = MAP_RENDER_INTERVAL_MS/);
  assert.match(source, /function renderTrackMapAt60Hz\(frameTime\)/);
  assert.match(source, /requestAnimationFrame\(renderTrackMapAt60Hz\)/);
  assert.match(source, /latestMapTelemetry = telemetry/);
});
