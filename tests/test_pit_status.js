const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");

test("pit lane and pit stall use distinct labels with the same blue style", () => {
  assert.match(script, /pit:\s*\{ label: "PIT LANE", className: "is-pit" \}/);
  assert.match(script, /pit_stall:\s*\{ label: "PIT STALL", className: "is-pit" \}/);
  assert.match(styles, /\.car-status\.is-pit\s*\{[^}]*color:\s*#ffffff[^}]*border-color:\s*#318bd0[^}]*background:\s*#07558f/s);
});
