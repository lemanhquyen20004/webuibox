#!/system/bin/sh
# WebUiBox v0.0.5. Installs under Mihomo SAFE_PATHS instead of /data/adb/box/webuibox.
set -eu
[ "$(id -u)" = 0 ] || { echo "Run as root"; exit 1; }
SOURCE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BOX_DIR=/data/adb/box
DEST=$BOX_DIR/clash/webuibox
BOOT=/data/adb/service.d/webuibox-status.sh
[ -f "$SOURCE/index.html" ] && [ -f "$SOURCE/app.js" ] && [ -f "$SOURCE/hotspot/webuibox-hotspot-arm64" ] || { echo "Missing WebUiBox files"; exit 1; }
mkdir -p "$BOX_DIR/clash" /data/adb/service.d
STAGE="$BOX_DIR/clash/.webuibox-stage-$$"
BACKUP="$BOX_DIR/clash/webuibox.backup"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/bridge" "$STAGE/scripts" "$STAGE/hotspot"
for file in index.html app.js hotspot.js updater-ui.js styles.css update.json; do cp "$SOURCE/$file" "$STAGE/$file"; done
cp "$SOURCE/bridge/box-status.sh" "$STAGE/bridge/box-status.sh"
for file in install.sh update.sh enable-hotspot.sh disable-hotspot.sh; do cp "$SOURCE/scripts/$file" "$STAGE/scripts/$file"; done
cp "$SOURCE/hotspot/webuibox-hotspot-arm64" "$STAGE/hotspot/webuibox-hotspot-arm64"
chmod 755 "$STAGE/hotspot/webuibox-hotspot-arm64" "$STAGE/bridge/box-status.sh" "$STAGE/scripts/"*.sh
# The live status JSON is generated on the phone, not shipped in a release ZIP.
# Keep the last valid snapshot across upgrades so the dashboard never goes blank
# solely because the WebUI directory was replaced.
if [ -f "$DEST/box-status.json" ]; then
  cp "$DEST/box-status.json" "$STAGE/box-status.json" || true
fi
if [ -d "$DEST" ]; then rm -rf "$BACKUP"; mv "$DEST" "$BACKUP"; fi
if ! mv "$STAGE" "$DEST"; then
  [ ! -d "$BACKUP" ] || mv "$BACKUP" "$DEST"
  exit 1
fi
cat > "$BOOT" <<'EOF'
#!/system/bin/sh
if [ -f /data/adb/box/clash/webuibox/bridge/box-status.sh ]; then
  /system/bin/sh /data/adb/box/clash/webuibox/bridge/box-status.sh >/dev/null 2>&1 &
fi
EOF
chmod 755 "$BOOT"
# Refresh CPU/RAM/bin_name immediately, and keep refreshing without reboot.
# The daemon's PID guard prevents duplicate copies.
if ! /system/bin/sh "$DEST/bridge/box-status.sh" --once; then
  echo "Warning: Box bridge could not refresh root metrics" >&2
fi
/system/bin/sh "$DEST/bridge/box-status.sh" >/dev/null 2>&1 &
echo "Installed: $DEST"
echo "Hotspot beta is disabled until you explicitly run scripts/enable-hotspot.sh as root."
echo "Previous version backup: $BACKUP"
echo "When Mihomo is stopped, set external-ui: $DEST in the current config.yaml"
echo "Restart Mihomo and open http://127.0.0.1:9090/ui/"
