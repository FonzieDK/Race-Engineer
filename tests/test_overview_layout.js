const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const styles = fs.readFileSync(path.join(__dirname, "..", "web", "app.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "..", "web", "app.js"), "utf8");

test("overview session and hero share the same grid row height", () => {
  assert.match(styles, /\[data-screen-panel="overview"\] \.main-grid\s*\{[^}]*grid-template-rows:\s*auto auto/s);
  assert.match(styles, /\[data-screen-panel="overview"\] \.sidebar,\s*\[data-screen-panel="overview"\] \.content\s*\{[^}]*grid-row:\s*1 \/ -1[^}]*grid-template-rows:\s*subgrid/s);
});

test("overview returns to independent rows on narrow screens", () => {
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*?\[data-screen-panel="overview"\] \.sidebar\s*\{[^}]*grid-row:\s*auto/s);
  assert.match(styles, /@media \(max-width: 860px\)[\s\S]*?\[data-screen-panel="overview"\] \.content\s*\{[^}]*grid-row:\s*auto/s);
});

test("car status moves to the left of pit setup while overview keeps its original grid space", () => {
  assert.match(html, /data-screen-panel="overview"[\s\S]*data-car-status-panel[\s\S]*overview-car-status-placeholder[\s\S]*data-screen-panel="leaderboard"/);
  assert.match(script, /carStatusTargetEl\.prepend\(carStatusModuleEl\)/);
  assert.match(script, /carStatusPanelEl\.classList\.add\("is-car-status-relocated"\)/);
  assert.doesNotMatch(html, /data-screen-panel="test"[^>]*[\s\S]*?class="test-car-status-stage" data-car-status-target[\s\S]*?data-screen-panel="car-setup-pit"/);
  assert.match(html, /data-screen-panel="car-setup-pit"[^>]*[\s\S]*class="car-setup-layout"[\s\S]*class="test-car-status-stage" data-car-status-target[\s\S]*aria-label="Pit setup"/);
  assert.match(html, /class="car-status-graphic reference-car-status"[\s\S]*class="reference-car"[\s\S]*src="\/IMG\/car-status-gt-top-view\.png\?v=[^"]+"/);
  assert.match(html, /data-pressure-wheel="lf"[\s\S]*status-tire-lf-pressure/);
  assert.match(html, /data-pressure-wheel="rf"[\s\S]*status-tire-rf-pressure/);
  assert.match(html, /data-pressure-wheel="lr"[\s\S]*status-tire-lr-pressure/);
  assert.match(html, /data-pressure-wheel="rr"[\s\S]*status-tire-rr-pressure/);
  assert.match(html, /data-screen-panel="car-setup-pit"[\s\S]*>Pit Setup<\/p>[\s\S]*>Cumulation<\/p>/);
  assert.match(styles, /\.car-setup-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.25fr\) minmax\(0, 0\.75fr\) minmax\(0, 1fr\)[^}]*align-items:\s*stretch/s);
  assert.match(styles, /\.charts-grid\.is-car-status-relocated \.overview-car-status-placeholder\s*\{[^}]*aspect-ratio:\s*0\.92/s);
  assert.match(styles, /\.test-car-status-stage \.car-status-module\s*\{[^}]*width:\s*min\(100%, 780px\)[^}]*height:\s*100%/s);
});

test("car setup follows the track map viewport sizing rules", () => {
  assert.match(styles, /\[data-screen-panel="car-setup-pit"\]\.is-visible\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.car-setup-layout\s*\{[^}]*height:\s*100%[^}]*min-height:\s*100%[^}]*grid-template-columns:\s*minmax\(0, 1\.25fr\) minmax\(0, 0\.75fr\) minmax\(0, 1fr\)[^}]*grid-template-rows:\s*minmax\(0, 1fr\)[^}]*overflow:\s*hidden/s);
  assert.match(styles, /@media \(max-width: 1100px\)[\s\S]*?\.car-setup-layout\s*\{[^}]*grid-template-columns:\s*1fr[^}]*grid-template-rows:\s*none[^}]*height:\s*100%[^}]*overflow-y:\s*auto/s);
  assert.match(styles, /@media \(min-width: 1100px\) and \(max-height: 1100px\)[\s\S]*?\.car-setup-layout \.pit-car-plan\s*\{[^}]*max-width:\s*clamp\(136px, 16dvh, 168px\)/s);
});

test("pit setup draft covers timing, tyres and optional service", () => {
  const pitSetupMarkup = html.slice(
    html.indexOf('aria-label="Pit setup"'),
    html.indexOf('<div class="cumulation-stack">'),
  );
  assert.match(html, /class="[^"]*pit-setup-preview[^"]*"[\s\S]*Next stop[\s\S]*Pit window[\s\S]*Est\. stop/);
  assert.doesNotMatch(pitSetupMarkup, /id="pit-fuel-add"|class="pit-fuel-visual"|Fuel at pit entry|Estimated range/);
  assert.doesNotMatch(html, /pit-tire-change-all|CHANGE ALL TIRES/);
  assert.match(html, /id="pit-crew-takeover" type="checkbox" hidden[\s\S]*id="pit-windscreen-tearoff" type="checkbox" checked hidden/);
  assert.doesNotMatch(html, /Driver change|Optional work during the stop|aria-label="Optional pit service"/);
  assert.doesNotMatch(html, /<strong>Fast repair<\/strong>|<strong>Windscreen tear-off<\/strong>/);
  assert.match(styles, /\.pit-plan-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(html, /class="pit-setup-section pit-tire-service-section"\s*>\s*<div class="pit-setup-heading">[\s\S]*?<span>Services<\/span>/);
  assert.match(html, /class="pit-summary-panel"[\s\S]*Pit Summary[\s\S]*Total time[\s\S]*Fuel added[\s\S]*Tires[\s\S]*Repairs[\s\S]*Penalties/);
  assert.match(styles, /\.pit-tire-service-section\s*\{[^}]*border:\s*0[^}]*border-radius:\s*0[^}]*background:\s*transparent/s);
  assert.match(styles, /\.pit-summary-panel\s*\{[^}]*align-self:\s*end/s);
});

test("fuel calculation keeps pit state inputs without the optional service card or footer", () => {
  const pitSetupMarkup = html.slice(
    html.indexOf('aria-label="Pit setup"'),
    html.indexOf('<div class="cumulation-stack">'),
  );
  assert.match(html, /aria-label="Fuel calculation"[\s\S]*?>FUEL CAL<\/p>[\s\S]*?class="car-setup-window-content fuel-cal-window-content"[\s\S]*?id="pit-crew-takeover"[\s\S]*?id="pit-windscreen-tearoff"/);
  assert.doesNotMatch(html, /fuel-cal-pit-loss|fuel-cal-use-recommendation|id="pit-apply-setup"/);
  assert.doesNotMatch(html, /pit-service-section|pit-service-option/);
  assert.doesNotMatch(pitSetupMarkup, /pit-service-section|pit-plan-footer/);
  assert.match(styles, /\.fuel-cal-window-content\s*\{[^}]*grid-template-rows:\s*auto auto auto[^}]*align-content:\s*start[^}]*gap:\s*0[^}]*padding:/s);
  assert.match(styles, /\.fuel-cal-window-content\s*\{[^}]*overflow-y:\s*hidden/s);
});

test("fuel calculation exposes live range, confidence, scenarios and recommendation controls", () => {
  assert.match(html, /id="fuel-cal-status"[\s\S]*id="fuel-cal-confidence"[\s\S]*id="fuel-cal-range"/);
  assert.match(html, /data-fuel-mode="attack"[\s\S]*data-fuel-mode="balanced"[\s\S]*data-fuel-mode="save"/);
  assert.match(html, /id="fuel-cal-reserve"[\s\S]*id="fuel-cal-required"[\s\S]*id="fuel-cal-recommended"/);
  assert.match(script, /function renderFuelCalculator\(telemetry\)[\s\S]*average_5_laps[\s\S]*recommendedAdd/);
  assert.match(styles, /\.fuel-cal-scenarios\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(styles, /\.fuel-cal-result\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(styles, /\.fuel-cal-card \+ \.fuel-cal-card\s*\{[^}]*border-left:\s*1px solid/s);
  assert.match(styles, /\.fuel-cal-scenarios button\s*\{[^}]*border-radius:\s*0[^}]*background:\s*transparent/s);
});

test("track map fuel status mirrors the fuel calculator key figures", () => {
  assert.match(html, /class="map-aux-card map-fuel-status-card"[\s\S]*id="map-fuel-current"[\s\S]*id="map-fuel-laps-remaining"/);
  assert.match(html, /id="map-fuel-at-finish"[\s\S]*id="map-fuel-last"[\s\S]*id="map-fuel-maximum"/);
  assert.match(html, /id="map-fuel-needed"[\s\S]*id="map-fuel-add"[\s\S]*id="map-fuel-refuel-time"/);
  assert.match(script, /function renderFuelStrategy\(telemetry\)[\s\S]*fuelCalMode[\s\S]*map-fuel-confidence[\s\S]*map-fuel-state/);
  assert.match(styles, /\.map-fuel-status-card \.weather-row\s*\{[^}]*min-height:\s*25px/s);
  assert.match(styles, /\.map-fuel-level-rail i\s*\{[^}]*linear-gradient/s);
});

test("tire change controls are accessible wheel-specific toggles", () => {
  assert.match(html, /<span>Services<\/span>[\s\S]*?id="pit-tire-change-estimate"/);
  assert.match(html, /id="pit-tire-change-estimate">EST: 0\.0 s<\/strong>/);
  assert.match(html, /class="pit-tire-toggle-row pit-target-fl"[\s\S]*?class="pit-tire-wheel-label"[^>]*>FL<\/span>[\s\S]*?<button[\s\S]*?id="pit-tire-change-fl"[\s\S]*?data-wheel="lf"[\s\S]*?aria-pressed="false"[\s\S]*?>\s*<span>TIRE CHANGE<\/span><\/button>/);
  assert.match(html, /class="pit-tire-toggle-row pit-tire-toggle-row-right pit-target-fr"[\s\S]*?<button[\s\S]*?id="pit-tire-change-fr"[\s\S]*?data-wheel="rf"[\s\S]*?aria-pressed="false"[\s\S]*?>\s*<span>TIRE CHANGE<\/span><\/button>[\s\S]*?class="pit-tire-wheel-label"[^>]*>FR<\/span>/);
  assert.match(html, /class="pit-tire-toggle-row pit-target-rl"[\s\S]*?class="pit-tire-wheel-label"[^>]*>RL<\/span>[\s\S]*?<button[\s\S]*?id="pit-tire-change-rl"[\s\S]*?data-wheel="lr"[\s\S]*?aria-pressed="false"[\s\S]*?>\s*<span>TIRE CHANGE<\/span><\/button>/);
  assert.match(html, /class="pit-tire-toggle-row pit-tire-toggle-row-right pit-target-rr"[\s\S]*?<button[\s\S]*?id="pit-tire-change-rr"[\s\S]*?data-wheel="rr"[\s\S]*?aria-pressed="false"[\s\S]*?>\s*<span>TIRE CHANGE<\/span><\/button>[\s\S]*?class="pit-tire-wheel-label"[^>]*>RR<\/span>/);
  assert.match(script, /pitTireChangeButtons\.forEach[\s\S]*?fetch\("\/api\/pit\/tire-change"[\s\S]*?JSON\.stringify\(\{ wheel, enabled \}\)/);
  assert.match(script, /pitAllTiresToggleEl[\s\S]*?JSON\.stringify\(\{ wheel: "all", enabled \}\)/);
  assert.match(script, /function updatePitTireChangeEstimate\(\)[\s\S]*?pitTireChangeEstimates\[selectedTireCount\][\s\S]*?`EST: \$\{estimatedSeconds\.toFixed\(1\)\} s`/);
  assert.match(script, /telemetry\.tire_change_estimates[\s\S]*?tire_change_estimate_source === "learned"/);
  assert.match(script, /button\.setAttribute\("aria-pressed", String\(enabled\)\)/);
  assert.match(script, /const pitTireChanges = telemetry\.pit_tire_changes \|\| \{\}[\s\S]*?!button\.classList\.contains\("is-command-pending"\)[\s\S]*?button\.setAttribute\("aria-pressed", String\(selected\)\)[\s\S]*?classList\.remove\("has-command-error"\)/);
  assert.match(styles, /\.pit-tire-toggle-row\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\)/s);
  assert.match(styles, /\.pit-tire-toggle-row-right\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.pit-tire-toggle\[aria-pressed="true"\]\s*\{/);
  assert.doesNotMatch(styles, /\.pit-all-tires-toggle/);
});

test("windscreen tear-off matches the original tire-change button size", () => {
  assert.match(html, /class="pit-car-service-row"[\s\S]*?id="pit-car-windscreen-tearoff"[\s\S]*?>\s*<span>WINDSHIEL TEAROFF<\/span><\/button>[\s\S]*?class="pit-car-center"[\s\S]*?class="pit-car-plan"/);
  assert.match(html, /id="pit-windscreen-tearoff" type="checkbox" checked/);
  assert.match(styles, /\.pit-car-center\s*\{[^}]*grid-column:\s*2[^}]*grid-row:\s*2 \/ 4[^}]*gap:\s*8px/s);
  assert.match(styles, /\.pit-tire-toggle\s*\{[^}]*width:\s*148px[^}]*max-width:\s*100%/s);
  assert.match(styles, /\.pit-car-tearoff-toggle\s*\{[^}]*width:\s*148px[^}]*max-width:\s*100%[^}]*height:\s*78px[^}]*border-radius:\s*20px/s);
  assert.match(script, /pitCarTearoffToggleEl\?\.addEventListener\("click"[\s\S]*?setPitWindscreenTearoff\(enabled\)/);
  assert.match(script, /fetch\("\/api\/pit\/windscreen-tearoff"[\s\S]*?JSON\.stringify\(\{ enabled \}\)/);
  assert.match(script, /telemetry\.pit_windscreen_tearoff[\s\S]*?pitWindscreenTearoffEl\.checked = telemetry\.pit_windscreen_tearoff/);
});

test("wheel controls retain their offset while the car has equal button spacing", () => {
  assert.match(styles, /\.pit-pressure-grid\s*\{[^}]*transform:\s*translateY\(10px\)/s);
  assert.match(styles, /\.pit-tire-toggle-row\s*\{[^}]*transform:\s*translateY\(10px\)/s);
  assert.match(styles, /\.pit-car-plan\s*\{[^}]*transform:\s*scale\(1\.08\)[^}]*transform-origin:\s*top center/s);
  assert.match(styles, /\.pit-car-center\s*\{[^}]*gap:\s*8px/s);
  assert.doesNotMatch(styles, /\.pit-car-tearoff-toggle\s*\{[^}]*translateY/s);
});

test("car expands to leave 10px to the wheel controls", () => {
  assert.match(styles, /\.pit-pressure-grid\s*\{[^}]*gap:\s*10px 14px/s);
  assert.match(styles, /\.pit-car-plan\s*\{[^}]*width:\s*calc\(100% \+ 8px\)/s);
  assert.match(styles, /\.pit-car-plan\s*\{[^}]*aspect-ratio:\s*10 \/ 21/s);
  assert.match(styles, /\.pit-pressure-grid\s*\{[^}]*grid-template-rows:\s*auto repeat\(2, minmax\(128px, auto\)\)/s);
  assert.doesNotMatch(html, /preserveAspectRatio="none"/);
});

test("weather rain status and crew takeover share a row while tires returns to car setup", () => {
  assert.match(html, /class="weather-service-icon-row"[\s\S]*?class="weather-rain-status-icon"[\s\S]*?id="weather-cloud-3d"/);
  assert.match(html, /class="weather-rain-status-icon"[^>]*>[\s\S]*?<span>Weather<\/span>/);
  assert.doesNotMatch(html, /<strong>85%<\/strong>/);
  assert.match(styles, /\.weather-rain-status-icon\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(styles, /\.weather-rain-status-icon\s*\{[^}]*gap:\s*7px/s);
  assert.match(styles, /\.weather-rain-status-icon > span\s*\{[^}]*font-size:\s*0\.62rem/s);
  assert.match(styles, /@keyframes weather-cloud-float-3d/);
  assert.match(styles, /@keyframes weather-rain-drop-3d/);
  assert.match(html, /class="weather-service-icon-row"[\s\S]*?id="pit-crew-takeover-toggle-adjacent"[\s\S]*?<span>Track<\/span>/);
  assert.match(html, /class="pit-car-service-row"[\s\S]*?id="pit-fast-repair-control"[\s\S]*?data-pit-all-tires-toggle[\s\S]*?<span>Tires<\/span>/);
  assert.match(styles, /\.pit-car-service-row\s*\{[^}]*display:\s*grid[^}]*grid-column:\s*1 \/ -1[^}]*grid-row:\s*1[^}]*width:\s*100%[^}]*grid-template-columns:\s*minmax\(66px, 1fr\) minmax\(76px, 1\.15fr\) minmax\(66px, 1fr\)/s);
  assert.match(html, /id="track-wetness"[\s\S]*?class="weather-service-icon-row"[\s\S]*?class="weather-rain-status-icon"[\s\S]*?id="pit-crew-takeover-toggle-adjacent"/);
  assert.match(styles, /\.weather-service-icon-row\s*\{[^}]*flex:\s*1[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*justify-content:\s*space-evenly[^}]*gap:\s*0/s);
  assert.match(styles, /\.pit-car-service-row \.pit-car-tearoff-toggle\s*\{[^}]*grid-column:\s*2[^}]*justify-self:\s*center/s);
  assert.match(html, /class="pit-car-plan"[\s\S]*?class="pit-fast-repair-control pit-fast-repair-control-bottom"[\s\S]*?id="pit-fast-repair-toggle-bottom"[\s\S]*?<span>Repair<\/span>/);
  assert.equal((html.match(/data-pit-crew-takeover-toggle/g) || []).length, 1);
  assert.equal((html.match(/data-pit-fast-repair-toggle/g) || []).length, 1);
  assert.equal((html.match(/data-pit-all-tires-toggle/g) || []).length, 1);
  assert.match(html, /id="pit-crew-takeover" type="checkbox"/);
  assert.match(html, /id="pit-fast-repair" type="checkbox"/);
  assert.doesNotMatch(html, /pit-fast-repairs-remaining|pit-fast-repair-remaining-label|>Remaining<\/span>/);
  assert.match(styles, /\.pit-fast-repair-control\s*\{[^}]*margin-top:\s*0/s);
  assert.match(styles, /\.pit-fast-repair-toggle\s*\{[^}]*width:\s*70px[^}]*min-height:\s*58px[^}]*border:\s*2px solid var\(--cyan\)[^}]*background:\s*linear-gradient\(160deg, #18242d, #101820\)[^}]*color:\s*var\(--cyan\)/s);
  assert.match(styles, /\.pit-fast-repair-toggle\[aria-pressed="true"\]\s*\{[^}]*border-color:\s*var\(--accent\)[^}]*background:\s*linear-gradient\(160deg, rgba\(150, 255, 67, 0\.2\), rgba\(150, 255, 67, 0\.07\)\)/s);
  assert.doesNotMatch(styles, /\[data-pit-crew-takeover-toggle\]\s*\{[^}]*width:/s);
  assert.match(script, /const pitCrewTakeoverToggleEls = Array\.from\(document\.querySelectorAll\("\[data-pit-crew-takeover-toggle\]"\)\)[\s\S]*?function syncPitCrewTakeover\(\)[\s\S]*?button\.disabled = !hasControl[\s\S]*?fetch\("\/api\/iracing\/take-seat"[\s\S]*?pitCrewTakeoverEl\.checked = takingControl/);
  assert.match(html, /class="track-circuit-icon"[\s\S]*?id="track-circuit-route"[\s\S]*?animateMotion/);
  assert.match(styles, /#pit-crew-takeover-toggle-adjacent[\s\S]*?background:\s*transparent[\s\S]*?@keyframes track-circuit-float-3d/);
  assert.match(script, /fetch\("\/api\/iracing\/take-seat"[\s\S]*?fetch\("\/api\/iracing\/leave-seat"/);
  assert.match(script, /pitFastRepairToggleEls\.forEach[\s\S]*?pitFastRepairEl\.checked = !pitFastRepairEl\.checked[\s\S]*?telemetry\.fast_repairs_limit/);
  assert.match(styles, /\.pit-fast-repair-toggle:disabled,\s*\.pit-fast-repair-toggle:disabled:hover\s*\{[^}]*border-color:\s*#46515a[^}]*cursor:\s*not-allowed[^}]*filter:\s*grayscale\(0\.8\)[^}]*opacity:\s*0\.58/s);
  assert.match(script, /pitAllTiresToggleEl\?\.addEventListener\("click", async \(\) => \{[\s\S]*?\/api\/pit\/tire-change[\s\S]*?wheel: "all"[\s\S]*?String\(enabled\)/);
});

test("cumulation header shows connected headset status", () => {
  assert.match(html, />Cumulation<\/p>[\s\S]*class="pit-headset-status"[\s\S]*Pit radio connected[\s\S]*<svg/);
  assert.doesNotMatch(html, /class="pit-headset-status"[\s\S]*?<b>/);
  assert.match(html, /class="module car-setup-window cumulation-window"[\s\S]*class="car-setup-window-content cumulation-grid"[\s\S]*class="cumulation-panel"[\s\S]*class="cumulation-panel"/);
  assert.equal((html.match(/class="module car-setup-window cumulation-window"/g) || []).length, 2);
  assert.match(html, /aria-label="Cumulation"[\s\S]*>Cumulation<\/p>[\s\S]*aria-label="Fuel calculation"[\s\S]*>FUEL CAL<\/p>/);
  assert.doesNotMatch(html, /aria-label="Fuel calculation"[\s\S]*?>FUEL CAL<\/p>[\s\S]*?class="pit-headset-status"/);
  assert.match(styles, /\.cumulation-stack\s*\{[^}]*width:\s*100%[^}]*height:\s*100%[^}]*grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\)[^}]*gap:\s*12px[^}]*align-self:\s*stretch/s);
  assert.match(styles, /\.cumulation-window\s*\{[^}]*height:\s*100%[^}]*align-self:\s*stretch/s);
  assert.match(styles, /\.cumulation-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[^}]*height:\s*100%/s);
  assert.doesNotMatch(styles, /\.cumulation-panel \+ \.cumulation-panel\s*\{[^}]*border-left:/s);
  assert.match(styles, /\.pit-headset-status\s*\{[^}]*position:\s*relative[^}]*display:\s*inline-flex/s);
  assert.match(styles, /\.pit-headset-status i\s*\{[^}]*background:\s*#ffe46a[^}]*box-shadow:/s);
});

test("session fills the shared header row and includes ingame time", () => {
  assert.match(styles, /\[data-screen-panel="overview"\] \.session-module\s*\{[^}]*height:\s*100%[^}]*align-self:\s*stretch/s);
  assert.match(styles, /\.session-module \.info-rows\s*\{[^}]*grid-template-rows:\s*repeat\(4,/s);
  assert.match(html, /<span>Ingame time<\/span><strong id="ingame-time">--<\/strong>/);
  assert.match(
    html,
    /<span>Track<\/span><strong id="session-track-name">--<\/strong>[\s\S]*<span>Ingame time<\/span><strong id="ingame-time">--<\/strong>[\s\S]*<span>Time remain<\/span><strong id="session-time">--<\/strong>[\s\S]*<span>Laps<\/span><strong id="laps-remaining">--<\/strong>/,
  );
  assert.match(script, /setText\(ingameTimeEl, formatIngameTime\(telemetry\.session_time_of_day\)\)/);
});

test("session rows have aligned columns without inner boxes", () => {
  assert.match(styles, /\.session-module \.info-rows\s*\{[^}]*gap:\s*0/s);
  assert.match(styles, /\.session-module \.info-row\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto[^}]*border:\s*0[^}]*border-bottom:\s*1px solid var\(--line\)[^}]*border-radius:\s*0[^}]*background:\s*transparent/s);
  assert.match(styles, /\.session-module \.info-row:last-child\s*\{[^}]*border-bottom:\s*0/s);
});
