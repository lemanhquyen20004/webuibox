#!/usr/bin/env node
// Assemble WebUiBox 1.0 beta onto a pinned Zashboard source checkout.
// Fail if upstream changes known integration points: no silent partial UI.
import fs from 'node:fs'
import path from 'node:path'

const target = path.resolve(process.argv[2] || '')
const own = path.resolve(import.meta.dirname, '..')
if (!fs.existsSync(path.join(target, 'src', 'router', 'index.ts'))) throw Error('Pass checked-out Zashboard source as argv[2]')
const file = p => path.join(target, p)
function replace(p, before, after) {
  let data = fs.readFileSync(file(p), 'utf8')
  if (!data.includes(before)) throw Error('Pinned source changed: missing ' + JSON.stringify(before) + ' in ' + p)
  data = data.replace(before, after)
  fs.writeFileSync(file(p), data)
}
function insertLang(p, label) {
  replace(p, "  logs: ", "  box: '" + label + "',\n  logs: ")
}

fs.cpSync(path.join(own, 'overlay'), target, { recursive: true, force: true })

replace('src/constant/index.ts', '  GlobeAltIcon,', '  GlobeAltIcon,\n  ServerStackIcon,')
replace('src/constant/index.ts', "  proxies = 'proxies',", "  proxies = 'proxies',\n  box = 'box',")
replace('src/constant/index.ts', '  [ROUTE_NAME.proxies]: GlobeAltIcon,', '  [ROUTE_NAME.proxies]: GlobeAltIcon,\n  [ROUTE_NAME.box]: ServerStackIcon,')
replace('src/constant/index.ts', "  RU_RU = 'ru-RU',", "  RU_RU = 'ru-RU',\n  VI_VN = 'vi-VN',")

replace('src/router/index.ts', "import HomePage from '@/views/HomePage.vue'", "import HomePage from '@/views/HomePage.vue'\nimport BoxManagerPage from '@/views/BoxManagerPage.vue'")
replace('src/router/index.ts', "    path: 'overview',", "    path: 'box',\n    name: ROUTE_NAME.box,\n    component: BoxManagerPage,\n  },\n  {\n    path: 'overview',")

insertLang('src/i18n/en.ts', 'Box Manager')
insertLang('src/i18n/ru.ts', 'Box Manager')
insertLang('src/i18n/zh.ts', 'Box Manager')
insertLang('src/i18n/zh-tw.ts', 'Box Manager')
replace('src/i18n/index.ts', "import en from './en'", "import en from './en'\nimport vi from './vi'")
replace('src/i18n/index.ts', '    [LANG.EN_US]: en,', '    [LANG.EN_US]: en,\n    [LANG.VI_VN]: vi,')

replace('src/main.ts', "import './assets/main.css'", "import './assets/main.css'\nimport './assets/webuibox-neon.css'")

const manifest = JSON.parse(fs.readFileSync(file('package.json'), 'utf8'))
manifest.version = '1.0.0-beta.1'
manifest.name = 'webuibox-zashboard'
fs.writeFileSync(file('package.json'), JSON.stringify(manifest, null, 2) + '\n')
replace('vite.config.ts', "name: 'zashboard',", "name: 'WebUiBox',")
replace('vite.config.ts', "short_name: 'zashboard',", "short_name: 'WebUiBox',")
replace('vite.config.ts', "description: 'a dashboard using clash api',", "description: 'Dark Neon Zashboard + Box for Magisk',")
replace('index.html', '<title>zashboard</title>', '<title>WebUiBox · Box for Magisk</title>')

const en = fs.readFileSync(file('src/i18n/en.ts'), 'utf8')
const routes = fs.readFileSync(file('src/constant/index.ts'), 'utf8')
if (!en.includes("box: 'Box Manager'") || !routes.includes("box = 'box'")) throw Error('Box navigation integration incomplete')
console.log('WebUiBox v1.0.0-beta.1 patched into pinned Zashboard tree')
