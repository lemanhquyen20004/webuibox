const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const cp=require('node:child_process');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('published package and UI versions match',()=>{
  const pkg=JSON.parse(read('package.json')),manifest=JSON.parse(read('update.json'));
  assert.equal(pkg.version,'0.0.5');
  assert.equal(pkg.version,manifest.version);
  assert.match(read('app.js'),/const VERSION = "0.0.5"/);
  assert.match(read('index.html'),/WebUiBox • v0.0.5/);
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
  for(const f of ['bridge/box-status.sh','scripts/install.sh','scripts/update.sh','scripts/enable-hotspot.sh','scripts/disable-hotspot.sh'])cp.execFileSync('sh',['-n',path.join(__dirname,'..',f)]);
});
test('hotspot uses authenticated localhost API and private key outside web root',()=>{
  const go=read('hotspot/main.go');
  assert.match(go,/127\.0\.0\.1:9097/);
  assert.match(go,/webuibox-private\/hotspot/);
  assert.match(go,/X-WebUiBox-Key/);
  assert.match(go,/allow-android11-binder/);
  assert.match(go,/iptables/);
  assert.match(read('index.html'),/id="page-hotspot"/);
  new vm.Script(read('hotspot.js'));
  new vm.Script(read('updater-ui.js'));
  assert.match(read('hotspot/updater.go'),/releaseBase/);
  assert.match(read('hotspot/updater.go'),/sha256.Sum256/);
  assert.match(read('hotspot/updater.go'),/os.Rename/);
  assert.match(read('index.html'),/oneclick-install/);
});
test('install location is within Mihomo allowed directory',()=>{
  const install=read('scripts/install.sh'),bridge=read('bridge/box-status.sh');
  assert.match(install,/clash\/webuibox/);
  assert.match(bridge,/clash\/webuibox/);
  assert.match(read('scripts/update.sh'),/sha256sum/);
});

test('box-status.json is bundled as safe placeholder and never publishes phone stats',()=>{
 const m=JSON.parse(read('box-status.json'));
 assert.equal(m.bin_name,'unknown');
 assert.equal(m.cpu_percent,null);
 assert.equal(m.ram_used_bytes,null);
 assert.equal(m.ram_total_bytes,null);
 assert.equal(m.updated_at,null);
 assert.match(read('.github/workflows/release.yml'),/updater-ui.js box-status.json update.json/);
 assert.match(read('scripts/install.sh'),/update.json box-status.json/);
 assert.match(read('hotspot/updater.go'),/'+'/'+'box-status.json'+'/'+'/);
});
