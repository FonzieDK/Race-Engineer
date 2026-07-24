const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");

test("pit exit card contains the mini map without the position footer", () => {
  assert.match(html, /id="pit-exit-map"/);
  assert.doesNotMatch(html, /DU KOMMER UD SOM NR\./);
  assert.doesNotMatch(html, /id="pit-exit-position"/);
  assert.doesNotMatch(html, /id="pit-exit-estimate"/);
  assert.doesNotMatch(script, /GHOST ·/);
  assert.match(html, /<span>PIT EXIT PREDICTION -<\/span>/);
  assert.match(script, /Pit Exit Prediction -.*P\$\{position\}/);
  assert.doesNotMatch(html, /<div class="pit-exit-head">\s*<div>\s*<span>STRATEGY<\/span>/);
  assert.doesNotMatch(html, /class="pit-exit-live"/);
});

test("pit exit mini map reuses live track layers and car positions", () => {
  assert.match(script, /function syncPitExitMapLayers\(/);
  assert.match(script, /function renderPitExitMap\(/);
  assert.match(script, /renderPitExitMap\(pitExitPrediction, geometry, standingsByCarIdx\)/);
  assert.match(script, /prediction\?\.cars/);
  assert.match(script, /pit-exit-/);
  assert.match(script, /car\.pit_exit \? ""/);
  assert.match(script, /car\.focused \? "focused"/);
  assert.match(script, /car\.focused \? 16 : 10/);
  assert.match(script, /const orderedCars = projectedCars\.toSorted/);
  assert.doesNotMatch(script, /return group;\s*}\)\.sort\(/);
  assert.match(styles, /pit-exit-map-car\.focused \.pit-exit-map-marker/);
  assert.doesNotMatch(html, /id="pit-exit-traffic"/);
  assert.doesNotMatch(html, /Trafik ved pit-exit/);
  assert.doesNotMatch(styles, /#pit-exit-map\s*\{[^}]*transform:\s*scale/s);
});

test("official track map is fitted to its rendered content", () => {
  assert.match(script, /function fitTrackMapToContent\(/);
  assert.match(script, /fitTrackMapToContent\(document\.getElementById\("track-map"\)\)/);
  assert.match(script, /const trackPath = svg\?\.querySelector\?\.\("#track-path"\)/);
  assert.match(script, /svg\.setAttribute\(\s*"viewBox"/);
});
