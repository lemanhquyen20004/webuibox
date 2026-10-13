#!/system/bin/sh
# WebUiBox v0.0.2. Installs under Mihomo SAFE_PATHS instead of /data/adb/box/webuibox.
set -eu
[ "$(id -u)" = 0 ] || { echo "Run as root"; exit 1; }
SOURCE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BOX_DIR=/data/adb/box
DEST=$BOX_DIR/clash/webuibox
BOOT=/data/adb/service.d/webuibox-status.sh
[ -f "$SOURCE/index.html" ] && [ -f "$SOURCE/app.js" ] || { echo "Missing WebUiBox files"; exit 1; }
mkdir -p "$BOX_DIR/clash" /data/adb/service.d
STAGE="$BOX_DIR/clash/.webuibox-stage-$$"
BACKUP="$BOX_DIR/clash/webuibox.backup"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/bridge" "$STAGE/scripts"
for file in index.html app.js styles.css update.json; do cp "$SOURCE/$file" "$STAGE/$file"; done
cp "$SOURCE/bridge/box-status.sh" "$STAGE/bridge/box-status.sh"
for file in install.sh update.sh; do cp "$SOURCE/scripts/$file" "$STAGE/scripts/$file"; done
chmod 755 "$STAGE/bridge/box-status.sh" "$STAGE/scripts/"*.sh
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
/system/bin/sh "$DEST/bridge/box-status.sh" --once || true
echo "Installed: $DEST"
echo "Previous version backup: $BACKUP"
echo "When Mihomo is stopped, set external-ui: $DEST in the current config.yaml"
echo "Restart Mihomo and open http://127.0.0.1:9090/ui/"
