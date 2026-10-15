#!/system/bin/sh
# Disable root beta service; does NOT change Box or hotspot settings.
set -eu
[ "$(id -u)" = 0 ] || exit 1
rm -f /data/adb/service.d/webuibox-hotspot.sh
# Reboot required to retire root daemon + localhost gateway.
# Stop daemon via standard process name; backend may be renamed by the kernel.
pidof webuibox-hotspot-arm64 2>/dev/null | tr ' ' '\n' | while read -r pid; do
 case "$pid" in ''|*[!0-9]*) ;; *) kill "$pid" 2>/dev/null || true ;; esac
done
# Remove only dedicated WebUiBox iptables rules; never flush Box chains.
for iface in ap0 ap1 ap2 ap3 ap4 ap5 swlan0 swlan1 swlan2 swlan3 swlan4 swlan5 wlan0 wlan1 wlan2 wlan3 wlan4 wlan5 softap0 softap1 softap2 softap3; do
 iptables -w 3 -t mangle -D PREROUTING -i "$iface" -j WUBX_IN 2>/dev/null || true
 iptables -w 3 -t mangle -D POSTROUTING -o "$iface" -j WUBX_OUT 2>/dev/null || true
done
iptables -w 3 -t mangle -F WUBX_IN 2>/dev/null || true
iptables -w 3 -t mangle -F WUBX_OUT 2>/dev/null || true
iptables -w 3 -t mangle -X WUBX_IN 2>/dev/null || true
iptables -w 3 -t mangle -X WUBX_OUT 2>/dev/null || true
echo "Root daemon disabled on next boot. Reboot now to stop gateway."
