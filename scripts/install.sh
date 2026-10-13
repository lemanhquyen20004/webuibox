#!/system/bin/sh
# Install WebUiBox static UI + Box status bridge. Run with root.
set -eu
[ "$(id -u)" = "0" ] || { echo "Run as root (su)." >&2; exit 1; }
SOURCE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BOX_DIR=/data/adb/box
DEST=$BOX_DIR/webuibox
BOOT=/data/adb/service.d/webuibox-status.sh
[ -f "$SOURCE/index.html" ] && [ -f "$SOURCE/app.js" ] || { echo "Missing WebUiBox files" >&2; exit 1; }
mkdir -p "$BOX_DIR" /data/adb/service.d
STAGE="$BOX_DIR/.webuibox-stage-$$"
BACKUP="$BOX_DIR/webuibox.backup"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/bridge" "$STAGE/scripts"
for f in index.html app.js styles.css update.json; do cp "$SOURCE/$f" "$STAGE/$f"; done
cp "$SOURCE/bridge/box-status.sh" "$STAGE/bridge/box-status.sh"
for f in install.sh update.sh; do cp "$SOURCE/scripts/$f" "$STAGE/scripts/$f"; done
chmod 755 "$STAGE/bridge/box-status.sh" "$STAGE/scripts/"*.sh
if [ -d "$DEST" ]; then
  rm -rf "$BACKUP"
  mv "$DEST" "$BACKUP"
fi
if ! mv "$STAGE" "$DEST"; then
  [ ! -d "$BACKUP" ] || mv "$BACKUP" "$DEST"
  exit 1
fi
cat > "$BOOT" <<'BOOT_SCRIPT'
#!/system/bin/sh
# WebUiBox local metadata writer; no HTTP listener.
if [ -f /data/adb/box/webuibox/bridge/box-status.sh ]; then
  /system/bin/sh /data/adb/box/webuibox/bridge/box-status.sh >/dev/null 2>&1 &
fi
BOOT_SCRIPT
chmod 755 "$BOOT"
/system/bin/sh "$DEST/bridge/box-status.sh" --once || true
echo "WebUiBox installed in $DEST"
echo "Backup: $BACKUP (if an old installation existed)"
echo "In Mihomo YAML set: external-ui: $DEST"
echo "Restart Mihomo, then open http://127.0.0.1:9090/ui/"
echo "Root bridge starts automatically on next boot."
