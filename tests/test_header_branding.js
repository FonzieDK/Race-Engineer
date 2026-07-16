const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "app.css"), "utf8");

test("header removes the test screen and tab", () => {
  assert.doesNotMatch(html, /data-screen="test"/i);
  assert.doesNotMatch(html, /data-screen-panel="test"/i);
});

test("Race-Engineer branding sits at the far left with the Fonzie byline", () => {
  assert.match(html, /class="eyebrow brand-title">Race-Engineer<\/p>\s*<p class="brand-byline">By Fonzie<\/p>/);
  assert.match(styles, /grid-template-areas:\s*"brand tabs meta"/);
  assert.match(styles, /\.brand-block\s*\{[^}]*justify-self:\s*start[^}]*text-align:\s*left/s);
  assert.match(styles, /\.brand-title\s*\{[^}]*font-size:\s*1\.05rem/s);
  assert.match(styles, /\.brand-byline\s*\{[^}]*font-size:\s*0\.65rem[^}]*font-weight:\s*800/s);
  assert.match(styles, /\.screen-tabs\s*\{[^}]*justify-self:\s*start[^}]*margin-left:\s*clamp\(20px, 3vw, 48px\)/s);
});
