const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadGetEventLap() {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  const start = source.indexOf("function getEventLap(");
  assert.notEqual(start, -1, "getEventLap must exist in app.js");

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let end = bodyStart;
  for (; end < source.length; end += 1) {
    if (source[end] === "{") depth += 1;
    if (source[end] === "}") depth -= 1;
    if (depth === 0) break;
  }

  const context = {};
  vm.runInNewContext(`${source.slice(start, end + 1)}; this.result = getEventLap;`, context);
  return context.result;
}

test("event lap is the current lap, not the number of completed laps", () => {
  const getEventLap = loadGetEventLap();

  assert.equal(getEventLap({ laps_completed: 57 }, 58), 58);
  assert.equal(getEventLap({ laps_completed: 58 }, 58), 58);
  assert.equal(getEventLap({ laps_completed: 0 }, 1), 1);
});

test("event lap falls back to the car's current lap when race lap is unavailable", () => {
  const getEventLap = loadGetEventLap();

  assert.equal(getEventLap({ laps_completed: 22 }, null), 23);
  assert.equal(getEventLap({ laps_completed: null }, null), "--");
});
