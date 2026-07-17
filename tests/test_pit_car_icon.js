const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const telemetry = fs.readFileSync(path.join(root, "race_engineer", "telemetry.py"), "utf8");

test("pit tyre controls use a top-down car icon", () => {
  assert.match(html, /class="pit-car-plan"[\s\S]*?class="pit-car-icon[^"]*"/);
  assert.match(html, /class="pit-car-wheels"/);
  assert.match(html, /class="pit-car-body"/);
  assert.match(html, /class="pit-car-glass"/);
  assert.doesNotMatch(html, /class="pit-car-count"/);
  assert.match(styles, /\.pit-car-icon\s*\{/);
});

test("GTP prototype icon is rotated 180 degrees", () => {
  assert.match(html, /class="pit-car-icon pit-car-icon-gtp"[^>]*data-pit-car-icon="gtp"/);
  assert.match(html, /transform="rotate\(180 100 210\)"/);
  assert.match(html, /class="pit-car-wing"/);
});

test("Mercedes-AMG telemetry selects the AMG car icon", () => {
  assert.match(html, /data-pit-car-icon="amg"/);
  assert.match(html, /class="pit-car-amg-wing"/);
  assert.match(script, /normalizedName\.includes\("AMG"\)\) iconName = "amg"/);
  assert.match(script, /updatePitCarIconFromTelemetry\(telemetry\)/);
  assert.match(telemetry, /"player_car_name": player_car_name/);
});

test("pit car icon switches between GTP, GT3 and AMG", () => {
  assert.match(html, /data-pit-car-icon="gtp"/);
  assert.match(html, /data-pit-car-icon="gt3"/);
  assert.match(html, /data-pit-car-icon="amg"/);
  assert.match(script, /normalizedClass\.includes\("GTP"\)\) iconName = "gtp"/);
  assert.match(script, /let iconName = "gt3"/);
  assert.match(script, /updatePitCarIconFromTelemetry\(snapshot\.telemetry\)/);
  assert.match(script, /setInterval\(syncPitCarIconFromState, 1000\)/);
});
