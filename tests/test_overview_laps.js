const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadFormatRaceLapCount() {
  const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");
  const start = source.indexOf("function formatRaceLapCount(");
  assert.notEqual(start, -1, "formatRaceLapCount must exist in app.js");
  const end = source.indexOf("\n}", start) + 2;
  const context = {};
  vm.runInNewContext(`${source.slice(start, end)}; this.result = formatRaceLapCount;`, context);
  return context.result;
}

test("overview laps displays exact and estimated race totals", () => {
  const formatRaceLapCount = loadFormatRaceLapCount();

  assert.equal(formatRaceLapCount(31, 60, false), "31 / 60");
  assert.equal(formatRaceLapCount(70, 77, true), "70 / ~77");
  assert.equal(formatRaceLapCount(70, null, false), "70 / --");
});
