const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");
const app = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");

test("test tab is empty while the pit setup prototype is used by car setup", () => {
  assert.match(html, /app\.js\?v=20260724-car-pit-three-columns/);
  const testPanel = html.match(
    /<section class="screen" data-screen-panel="test"[\s\S]*?<\/section>\s*<section class="screen" data-screen-panel="car-setup-pit"/,
  )?.[0] || "";

  assert.match(testPanel, /class="test-pit"/);
  assert.match(testPanel, /data-test-tire/g);
  assert.match(testPanel, /data-test-service-toggle/);
  assert.match(testPanel, /id="test-pit-now"/);
  assert.doesNotMatch(testPanel, /class="test-racing-data"/);
  assert.equal((testPanel.match(/data-test-status-copy/g) || []).length, 0);
  assert.match(testPanel, /class="test-pit" hidden aria-hidden="true"/);
  assert.doesNotMatch(testPanel, /data-copy-title="Car Status"/);
  assert.match(testPanel, /class="test-pit-side-by-side"/);
  assert.match(
    css,
    /\[data-screen-panel="test"\] \.test-pit-side-by-side\s*\{\s*display:\s*none !important;/,
  );
  assert.match(
    html,
    /data-screen-panel="car-setup-pit"[\s\S]*?data-car-status-target[\s\S]*?class="test-pit-status-copy test-car-status-stage car-setup-pit-status-copy"[\s\S]*?aria-label="Pit setup" hidden[\s\S]*?class="cumulation-stack"/,
  );
  assert.match(
    css,
    /\.car-setup-layout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\) 230px;/,
  );
  assert.match(
    css,
    /\.test-pit-status-copy\.test-car-status-stage \.reference-corner \.tyre-pressure-gauge\s*\{\s*display:\s*none !important;/,
  );
  assert.match(
    css,
    /\.test-pit-status-copy\.test-car-status-stage \.reference-corner \.tyre-wear-rail\s*\{\s*display:\s*none !important;/,
  );
  assert.match(
    css,
    /\.test-pit-status-copy\.test-car-status-stage \.reference-corner \.corner-wear\s*\{[\s\S]*?z-index:\s*14;[\s\S]*?margin-top:\s*-25px;/,
  );
  assert.match(
    css,
    /\.test-pit-status-copy\.test-car-status-stage \.reference-corner \.status-tyre > span\s*\{[\s\S]*?font-size:\s*12px;/,
  );
  assert.match(
    css,
    /\.corner-wear em > span\s*\{[\s\S]*?display:\s*inline !important;/,
  );
  assert.match(
    css,
    /\.test-pit-status-copy\.test-car-status-stage \.front-tyre-card \.corner-wear em\s*\{\s*transform:\s*translateY\(-2px\) !important;/,
  );
  assert.match(app, /label\.textContent = "EST\."/);
  assert.match(app, /value\.textContent = "\+2\.5 S"/);
  assert.match(app, /label\.style\.setProperty\("color", "#54cde1", "important"\)/);
  assert.match(app, /value\.style\.setProperty\("color", "#ffffff", "important"\)/);
  assert.match(app, /copiedCarGrid\.append\(repairButton\)/);
  assert.match(app, /topRepairButton\.classList\.add\("test-repair-top"\)/);
  assert.match(app, /topRepairButton\.classList\.add\("test-windscreen-tearoff"\)/);
  assert.match(app, /querySelector\("b"\)\.textContent = "WINDSHIELD"/);
  assert.match(app, /querySelector\("small"\)\.textContent = "TEAROFF"/);
  assert.match(app, /toggleTestWindscreenTearoff\(topRepairButton\)/);
  assert.match(app, /fetch\("\/api\/pit\/windscreen-tearoff"/);
  assert.match(app, /copiedCarGrid\.append\(topRepairButton\)/);
  assert.match(css, /\.test-pit-status-copy \.reference-car-status > \.test-repair/);
  assert.match(
    css,
    /\.test-pit-status-copy \.reference-car-status > \.test-repair\.test-repair-top\s*\{[\s\S]*?grid-row:\s*1;/,
  );
  assert.match(css, /transform:\s*translateY\(-23px\)/);
  assert.match(html, /class="test-repair"[^>]*hidden/);
  assert.match(app, /testRepairButton\.hidden = !hasAvailableFastRepair/);
  assert.match(app, /\["DRY", "WET"\]\.forEach/);
  assert.match(app, /fetch\("\/api\/pit\/tire-compound"/);
  assert.match(app, /JSON\.stringify\(\{ compound \}\)/);
  assert.match(app, /button\.disabled = isSelected/);
  assert.match(app, /syncTestTireCompoundFromTelemetry\(telemetry\.pit_tire_compound\)/);
  assert.match(
    app,
    /\["lf", "rf", "lr", "rr"\]\.forEach\(\(wheel\) => \{[\s\S]*?testTireChangeStates\.set\(wheel, true\)/,
  );
  assert.match(app, /"M724 91H677V190H630"/);
  assert.match(app, /"M724 536H684V452H645"/);
  assert.match(css, /\.test-pit-status-copy \.test-compound-card/);
  assert.match(css, /\.test-pit-status-copy \.test-right-tire-stack\s*\{[\s\S]*?justify-content:\s*space-between;/);
  assert.match(css, /\.test-pit-status-copy \.test-right-tire-stack\s*\{[\s\S]*?transform:\s*translateX\(-34px\)/);
  assert.match(css, /\.test-pit-status-copy \.test-compound-card\s*\{[\s\S]*?height:\s*56px;/);
  assert.match(
    css,
    /\.test-pit-status-copy \.test-compound-group\s*\{[\s\S]*?gap:\s*10px;[\s\S]*?transform:\s*translateX\(64px\);/,
  );
  assert.match(css, /\.reference-corner-rr \.status-tyre,[\s\S]*?translateY\(-7px\) !important;/);
  assert.match(css, /\.test-right-tire-stack > \.reference-corner > b\s*\{[\s\S]*?right:\s*-28px !important;/);
  assert.match(css, /\.test-right-tire-stack > \.reference-corner-fr\s*\{\s*transform:\s*translateY\(35px\) !important;/);
  assert.match(css, /\.test-right-tire-stack > \.reference-corner-fr > b\s*\{\s*transform:\s*translateY\(9px\) !important;/);
  assert.match(css, /\.test-pit > \.test-pit-car-grid\s*\{\s*display:\s*none;/);
  assert.match(app, /tireCard\.querySelector\("span"\)\.textContent = "TIRE"/);
  assert.match(app, /tireCard\.querySelector\("small"\)\.remove\(\)/);
  assert.match(app, /changeToggle\.textContent = "CHANGE"/);
  assert.match(app, /\{ FR: "RF", RL: "LR" \}/);
  assert.match(app, /dataset\.testStatusTire = wheel/);
  assert.match(app, /fetch\("\/api\/pit\/tire-change"/);
  assert.match(app, /JSON\.stringify\(\{ wheel, enabled \}\)/);
  assert.match(app, /changeToggle\.addEventListener\("click", \(\) => toggleTestTireChange\(wheel\)\)/);
  assert.match(app, /syncTestStatusCopyTelemetry\(\)/);
  assert.doesNotMatch(
    app,
    /MutationObserver\(\(\) => \{[\s\S]*?renderTestStatusCopies\(\);[\s\S]*?\}\)\.observe/,
  );
  assert.match(app, /testTireChangeStates\.set\(wheel, enabled\)/);
  assert.doesNotMatch(app, /testTireChangeStates\.set\(wheel, wasSelected\)/);
  assert.match(app, /syncTestTireChangesFromTelemetry\(pitTireChanges\)/);
  assert.match(
    app,
    /\["lf", "rf", "lr", "rr"\]\.forEach\(\(position\) => \{[\s\S]*?testTireChangeSyncAfter\.set\(position, telemetrySyncDeadline\)/,
  );
  assert.match(app, /function updateTestTireToggleVisual\(wheel\)/);
  assert.match(
    app,
    /testTireChangePending\.add\(wheel\);[\s\S]*?updateTestTireToggleVisual\(wheel\);/,
  );
  assert.match(css, /\.test-pit-status-copy \.test-status-tire-toggle/);
  assert.match(css, /\.test-status-tire-toggle\[aria-pressed="true"\]/);
  assert.match(
    css,
    /\.test-pit-status-copy\.test-car-status-stage \.reference-corner\s*\{[\s\S]*?z-index:\s*11;[\s\S]*?pointer-events:\s*auto;/,
  );
  assert.match(css, /\.test-status-tire-toggle\.has-command-error/);
  assert.match(css, /\.test-pit-status-copy \.corner-wear em b\s*\{[\s\S]*?font-weight:\s*900;/);
});
