#!/system/bin/sh
# Root-only, checksum-verified updater. No privileged HTTP endpoint.
set -eu
[ "$(id -u)" = "0" ] || { echo "Run as root (su)." >&2; exit 1; }
DEST=/data/adb/box/webuibox
REPO=https://github.com/lemanhquyen20004/webuibox
MANIFEST=https://raw.githubusercontent.com/lemanhquyen20004/webuibox/main/update.json
[ -d "$DEST" ] || { echo "WebUiBox is not installed"; exit 1; }
TMP="/data/local/tmp/webuibox-update-$$"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT
download() {
  if command -v curl >/dev/null 2>&1; then
    curl --fail --location --silent --show-error --connect-timeout 15 --max-time 120 "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$2" "$1"
  else
    echo "Need curl or wget with HTTPS support" >&2; return 1
  fi
}
get_version() {
  sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([0-9][0-9.]*\)".*/\1/p' "$1" | head -n 1
}
download "$MANIFEST" "$TMP/update.json"
version="$(get_version "$TMP/update.json")"
case "$version" in
  ""|*[!0-9.]*|.*|*..*) echo "Invalid remote version" >&2; exit 1 ;;
esac
current="$(get_version "$DEST/update.json")"
echo "Installed: $current; available: $version"
[ "$version" != "$current" ] || { echo "Already up to date"; exit 0; }
echo "This script installs v$version from $REPO"
printf 'Continue? [y/N] '
read answer
case "$answer" in y|Y|yes|YES) ;; *) echo "Cancelled"; exit 0 ;; esac
FILE="webuibox-v$version.zip"
ASSET="$REPO/releases/download/v$version/$FILE"
download "$ASSET" "$TMP/$FILE"
download "$ASSET.sha256" "$TMP/$FILE.sha256"
expected="$(awk 'NR==1{print $1}' "$TMP/$FILE.sha256")"
actual="$(sha256sum "$TMP/$FILE" | awk '{print $1}')"
[ -n "$expected" ] && [ "$expected" = "$actual" ] || {
  echo "SHA-256 mismatch. Refusing to install." >&2
  exit 1
}
mkdir -p "$TMP/extracted"
unzip -q "$TMP/$FILE" -d "$TMP/extracted"
for name in index.html styles.css app.js update.json bridge/box-status.sh scripts/install.sh; do
  [ -f "$TMP/extracted/$name" ] || { echo "Invalid package, missing $name" >&2; exit 1; }
done
[ "$(get_version "$TMP/extracted/update.json")" = "$version" ] || { echo "Version mismatch" >&2; exit 1; }
/system/bin/sh "$TMP/extracted/scripts/install.sh"
echo "Update completed. Backup at $DEST.backup"
