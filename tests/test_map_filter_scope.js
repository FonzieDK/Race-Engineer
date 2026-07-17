const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const script = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");

function getFunctionSource(name) {
  const start = script.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist in app.js`);

  const bodyStart = script.indexOf("{", start);
  let depth = 0;
  let end = bodyStart;
  for (; end < script.length; end += 1) {
    if (script[end] === "{") depth += 1;
    if (script[end] === "}") depth -= 1;
    if (depth === 0) break;
  }
  return script.slice(start, end + 1);
}

test("map class filter dims cars on the track and pit-exit maps", () => {
  assert.match(getFunctionSource("renderTrackMap"), /isMapCarDimmed\(car, standingsByCarIdx\)/);
  assert.match(getFunctionSource("renderPitExitMap"), /isMapCarDimmed\(car, standingsByCarIdx\)/);
  assert.doesNotMatch(getFunctionSource("renderFollowMap"), /isMapCarDimmed\(/);
});
