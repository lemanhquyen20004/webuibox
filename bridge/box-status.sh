#!/system/bin/sh
# WebUiBox v0.0.2: local, read-only Box/device status with no privileged network listener.
set -u
BOX_DIR=/data/adb/box
WEB_DIR=$BOX_DIR/clash/webuibox
SETTINGS=$BOX_DIR/settings.ini
STATUS=$WEB_DIR/box-status.json
PIDFILE=$BOX_DIR/.webuibox-status.pid
detect_bin(){
  [ -r "$SETTINGS" ] || return 0
  grep -m 1 -E '^[[:space:]]*bin_name[[:space:]]*=' "$SETTINGS" | cut -d= -f2- | sed -e 's/[[:space:]]*#.*$//' -e 's/[[:space:]]//g' -e "s/[\"']//g"
}
is_running(){
  case "$1" in
    clash|mihomo) pidof clash >/dev/null 2>&1 || pidof mihomo >/dev/null 2>&1 ;;
    sing-box) pidof sing-box >/dev/null 2>&1 ;;
    xray) pidof xray >/dev/null 2>&1 ;;
    v2fly) pidof v2fly >/dev/null 2>&1 || pidof v2ray >/dev/null 2>&1 ;;
    hysteria|hysteria2) pidof hysteria >/dev/null 2>&1 || pidof hysteria2 >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}
prev_busy=0
prev_total=0
cpu_sample(){
  read -r _ user nice sys idle iowait irq softirq steal rest </proc/stat || return 1
  busy=$((user+nice+sys+irq+softirq+steal))
  total=$((busy+idle+iowait))
  cpu=null
  if [ "$prev_total" -gt 0 ] && [ "$total" -gt "$prev_total" ]; then
    diff_total=$((total-prev_total))
    diff_busy=$((busy-prev_busy))
    cpu=$((100*diff_busy/diff_total))
    [ "$cpu" -ge 0 ] || cpu=0
    [ "$cpu" -le 100 ] || cpu=100
  fi
  prev_total=$total
  prev_busy=$busy
}
memory_sample(){
  awk '/^MemTotal:/ {total=$2} /^MemAvailable:/ {available=$2} /^MemFree:/ {free=$2} /^Cached:/ {cached=$2} /^Buffers:/ {buffers=$2} END {if (!available) available=free+cached+buffers;used=total-available;if(used<0)used=0;printf "%.0f %.0f\n",used*1024,total*1024}' /proc/meminfo
}
write_status(){
  [ -d "$WEB_DIR" ] || return 1
  bin="$(detect_bin)"
  case "$bin" in clash|mihomo|sing-box|xray|v2fly|hysteria|hysteria2) ;; *) bin=unknown ;; esac
  running=false
  if is_running "$bin"; then running=true; fi
  cpu_sample || cpu=null
  set -- $(memory_sample)
  used="$1"; total="$2"
  uptime="$(awk '{printf "%.0f",$1}' /proc/uptime 2>/dev/null)"
  [ -n "$uptime" ] || uptime=0
  timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  tmp="$STATUS.$$"
  (umask 022; printf '{"bin_name":"%s","running":%s,"cpu_percent":%s,"ram_used_bytes":%s,"ram_total_bytes":%s,"uptime_seconds":%s,"updated_at":"%s"}\n' "$bin" "$running" "$cpu" "$used" "$total" "$uptime" "$timestamp" > "$tmp") || return 1
  mv -f "$tmp" "$STATUS"
}
if [ "$*" = "--once" ]; then
  cpu_sample || :
  sleep 1
  write_status; exit $?
fi
if [ -f "$PIDFILE" ]; then
  old="$(cat "$PIDFILE" 2>/dev/null)"
  case "$old" in ""|*[!0-9]*) old=0;; esac
  if [ "$old" -gt 1 ] && kill -0 "$old" 2>/dev/null; then exit 0; fi
fi
printf '%s\n' "$$" > "$PIDFILE" || exit 1
trap 'rm -f "$PIDFILE"' EXIT
trap 'exit 0' HUP INT TERM
while :; do write_status; sleep 10; done
