const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "web", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const server = fs.readFileSync(path.join(root, "race_engineer", "server.py"), "utf8");

test("event panel has no manual import control", () => {
  assert.doesNotMatch(html, /id="event-import-results"/);
  assert.doesNotMatch(html, /id="event-import-files"/);
  assert.doesNotMatch(script, /fetch\("\/api\/events\/import"/);
  assert.match(server, /request_path == "\/api\/events\/import"/);
  assert.doesNotMatch(html, /event-scan-race/);
  assert.doesNotMatch(server, /\/api\/events\/scan/);
});
