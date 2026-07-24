const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const styles = fs.readFileSync(path.join(__dirname, "..", "web", "app.css"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "web", "index.html"), "utf8");

test("track map uses one leaderboard-style bordered panel", () => {
  assert.match(
    styles,
    /\[data-screen-panel="map"\] \.full-screen-module\s*\{[^}]*gap:\s*0[^}]*border:\s*1px solid #314758[^}]*border-radius:\s*7px[^}]*background:\s*#020303/s,
  );
  assert.match(
    styles,
    /\.trackmap-stage,\s*\.map-weather-card,\s*\.map-aux-card\s*\{[^}]*border:\s*0[^}]*border-radius:\s*0[^}]*background:\s*#020303[^}]*box-shadow:\s*none/s,
  );
});

test("track map content uses flat leaderboard table spacing and dividers", () => {
  assert.match(
    styles,
    /\.trackmap-wrap\s*\{[^}]*gap:\s*0[^}]*background:\s*transparent/s,
  );
  assert.match(
    styles,
    /\.map-side-stack\s*\{[^}]*gap:\s*0[^}]*border:\s*0/s,
  );
});

test("track map toolbar matches the leaderboard class-filter style", () => {
  assert.match(
    html,
    /class="module-head map-toolbar"[\s\S]*?<span class="map-toolbar-label">Class<\/span>[\s\S]*?id="map-class-filters"/,
  );
  assert.match(
    html,
    /class="module-head map-toolbar"[\s\S]*?id="map-class-filters"[\s\S]*?class="map-focus-banner trackmap-focus-banner"[\s\S]*?id="map-watching"[\s\S]*?<\/div>\s*<div class="trackmap-wrap"/,
  );
  assert.doesNotMatch(html, /id="map-live-count"/);
  assert.match(
    styles,
    /\.trackmap-focus-banner\s*\{[^}]*justify-content:\s*flex-end[^}]*margin-left:\s*auto/s,
  );
  assert.doesNotMatch(
    styles,
    /\.trackmap-focus-banner\s*\{[^}]*(?:border|background|padding):/s,
  );
  assert.match(
    styles,
    /\.map-toolbar\s*\{[^}]*border:\s*0[^}]*border-bottom:\s*1px solid #314758[^}]*border-radius:\s*0[^}]*background:\s*#020303/s,
  );
});
