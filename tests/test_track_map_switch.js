const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");

test("map switch button cycles all three map views through the large stage", () => {
  assert.match(html, /id="switch-track-map"/);
  assert.match(script, /function arrangeTrackMaps\(\)/);
  assert.match(script, /\{ main: maps\.track, primary: maps\.pit, secondary: maps\.follow \}/);
  assert.match(script, /\{ main: maps\.pit, primary: maps\.track, secondary: maps\.follow \}/);
  assert.match(script, /\{ main: maps\.follow, primary: maps\.pit, secondary: maps\.track \}/);
  assert.match(script, /largeTrackMapIndex = \(largeTrackMapIndex \+ 1\) % 3/);
});

test("compact map labels follow the map arrangement", () => {
  assert.match(script, /document\.querySelector\("\.pit-exit-head span"\)/);
  assert.match(html, /id="secondary-map-title"/);
  assert.match(script, /setText\(primaryMapTitleEl, TRACK_MAP_LABELS\[layout\.primary\.id\]\)/);
  assert.doesNotMatch(html, /pit-exit-traffic-row/);
  assert.doesNotMatch(styles, /\.pit-exit-traffic-row/);
});
