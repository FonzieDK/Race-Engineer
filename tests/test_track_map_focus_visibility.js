const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");

test("focused map car is never dimmed by a class filter", () => {
  assert.match(
    source,
    /function isMapCarDimmed[\s\S]*?return !car\?\.focused[\s\S]*?mapClassFilter !== "all"/,
  );
});

test("focused car is raised above overlapping cars on both live maps", () => {
  assert.match(source, /if \(car\.focused\) trackMapCarsEl\.appendChild\(group\)/);
  assert.match(source, /if \(car\.focused\) followCarsEl\.appendChild\(group\)/);
});
