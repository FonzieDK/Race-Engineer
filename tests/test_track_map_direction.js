const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadProjectTrackPoint() {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  const start = source.indexOf("function projectTrackPoint(");
  assert.notEqual(start, -1, "projectTrackPoint must exist in app.js");

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
    `${source.slice(start, end + 1)}; this.result = projectTrackPoint;`,
    context,
  );
  return context.result;
}

test("increasing iRacing lap distance follows the circuit arrow against the SVG winding", () => {
  const projectTrackPoint = loadProjectTrackPoint();
  const sampledDistances = [];
  const geometry = {
    startFinishOffset: 20,
    trackLength: 100,
    trackPathEl: {
      getPointAtLength(distance) {
        sampledDistances.push(distance);
        return { x: distance, y: 0 };
      },
    },
    innerTrackPathEl: null,
    innerTrackLength: 0,
  };

  assert.equal(projectTrackPoint(0, geometry).x, 20);
  assert.ok(Math.abs(projectTrackPoint(0.1, geometry).x - 10) < 1e-9);
  assert.equal(sampledDistances[0], 20);
  assert.ok(Math.abs(sampledDistances[1] - 10) < 1e-9);
});

test("track projection wraps in race direction after a full lap", () => {
  const projectTrackPoint = loadProjectTrackPoint();
  const geometry = {
    startFinishOffset: 5,
    trackLength: 100,
    trackPathEl: {
      getPointAtLength(distance) {
        return { x: distance, y: 0 };
      },
    },
    innerTrackPathEl: null,
    innerTrackLength: 0,
  };

  assert.ok(Math.abs(projectTrackPoint(0.1, geometry).x - 95) < 1e-9);
});

test("all map views share the arrow-aligned track projection", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  assert.match(source, /trackProgressDirection:\s*-1/);
  assert.match(source, /function renderTrackMap[\s\S]*?projectTrackPoint\(progress, geometry\)/);
  assert.match(source, /function renderPitExitMap[\s\S]*?projectTrackPoint\(progress, geometry\)/);
  assert.match(source, /function renderFollowMap[\s\S]*?projectTrackPoint\(/);
});

test("large track map interpolates buffered telemetry samples", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  assert.match(source, /function recordMapTelemetrySample\(/);
  assert.match(source, /function getMapSampleTime\(/);
  assert.match(source, /const tickDurationMs = 1000 \/ 60/);
  assert.match(source, /function interpolateLapProgress\(/);
  assert.match(source, /const interpolationTime = frameTime - interpolationDelay/);
  assert.match(source, /mapCarSampleHistory\.get\(String\(car\.car_idx\)\)/);
});

test("large pit exit prediction interpolates live cars and its prediction ghost", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  assert.match(source, /function renderPitExitMap[\s\S]*?const interpolationTime = frameTime - interpolationDelay/);
  assert.match(source, /function renderPitExitMap[\s\S]*?mapCarSampleHistory\.get\(String\(car\.car_idx\)\)/);
  assert.match(source, /function renderPitExitMap[\s\S]*?const ghostOffset =[\s\S]*?focusedProgress \+ ghostOffset/);
  assert.doesNotMatch(source, /setText\(label, car\.pit_exit[\s\S]*?carsEl\.appendChild\(group\);\s*\}\);/);
});

test("map interpolation rejects replay seeks and limits extrapolation", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  assert.match(source, /Math\.abs\(progressDelta\) > 0\.08/);
  assert.match(source, /const maxExtrapolation = sampleDuration \* 0\.75/);
});

test("compact auxiliary maps render less often than the large map", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  assert.match(source, /const AUXILIARY_MAP_RENDER_INTERVAL_MS = 100/);
  assert.match(source, /largeTrackMapIndex === 1 \|\| auxiliaryMapsDue/);
  assert.match(source, /largeTrackMapIndex === 2 \|\| auxiliaryMapsDue/);
});

test("large moving markers avoid expensive SVG shadow rasterization", () => {
  const styles = fs.readFileSync(path.join(__dirname, "..", "web", "app.css"), "utf8");
  assert.match(
    styles,
    /\.trackmap-stage \.map-car circle,[\s\S]*?\.trackmap-stage \.follow-map-car circle\s*\{[^}]*filter:\s*none/s,
  );
});
