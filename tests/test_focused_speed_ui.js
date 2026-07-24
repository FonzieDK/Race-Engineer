const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");

test("speed card prefers the focused camera car speed", () => {
  assert.match(
    source,
    /setText\(speedKphEl, formatSpeed\(telemetry\.focused_speed_ms \?\? playerInputs\.speed_ms\)\)/,
  );
});
