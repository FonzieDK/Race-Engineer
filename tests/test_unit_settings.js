const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");

test("header opens an accessible preferred-units modal", () => {
  assert.match(html, /id="unit-settings-toggle"[^>]*aria-haspopup="dialog"[^>]*aria-expanded="false"/);
  assert.match(html, /id="unit-settings-modal"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /data-unit-preference="speed"/);
  assert.match(html, /data-unit-preference="temperature"/);
  assert.match(html, /data-unit-preference="pressure"/);
  assert.match(html, /data-unit-preference="fuel"/);
  assert.match(styles, /\.unit-modal\.is-open/);
});

test("unit rows show their names and supporting descriptions", () => {
  assert.match(html, /class="unit-preference-copy"><strong>Speed unit<\/strong><small>Vehicle speed and wind speed<\/small>/);
  assert.match(html, /class="unit-preference-copy"><strong>Temperature unit<\/strong><small>Tyres, brakes, engine and weather<\/small>/);
  assert.match(html, /class="unit-preference-copy"><strong>Pressure unit<\/strong><small>Live tyre pressure<\/small>/);
  assert.match(html, /class="unit-preference-copy"><strong>Fuel unit<\/strong><small>Current fuel volume<\/small>/);
  assert.match(styles, /\.unit-preference-copy\s*\{[^}]*min-width:\s*0;/s);
});

test("unit selection persists and converts dashboard measurements", () => {
  assert.match(script, /localStorage\.setItem\("raceEngineerUnitPreferences", JSON\.stringify\(unitPreferences\)\)/);
  assert.match(script, /function formatTemperature\(/);
  assert.match(script, /function formatWindSpeed\(/);
  assert.match(script, /function formatFuelVolume\(/);
  assert.match(script, /unitPreferences\.speed === "mph" \? 2\.236936 : 3\.6/);
  assert.match(script, /value \* 0\.1450377/);
  assert.match(script, /value \* 0\.264172/);
});
