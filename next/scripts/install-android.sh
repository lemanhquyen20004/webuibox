#!/system/bin/sh
# Static WebUI installer; not a Magisk module. Backups never overwritten.
set -eu
[ "$(id -u)" = 0 ] || { echo "Root required"; exit 1; }
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SOURCE="$ROOT/webui"
DEST=/data/adb/box/clash/webuibox
BACKUP=/data/adb/box/clash/webuibox.backup-before-zashboard-beta
STAGE="/data/adb/box/clash/.webuibox-next-stage-$$"
[ -f "$SOURCE/index.html" ] || { echo "Extract ZIP first"; exit 1; }
[ -d "$DEST" ] || { echo "Existing WebUiBox missing: $DEST"; exit 1; }
[ ! -e "$BACKUP" ] || { echo "Backup already exists; preserve and install manually"; exit 1; }
mkdir -p "$STAGE"
trap 'rm -rf "$STAGE"' EXIT
cp -R "$SOURCE"/. "$STAGE"/
# Keep known stable root services, binaries, and bridge.
for dir in bridge hotspot scripts; do
  [ ! -d "$DEST/$dir" ] || cp -R "$DEST/$dir" "$STAGE/$dir"
done
for file in update.json box-status.json; do
  [ ! -f "$DEST/$file" ] || cp "$DEST/$file" "$STAGE/$file"
done
mv "$DEST" "$BACKUP"
if ! mv "$STAGE" "$DEST"; then
  mv "$BACKUP" "$DEST"
  exit 1
fi
echo "Installed WebUiBox Zashboard Beta. Backup: $BACKUP"
echo "No changes to Box settings, TProxy, network or root services."
echo "Refresh http://127.0.0.1:9090/ui/ after restarting Mihomo."
