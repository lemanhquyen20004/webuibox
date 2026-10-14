# WebUiBox v0.0.3

**Dark Neon Box for Root dashboard** for Mihomo/Clash Meta on Android root. UI rebuilt for the approved desktop/mobile reference, with Vietnamese/English switching.

[Hướng dẫn tiếng Việt](README_vi.md)

## What works

- Live upload/download speeds, totals, selected proxy and connection counts from Mihomo REST and WebSocket APIs.
- Proxy groups and node switching, latency tests, proxy-provider updates, active connections and disconnect, routing rules, logs, Rule/Global/Direct mode, config reload, DNS and Fake-IP cache flushing.
- Optional Android root bridge shows the **literal bin_name** in /data/adb/box/settings.ini and reads actual phone CPU and RAM usage from /proc/stat and /proc/meminfo.
- Donut chart uses bytes of **currently active connections** (when Mihomo supplies them), not fictitious daily per-proxy totals.
- Checks GitHub update.json periodically; newer versions show a notification. Root update script verifies downloaded release ZIP against its SHA-256 file before replacing files.
- Theme, desktop navigation, mobile bottom tabs, responsive cards, bilingual UI. DEMO is optional and labeled; real measurements are never fabricated.

**Important limitations:** Mihomo REST/WebSocket controls are usable only while Mihomo is the active server. If Box is switched to Xray, sing-box, V2Fly or Hysteria, the local Mihomo-hosted /ui/ server may not be available. No root HTTP server or cross-core control API is included. Device CPU and RAM require the root bridge to be running. Phone system RAM and Mihomo process RAM are different metrics. The decorative reference screenshot is not a performance benchmark.

## Installation (Box for Root / Redmi Note 8T)

**This ZIP is NOT a flashable Magisk module.**

1. Back up /data/adb/box/clash/config.yaml and existing UI folder. Download webuibox-v0.0.3.zip from the release, extract its contents.
2. Use MT Manager root access to copy the files under **/data/adb/box/clash/webuibox/**. index.html, app.js, styles.css and update.json must be directly inside that folder; bridge/box-status.sh goes inside its bridge/ subfolder.
3. While Box/Mihomo is stopped, edit the existing /data/adb/box/clash/config.yaml and set, **without duplicate keys**:

        external-controller: 127.0.0.1:9090
        secret: "YOUR_PRIVATE_API_SECRET"
        external-ui: /data/adb/box/clash/webuibox

   Keep your existing external-controller port and secret if already configured. **Do not** set external-ui outside the Mihomo safe path. Avoid old global-client-fingerprint in recent Mihomo.
4. Optional root-script installation: from the extracted release folder run /system/bin/sh scripts/install.sh as root. This creates an on-boot bridge service and a backup at /data/adb/box/clash/webuibox.backup. It **does not edit settings.ini, proxies, iptables or the YAML itself**.
5. If installing manually with MT Manager only, create /data/adb/service.d/webuibox-status.sh with these contents and set permission 0755:

        #!/system/bin/sh
        /system/bin/sh /data/adb/box/clash/webuibox/bridge/box-status.sh >/dev/null 2>&1 &

   Run box-status.sh --once as root, or reboot to enable the bridge.
6. Restart Mihomo using your existing Box workflow. Browse **http://127.0.0.1:9090/ui/** in a private tab to clear the old Zashboard cache. In Settings, set the Mihomo API URL and secret and disable DEMO.

The status file is stored under /data/adb/box/clash/webuibox/box-status.json. The bridge emits only core name, process presence, CPU/RAM and uptime. No credentials are read from Box settings.

## Updates

Releases are packaged by GitHub Actions when package.json/update.json contain the matching new version. Browser update notifications do not execute root commands. For a deliberate root-side upgrade, run:

        su -c sh /data/adb/box/clash/webuibox/scripts/update.sh

This needs HTTPS curl/wget and unzip, asks permission, verifies SHA-256, then invokes the installer and backs up the previous WebUI. If you are on v0.0.1 at /data/adb/box/webuibox, install v0.0.3 manually or with the new install script first, since the updater now uses Mihomo's safe-path location.

Do not use Box's **box.tool upxui** after switching WebUI if you want to keep it: that command downloads Zashboard into the default **clash/dashboard** directory. WebUiBox uses its own directory instead.

## Security and compatibility

Bind Mihomo external-controller only to 127.0.0.1 and use a strong secret. Never forward it publicly. Browser stores secret only in sessionStorage. The root bridge has no HTTP listener and does not evaluate settings.ini. No changes are made to Box proxy/tethering firewall logic. Review configuration before changing it on a live device.

The dashboard is an independent implementation; [Zashboard](https://github.com/Zephyruso/zashboard) is a separate project used as a UI reference.

© 2026 lemanhquyen20004 · MIT.

## New v0.0.3: Hotspot Manager (opt-in Root Android Beta)

The Hotspot page provides an estimated client list from /proc/net/arp, optional IPv4 block and per-IP MB quota using two dedicated iptables mangle chains, and an experimental Android 11 hotspot toggle guarded by explicit local opt-in.

**Not guaranteed:** IP/MAC rotation, IPv6, hardware tethering offload and OEM Android routing may bypass counters. Quota counters are session-bound and not carrier-accurate. Device support has NOT been verified on the Redmi Note 8T MIUI build.

**Set up with MT Manager:**
- Back up the existing UI folder, extract v0.0.3 ZIP and copy all files (including hotspot.js and hotspot/webuibox-hotspot-arm64) into /data/adb/box/clash/webuibox.
- Keep external-ui configured for that folder in Mihomo.
- Run scripts/enable-hotspot.sh with root from a trusted command runner. This opts into launching a local root service at next boot; it does NOT turn Wi-Fi tethering on.
- Reboot. Use root access to read /data/adb/webuibox-private/hotspot/access.key and enter it into WebUiBox Hotspot -> Connect Backend.
- Toggle hotspot through Android Settings by default. Test on a spare client; rollback with scripts/disable-hotspot.sh as root and reboot.

Only if you have confirmed Android 11 binder calls are safe on your exact ROM, create a root-owned /data/adb/webuibox-private/hotspot/allow-android11-binder marker to enable the experimental toggle buttons. Binder transactions 47/49 are NOT universal to Xiaomi MIUI. The UI only confirms submission of the command, not a successful hotspot state change.

Do not publicly expose port 9097 or the key; keep the controller bound to 127.0.0.1.
