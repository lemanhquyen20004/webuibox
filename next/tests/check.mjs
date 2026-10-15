import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
const base = path.resolve(import.meta.dirname, '..')
const script = fs.readFileSync(path.join(base, 'scripts', 'patch-upstream.mjs'), 'utf8')
const box = fs.readFileSync(path.join(base, 'overlay', 'src', 'views', 'BoxManagerPage.vue'), 'utf8')
const css = fs.readFileSync(path.join(base, 'overlay', 'src', 'assets', 'webuibox-neon.css'), 'utf8')
for (const term of ['BoxManagerPage.vue','ROUTE_NAME.box','VI_VN','webuibox-neon.css']) assert.ok(script.includes(term), term)
for (const term of ['box-status.json','refreshHotspot','X-WebUiBox-Key','hotspot?.clients','useRouter']) assert.ok(box.includes(term), term)
assert.ok(css.includes('.wb-panel'))
assert.ok(!box.includes('Math.random'))
console.log('WebUiBox beta overlay validation passed')
