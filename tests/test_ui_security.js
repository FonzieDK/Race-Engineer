const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

test("UI escaping neutralizes telemetry-provided markup", () => {
  const window = {};
  const source = fs.readFileSync(
    path.join(__dirname, "..", "web", "ui-utils.js"),
    "utf8",
  );
  vm.runInNewContext(source, { window });
  assert.equal(
    window.raceEngineerUi.escapeHtml(`<img src=x onerror="alert('x')">`),
    "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;",
  );
});
