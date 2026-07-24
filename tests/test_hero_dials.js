const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const styles = fs.readFileSync(path.join(__dirname, "..", "web", "app.css"), "utf8");

test("overview instruments reserve space and contain large values", () => {
  assert.match(styles, /\.hero-right\s*\{[\s\S]*grid-template-columns:\s*minmax\(72px,\s*0\.72fr\)[\s\S]*minmax\(110px,\s*1\.18fr\)/);
  assert.match(styles, /\.dial\s*\{[\s\S]*min-width:\s*0[\s\S]*overflow:\s*hidden/);
  assert.match(styles, /#focus-rpm\s*\{[\s\S]*font-size:\s*clamp\(1\.75rem,\s*2\.25vw,\s*2\.35rem\)/);
  assert.match(styles, /#speed-kph\s*\{[\s\S]*font-size:\s*clamp\(1\.8rem,\s*2\.4vw,\s*2\.55rem\)/);
});
