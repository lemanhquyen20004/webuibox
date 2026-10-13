const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const cp=require('node:child_process');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('published package and UI versions match',()=>{
  const pkg=JSON.parse(read('package.json')),manifest=JSON.parse(read('update.json'));
  assert.equal(pkg.version,'0.0.2');
  assert.equal(pkg.version,manifest.version);
  assert.match(read('app.js'),/const VERSION = "0.0.2"/);
  assert.match(read('index.html'),/WebUiBox • v0.0.2/);
});
test('all referenced DOM ids exist and are unique',()=>{
  const app=read('app.js'),html=read('index.html');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate IDs');
  for(const m of app.matchAll(/\$\("#([\w-]+)"\)/g))assert.ok(ids.includes(m[1]),'missing id '+m[1]);
});
test('JavaScript parses and icons exist',()=>{
  new vm.Script(read('app.js'));
  const html=read('index.html');
  for(const m of html.matchAll(/href="#wb-([\w-]+)"/g))assert.ok(html.includes('id="wb-'+m[1]+'"'));
});
test('real system metrics are from proc and no fake values in live status',()=>{
  const b=read('bridge/box-status.sh');
  for(const x of ['/proc/stat','/proc/meminfo','/proc/uptime','settings.ini','cpu_percent','ram_total_bytes'])assert.ok(b.includes(x),x);
  assert.ok(!b.includes('source "$SETTINGS"'));
});
test('scripts validate as POSIX shell syntax',()=>{
  for(const f of ['bridge/box-status.sh','scripts/install.sh','scripts/update.sh'])cp.execFileSync('sh',['-n',path.join(__dirname,'..',f)]);
});
test('install location is within Mihomo allowed directory',()=>{
  const install=read('scripts/install.sh'),bridge=read('bridge/box-status.sh');
  assert.match(install,/clash\/webuibox/);
  assert.match(bridge,/clash\/webuibox/);
  assert.match(read('scripts/update.sh'),/sha256sum/);
});
