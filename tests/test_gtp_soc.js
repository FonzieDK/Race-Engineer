const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const telemetry = fs.readFileSync(path.join(root, "race_engineer", "telemetry.py"), "utf8");

test("GTP telemetry exposes ERS state of charge and battery voltage", () => {
  assert.match(telemetry, /"battery_voltage": None/);
  assert.match(telemetry, /"battery_soc": None/);
  assert.match(telemetry, /data\["battery_voltage"\] = self\._get_var\("Voltage"\)/);
  assert.match(telemetry, /data\["battery_soc"\] = self\._get_var\("EnergyERSBatteryPct"\)/);
});
