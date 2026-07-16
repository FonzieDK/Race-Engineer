const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadFunction(name) {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist in app.js`);

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let end = bodyStart;
  for (; end < source.length; end += 1) {
    if (source[end] === "{") depth += 1;
    if (source[end] === "}") depth -= 1;
    if (depth === 0) break;
  }

  const context = {};
  vm.runInNewContext(`${source.slice(start, end + 1)}; this.result = ${name};`, context);
  return context.result;
}

test("all incident shapes remain available in the active race", () => {
  const isAvailableLeaderboardEvent = loadFunction("isAvailableLeaderboardEvent");
  const sessionKey = "race-1";

  assert.equal(isAvailableLeaderboardEvent({
    sessionKey,
    type: "inc",
    incidentPoints: 2,
    incidentTotal: 6,
  }, sessionKey), true);
  assert.equal(isAvailableLeaderboardEvent({
    sessionKey,
    type: "inc",
    incidentPoints: 2,
    incidentTotal: null,
  }, sessionKey), true);
  assert.equal(isAvailableLeaderboardEvent({
    sessionKey,
    type: "inc",
    description: "Car contact",
  }, sessionKey), true);
});

test("events from another race and incomplete swaps stay hidden", () => {
  const isAvailableLeaderboardEvent = loadFunction("isAvailableLeaderboardEvent");

  assert.equal(isAvailableLeaderboardEvent({
    sessionKey: "race-2",
    type: "inc",
    description: "Off track",
  }, "race-1"), false);
  assert.equal(isAvailableLeaderboardEvent({
    sessionKey: "race-1",
    type: "swap",
    oldDriver: "Driver A",
  }, "race-1"), false);
});
