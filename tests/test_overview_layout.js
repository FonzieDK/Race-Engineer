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

test("car status keeps its compact width while scaling to the alerts row height", () => {
  assert.match(styles, /\[data-screen-panel="overview"\] \.charts-grid\s*\{[^}]*width:\s*100%[^}]*height:\s*100%[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(styles, /\[data-screen-panel="overview"\] \.car-status-module\s*\{[^}]*grid-column:\s*1 \/ -1[^}]*width:\s*min\(100%, 650px\)[^}]*height:\s*100%[^}]*aspect-ratio:\s*auto[^}]*justify-self:\s*start/s);
});

test("session fills the shared header row and includes ingame time", () => {
  assert.match(styles, /\[data-screen-panel="overview"\] \.session-module\s*\{[^}]*height:\s*100%[^}]*align-self:\s*stretch/s);
  assert.match(styles, /\.session-module \.info-rows\s*\{[^}]*grid-template-rows:\s*repeat\(4,/s);
  assert.match(html, /<span>Ingame time<\/span><strong id="ingame-time">--<\/strong>/);
  assert.match(script, /setText\(ingameTimeEl, formatIngameTime\(telemetry\.session_time_of_day\)\)/);
});

test("session rows have aligned columns without inner boxes", () => {
  assert.match(styles, /\.session-module \.info-rows\s*\{[^}]*gap:\s*0/s);
  assert.match(styles, /\.session-module \.info-row\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto[^}]*border:\s*0[^}]*border-bottom:\s*1px solid var\(--line\)[^}]*border-radius:\s*0[^}]*background:\s*transparent/s);
  assert.match(styles, /\.session-module \.info-row:last-child\s*\{[^}]*border-bottom:\s*0/s);
});
