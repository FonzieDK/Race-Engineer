const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const launcher = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "start_race_engineer.bat"),
  "utf8",
);

test("Windows launcher uses the Electron CLI for on-demand runtime installation", () => {
  assert.match(launcher, /node_modules\\electron\\cli\.js/);
  assert.match(launcher, /set "ELECTRON_RUN_AS_NODE="/);
  assert.match(launcher, /Start-Process -FilePath \$env:NODE_EXE/);
  assert.match(launcher, /-WindowStyle Hidden/);
  assert.doesNotMatch(launcher, /start "" "%NODE_EXE%"/);
  assert.doesNotMatch(launcher, /node_modules\\electron\\dist\\electron\.exe/);
});
