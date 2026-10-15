<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type BoxStatus = {
  bin_name?: string
  running?: boolean
  cpu_percent?: number | null
  ram_used_bytes?: number | null
  ram_total_bytes?: number | null
  uptime_seconds?: number | null
  updated_at?: string | null
}
type HotspotClient = {
  ip: string
  mac: string
  interface: string
  upload: number
  download: number
  limit: number
  blocked: boolean
  quota_reached: boolean
}
type HotspotStatus = {
  hotspot_detected: boolean
  interface: string
  clients: HotspotClient[]
  control_ready: boolean
  accounting: string
}

const router = useRouter()
const vi = ref(navigator.language.toLowerCase().startsWith('vi'))
const status = ref<BoxStatus | null>(null)
const statusError = ref('')
const hotspot = ref<HotspotStatus | null>(null)
const hotspotError = ref('')
const activePanel = ref<'box' | 'hotspot'>('box')
const accessKey = ref(sessionStorage.getItem('webuibox-root-key') || '')
const busy = ref(false)
const updated = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const tr = (vn: string, en: string) => vi.value ? vn : en
const coreName = computed(() => status.value?.bin_name && status.value.bin_name !== 'unknown'
  ? status.value.bin_name : tr('Chưa xác định', 'Unknown'))
const bytes = (n: number | null | undefined) => {
  if (!Number.isFinite(n)) return '—'
  return ((n || 0) / 1048576).toFixed(1) + ' MB'
}
const ramPercent = computed(() => {
  const s = status.value
  return s?.ram_total_bytes && s.ram_used_bytes != null
    ? Math.min(100, Math.round(s.ram_used_bytes / s.ram_total_bytes * 100)) : null
})
const age = computed(() => {
  if (!status.value?.updated_at) return null
  return Math.round((Date.now() - new Date(status.value.updated_at).getTime()) / 1000)
})
const usable = computed(() => status.value && age.value !== null && age.value >= 0 && age.value < 40)
const isGateway = computed(() => location.port === '9098' || location.hostname === 'ox.lemanhquyen.io.vn')

async function refreshBox() {
  try {
    const res = await fetch(new URL('box-status.json', location.href).pathname, { cache: 'no-store' })
    if (!res.ok) throw Error('HTTP ' + res.status)
    const data: BoxStatus = await res.json()
    if (!data || typeof data !== 'object') throw Error('Invalid status JSON')
    status.value = data
    statusError.value = ''
    updated.value = new Date().toLocaleTimeString()
  } catch (e) {
    statusError.value = tr('Không đọc được Box Bridge: ', 'Cannot read Box Bridge: ') + String(e)
    status.value = null
  }
}
async function backend(route: string, body?: object) {
  if (!accessKey.value.trim()) throw Error(tr('Nhập Access Key trước.', 'Enter Access Key first.'))
  if (!isGateway.value) throw Error(tr('Quản lý Hotspot cần Gateway 9098 hoặc Cloudflare Access.', 'Hotspot control requires Gateway 9098 or Cloudflare Access.'))
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch('/api/v1/' + route, {
      method: body ? 'POST' : 'GET', signal: controller.signal, cache: 'no-store',
      headers: { 'X-WebUiBox-Key': accessKey.value.trim(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!res.ok) {
      const raw = await res.text()
      if (res.status === 401) throw Error(tr('Access Key sai hoặc đã đổi.', 'Invalid Access Key.'))
      if (res.status === 404) throw Error(tr('Gateway chưa chuyển /api/v1/ về Root Backend.', 'Gateway API route is missing.'))
      throw Error('HTTP ' + res.status + ': ' + raw.slice(0, 140))
    }
    const data = await res.json()
    return data
  } finally { clearTimeout(timeout) }
}
async function refreshHotspot() {
  busy.value = true
  hotspotError.value = ''
  try {
    sessionStorage.setItem('webuibox-root-key', accessKey.value.trim())
    hotspot.value = await backend('status') as HotspotStatus
  } catch (e) { hotspotError.value = String(e); hotspot.value = null }
  finally { busy.value = false }
}
async function saveClient(client: HotspotClient, blocked: boolean) {
  if (!confirm(tr('Thay đổi quy tắc IPv4 cho thiết bị ' + client.ip + '?', 'Change IPv4 rule for ' + client.ip + '?'))) return
  busy.value = true
  try {
    const megabytes = Math.floor((client.limit || 0) / 1048576)
    await backend('client', { ip: client.ip, mac: client.mac, blocked, limit_mb: megabytes })
    await refreshHotspot()
  } catch (e) { hotspotError.value = String(e) }
  finally { busy.value = false }
}
onMounted(() => { refreshBox(); timer = setInterval(refreshBox, 10000) })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="wb-box-page h-full overflow-y-auto px-3 pb-28 pt-4 md:px-7 md:pb-6">
    <header class="wb-page-header">
      <div>
        <p class="wb-eyebrow">WEBUIBOX · BOX FOR MAGISK</p>
        <h1>{{ tr('Quản lý Box', 'Box Manager') }}</h1>
        <p>{{ tr('Trạng thái thực từ Box Bridge · Không tạo dữ liệu giả', 'Real Box Bridge status · No simulated data') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="wb-btn wb-btn-secondary" @click="vi = !vi">{{ vi ? 'EN' : 'VI' }}</button>
        <button class="wb-btn" @click="refreshBox">{{ tr('Làm mới', 'Refresh') }}</button>
      </div>
    </header>

    <div class="wb-segments">
      <button :class="{ selected: activePanel === 'box' }" @click="activePanel = 'box'">{{ tr('Trạng thái Box', 'Box status') }}</button>
      <button :class="{ selected: activePanel === 'hotspot' }" @click="activePanel = 'hotspot'">{{ tr('Phát Wi-Fi', 'Hotspot') }}</button>
    </div>

    <template v-if="activePanel === 'box'">
      <section class="wb-grid">
        <article class="wb-panel wb-primary-status">
          <p class="wb-eyebrow">{{ tr('DỊCH VỤ BOX', 'BOX SERVICE') }}</p>
          <div class="flex flex-wrap items-center gap-3">
            <span class="wb-status-dot" :class="{ running: usable && status?.running }"></span>
            <strong class="text-2xl">{{ !usable ? tr('Chưa có dữ liệu', 'No data') : status?.running ? tr('Đang chạy', 'Running') : tr('Đang dừng', 'Stopped') }}</strong>
          </div>
          <p>{{ tr('Core đang chọn', 'Selected core') }}: <b>{{ coreName }}</b></p>
          <p class="text-sm opacity-60">{{ tr('Cập nhật lần cuối', 'Last updated') }}: {{ status?.updated_at || '—' }}</p>
          <p v-if="statusError" class="wb-error">{{ statusError }}</p>
          <p v-if="status && !usable" class="wb-error">{{ tr('Thông tin quá cũ hoặc Bridge chưa chạy.', 'Status is stale or Bridge is offline.') }}</p>
          <div class="wb-actions">
            <button class="wb-btn" @click="router.push({ name: 'proxies' })">{{ tr('Mở Proxy', 'Open proxies') }}</button>
            <button class="wb-btn wb-btn-secondary" @click="router.push({ name: 'logs' })">{{ tr('Xem nhật ký', 'View logs') }}</button>
          </div>
          <p class="wb-hint">{{ tr('Start/Stop/Restart Box chưa được bật để tránh thay đổi mạng khi chưa kiểm chứng lệnh root trên bản Box của bạn.', 'Root Box start/stop controls are unavailable until verified against your installed Box scripts.') }}</p>
        </article>

        <article class="wb-panel">
          <p class="wb-eyebrow">{{ tr('TÀI NGUYÊN ĐIỆN THOẠI', 'PHONE RESOURCES') }}</p>
          <div class="wb-resource">
            <div><span>CPU</span><strong>{{ usable && status?.cpu_percent != null ? status.cpu_percent + '%' : '—' }}</strong></div>
            <div class="wb-meter"><i :style="{width: (usable ? status?.cpu_percent || 0 : 0) + '%'}"></i></div>
          </div>
          <div class="wb-resource">
            <div><span>RAM</span><strong>{{ usable && ramPercent != null ? ramPercent + '%' : '—' }}</strong></div>
            <div class="wb-meter"><i class="purple" :style="{ width: (usable ? ramPercent || 0 : 0) + '%' }"></i></div>
          </div>
          <p class="mt-5 text-sm opacity-70">RAM: {{ usable ? bytes(status?.ram_used_bytes) : '—' }} / {{ usable ? bytes(status?.ram_total_bytes) : '—' }}</p>
          <p class="mt-3 text-sm opacity-60">{{ tr('Thời gian hoạt động điện thoại', 'Phone uptime') }}:
            {{ usable && status?.uptime_seconds != null ? Math.floor(status.uptime_seconds / 3600) + ' h' : '—' }}</p>
          <p class="wb-hint">{{ tr('CPU và RAM đọc trực tiếp từ /proc qua Box Bridge, không phải RAM của Mihomo.', 'CPU/RAM sourced from /proc by Box Bridge, not Mihomo process RAM.') }}</p>
        </article>

        <article class="wb-panel">
          <p class="wb-eyebrow">{{ tr('TRUY CẬP NHANH', 'QUICK ACTIONS') }}</p>
          <div class="wb-link-grid">
            <button @click="router.push({ name: 'proxies' })">{{ tr('Máy chủ Proxy', 'Proxy groups') }} <span>↗</span></button>
            <button @click="router.push({ name: 'connections' })">{{ tr('Kết nối', 'Connections') }} <span>↗</span></button>
            <button @click="router.push({ name: 'rules' })">{{ tr('Quy tắc', 'Rules') }} <span>↗</span></button>
            <button @click="router.push({ name: 'settings' })">{{ tr('Cài đặt Zashboard', 'Dashboard settings') }} <span>↗</span></button>
          </div>
        </article>
      </section>
      <div class="wb-disclaimer">{{ tr('WebUiBox dùng bộ máy Zashboard nguyên bản cho các chức năng Mihomo. Chức năng riêng của sing-box/Xray không được giả định là tương thích.', 'Original Zashboard powers Mihomo features; sing-box/Xray compatibility is not implied.') }}</div>
    </template>

    <template v-else>
      <section class="wb-grid">
        <article class="wb-panel">
          <p class="wb-eyebrow">{{ tr('ROOT HOTSPOT BACKEND', 'ROOT HOTSPOT BACKEND') }}</p>
          <h2>{{ tr('Kết nối API bảo mật', 'Secure API connection') }}</h2>
          <p class="wb-hint">{{ tr('Nhập access.key từ MT Manager. Khóa chỉ lưu trong phiên trình duyệt.', 'Enter access.key via MT Manager; only stored for this browser session.') }}</p>
          <input class="wb-key" type="password" v-model="accessKey" autocomplete="off" :placeholder="tr('Dán Access Key','Paste Access Key')" />
          <button class="wb-btn mt-3" :disabled="busy" @click="refreshHotspot">{{ tr('Kết nối / Làm mới', 'Connect / Refresh') }}</button>
          <p v-if="hotspotError" class="wb-error">{{ hotspotError }}</p>
          <p v-if="!isGateway" class="wb-hint">{{ tr('Hãy truy cập qua WebUiBox Gateway cổng 9098 hoặc tên miền HTTPS đã bảo vệ bằng Cloudflare Access.', 'Use Gateway port 9098 or the Access-protected HTTPS domain.') }}</p>
        </article>

        <article class="wb-panel">
          <p class="wb-eyebrow">{{ tr('THIẾT BỊ TRONG MẠNG', 'HOTSPOT CLIENTS') }}</p>
          <h2>{{ hotspot ? (hotspot.hotspot_detected ? tr('Hotspot đã phát hiện', 'Hotspot detected') : tr('Chưa phát hiện Hotspot', 'Hotspot not detected')) : tr('Chưa có dữ liệu', 'No data') }}</h2>
          <p class="wb-hint">{{ tr('Lưu lượng và hạn mức chỉ tính IPv4 qua iptables; hardware offload và IPv6 có thể bỏ qua.', 'Best-effort IPv4 iptables counters, bypassed by hardware offload and IPv6.') }}</p>
          <template v-if="hotspot?.clients?.length">
            <div v-for="client in hotspot.clients" :key="client.ip + client.mac" class="wb-client-row">
              <div class="min-w-0">
                <b>{{ client.ip }}</b><p>{{ client.mac }}</p>
                <p>↑ {{ bytes(client.upload) }} · ↓ {{ bytes(client.download) }}</p>
              </div>
              <button class="wb-btn wb-btn-secondary" :disabled="busy" @click="saveClient(client, !client.blocked)">
                {{ client.blocked ? tr('Bỏ chặn', 'Unblock') : tr('Chặn IPv4', 'Block IPv4') }}
              </button>
            </div>
          </template>
          <p v-else class="wb-hint">{{ tr('Chưa phát hiện thiết bị qua bảng ARP.', 'No clients in ARP table.') }}</p>
        </article>
      </section>
    </template>
    <footer class="wb-footer">WebUiBox 1.0 Beta · Based on Zashboard (MIT) · © 2024 Zephyruso</footer>
  </div>
</template>
