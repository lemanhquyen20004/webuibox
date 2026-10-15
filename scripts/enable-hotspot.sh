#!/system/bin/sh
# Opt-in Magisk Unix backend + ONE localhost gateway (never root TCP 9097).
set -eu
[ "$(id -u)" = 0 ] || { echo "Root required";exit 1; }
BIN=/data/adb/box/clash/webuibox/hotspot/webuibox-hotspot-arm64
START=/data/adb/service.d/webuibox-hotspot.sh
[ -f "$BIN" ] || { echo "Missing ARM64 backend: $BIN";exit 1; }
mkdir -p /data/adb/service.d /data/adb/webuibox-private/hotspot
chmod 0700 /data/adb/webuibox-private /data/adb/webuibox-private/hotspot "$BIN"
cat > "$START" <<'EOF'
#!/system/bin/sh
BIN=/data/adb/box/clash/webuibox/hotspot/webuibox-hotspot-arm64
PRIVATE=/data/adb/webuibox-private/hotspot
if [ -x "$BIN" ]; then
 mkdir -p "$PRIVATE"
 chmod 0700 /data/adb/webuibox-private "$PRIVATE"
 "$BIN" --root >"$PRIVATE/backend.log" 2>&1 &
 "$BIN" --gateway >"$PRIVATE/gateway.log" 2>&1 &
fi
EOF
chmod 0700 "$START"
echo "WebUiBox Unix root daemon + local gateway enabled for next boot."
echo "Reboot Android to retire the old TCP 9097 daemon."
echo "Gateway UI: http://127.0.0.1:9098/ui/"
echo "Cloudflare Tunnel: ONE route to http://127.0.0.1:9098."
