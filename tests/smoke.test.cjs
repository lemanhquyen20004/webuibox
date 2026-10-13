const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
test('versions match', () => {
  assert.equal(JSON.parse(read('package.json')).version, JSON.parse(read('update.json')).version);
});
test('JavaScript parses', () => { new vm.Script(read('app.js')); });
test('referenced HTML ids exist', () => {
  const js=read('app.js'), page=read('index.html');
  for (const m of js.matchAll(/\$\("#([\w-]+)"\)/g)) {
    assert.ok(page.includes('id="' + m[1] + '"'), m[1]);
  }
});
test('bridge does not source settings.ini', () => {
  const sh=read('bridge/box-status.sh');
  assert.match(sh, /bin_name/);
  assert.doesNotMatch(sh, /\.\s+["']?\$SETTINGS/);
});
test('updater prompts and checks SHA-256', () => {
  const sh=read('scripts/update.sh');
  assert.match(sh, /sha256sum/); assert.match(sh, /Continue\?/);
});
