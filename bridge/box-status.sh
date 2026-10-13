#!/system/bin/sh
# WebUiBox v0.0.1: reads only Box bin_name; emits non-privileged JSON.
set -u
BOX_DIR=/data/adb/box
WEB_DIR=$BOX_DIR/webuibox
SETTINGS=$BOX_DIR/settings.ini
STATUS=$WEB_DIR/box-status.json
PIDFILE=$BOX_DIR/.webuibox-status.pid
detect_bin() {
  if [ -r "$SETTINGS" ]; then
    grep -m 1 -E '^[[:space:]]*bin_name[[:space:]]*=' "$SETTINGS" 2>/dev/null |
      cut -d= -f2- | sed -e 's/[[:space:]]*#.*$//' -e 's/[[:space:]]//g' -e "s/[\"']//g"
  fi
}
is_running() {
  case "$1" in
    clash|mihomo) pidof clash >/dev/null 2>&1 || pidof mihomo >/dev/null 2>&1 ;;
    sing-box) pidof sing-box >/dev/null 2>&1 ;;
    xray) pidof xray >/dev/null 2>&1 ;;
    v2fly) pidof v2fly >/dev/null 2>&1 || pidof v2ray >/dev/null 2>&1 ;;
    hysteria|hysteria2) pidof hysteria >/dev/null 2>&1 || pidof hysteria2 >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}
write_status() {
  bin="$(detect_bin | head -n 1)"
  case "$bin" in
    clash|mihomo|sing-box|xray|v2fly|hysteria|hysteria2) ;;
    *) bin=unknown ;;
  esac
  running=false
  if is_running "$bin"; then running=true; fi
  timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  mkdir -p "$WEB_DIR" || return 1
  temp="$STATUS.$$"
  (umask 022; printf '{"bin_name":"%s","running":%s,"updated_at":"%s"}\n' \
    "$bin" "$running" "$timestamp" > "$temp") || return 1
  mv -f "$temp" "$STATUS"
}
if [ "$*" = "--once" ]; then write_status; exit $?; fi
if [ -f "$PIDFILE" ]; then
  old="$(cat "$PIDFILE" 2>/dev/null)"
  if [ -n "$old" ] && kill -0 "$old" 2>/dev/null; then exit 0; fi
fi
printf '%s\n' "$$" > "$PIDFILE" || exit 1
trap 'rm -f "$PIDFILE"' EXIT
trap 'exit 0' HUP INT TERM
while :; do write_status; sleep 10; done
