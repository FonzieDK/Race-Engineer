const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");

test("overview position uses the focused car's class position and class field size", () => {
  assert.match(script, /function getFocusedClassCarCount\(telemetry\)/);
  assert.match(script, /setText\(positionEl, telemetry\.class_position != null/);
  assert.match(script, /`\$\{telemetry\.class_position\}\/\$\{focusedClassCarCount \|\| "--"\}`/);
  assert.doesNotMatch(script, /setText\(positionEl, telemetry\.position != null/);
});

test("overview class displays the focused car's class name", () => {
  assert.match(script, /function getFocusedClassName\(telemetry\)/);
  assert.match(script, /setText\(classPositionEl, focusedClassName \|\| "--"\)/);
  assert.doesNotMatch(script, /setText\(classPositionEl, telemetry\.class_position/);
});
