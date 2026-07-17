const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");

test("GTP battery gauge displays ERS state of charge", () => {
  assert.match(html, /id="status-battery-panel"[\s\S]*?<span>SoC<\/span>/);
  assert.match(script, /normalizeTelemetryPercent\(telemetry\.battery_soc\)/);
  assert.match(script, /statusBatteryEl, batterySoc != null \? `\$\{Math\.round\(batterySoc\)\}%`/);
  assert.match(script, /statusBatteryPanelEl\.hidden = telemetry\.player_is_gtp !== true/);
  assert.match(script, /setStatusBar\(statusBatteryBarEl, batterySoc, 0, 100, "height"\)/);
});
