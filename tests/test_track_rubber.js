const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");
const telemetry = fs.readFileSync(path.join(root, "race_engineer", "telemetry.py"), "utf8");

test("variables card displays iRacing track rubber instead of track grip", () => {
  assert.match(
    html,
    /<span>Track rubber<\/span><strong id="fuel-variable-track-rubber"/,
  );
  assert.doesNotMatch(html, /Track grip/i);
  assert.match(script, /telemetry\?\.weather\?\.track_rubber \|\| "--"/);
  assert.match(telemetry, /track_rubber = weekend_options\.get\("TrackSurface"\)/);
  assert.match(telemetry, /"track_rubber": track_rubber/);
});

test("settings refresh rate control matches the unit select size", () => {
  assert.match(
    styles,
    /\.unit-preference-row \.refresh-rate-control-settings\s*\{[^}]*width:\s*100%;[^}]*height:\s*40px;[^}]*min-height:\s*40px;/s,
  );
  assert.match(
    styles,
    /\.unit-preference-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+180px;/s,
  );
  assert.match(
    styles,
    /\.refresh-rate-control-settings \.refresh-rate-toggle\s*,\s*\.unit-dropdown-toggle\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*stretch;[^}]*text-align:\s*left;/s,
  );
  assert.match(
    styles,
    /\.refresh-rate-control-settings \.refresh-rate-current\s*,\s*\.unit-dropdown-current\s*\{[^}]*flex:\s*1 1 auto;[^}]*width:\s*100%;[^}]*justify-content:\s*space-between;/s,
  );
  assert.match(
    styles,
    /\.refresh-rate-control-settings \.refresh-rate-current svg\s*,\s*\.unit-dropdown-current svg\s*\{[^}]*margin-left:\s*auto;/s,
  );
});

test("all unit selectors use the same custom dropdown pattern as refresh rate", () => {
  assert.equal((html.match(/class="unit-dropdown" data-unit-dropdown=/g) || []).length, 4);
  assert.equal((html.match(/class="unit-dropdown-toggle"/g) || []).length, 4);
  assert.match(styles, /\.refresh-rate-menu\s*,\s*\.unit-dropdown-menu\s*\{/);
  assert.match(styles, /\.refresh-rate-option\s*,\s*\.unit-dropdown-option\s*\{/);
  assert.match(script, /function setUnitDropdownOpen\(control, isOpen\)/);
  assert.match(script, /select\.dispatchEvent\(new window\.Event\("change", \{ bubbles: true \}\)\)/);
});
