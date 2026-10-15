#!/system/bin/sh
# Explicitly opt into running the WebUiBox hotspot beta backend (localhost only).
set -eu
[ "$(id -u)" = 0 ] || { echo "Run with root";exit 1; }
BIN=/data/adb/box/clash/webuibox/hotspot/webuibox-hotspot-arm64
START=/data/adb/service.d/webuibox-hotspot.sh
[ -f "$BIN" ] || { echo "ARM64 backend missing: $BIN";exit 1; }
chmod 0700 "$BIN"
mkdir -p /data/adb/service.d /data/adb/webuibox-private/hotspot
chmod 0700 /data/adb/webuibox-private /data/adb/webuibox-private/hotspot
cat > "$START" <<'EOF'
#!/system/bin/sh
BIN=/data/adb/box/clash/webuibox/hotspot/webuibox-hotspot-arm64
if [ -x "$BIN" ]; then
  "$BIN" >/data/adb/webuibox-private/hotspot/backend.log 2>&1 &
fi
EOF
chmod 0700 "$START"
echo "Root hotspot beta service enabled for next boot."
echo "To start now, run: /system/bin/sh $START"
echo "After start, find access.key in /data/adb/webuibox-private/hotspot/ using MT Manager root."
echo "For Android 11 experimental hotspot toggle, additional explicit allow-android11-binder file is needed; otherwise toggle stays disabled."
echo "Remote Tunnel requires verified Cloudflare Access JWT and device key; configure remote-access.json first."
