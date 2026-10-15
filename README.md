# WebUiBox v0.0.4

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

1. Back up /data/adb/box/clash/config.yaml and existing UI folder. Download webuibox-v0.0.4.zip from the release, extract its contents.
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

This needs HTTPS curl/wget and unzip, asks permission, verifies SHA-256, then invokes the installer and backs up the previous WebUI. If you are on v0.0.1 at /data/adb/box/webuibox, install v0.0.4 manually or with the new install script first, since the updater now uses Mihomo's safe-path location.

Do not use Box's **box.tool upxui** after switching WebUI if you want to keep it: that command downloads Zashboard into the default **clash/dashboard** directory. WebUiBox uses its own directory instead.

## Security and compatibility

Bind Mihomo external-controller only to 127.0.0.1 and use a strong secret. Never forward it publicly. Browser stores secret only in sessionStorage. The root bridge has no HTTP listener and does not evaluate settings.ini. No changes are made to Box proxy/tethering firewall logic. Review configuration before changing it on a live device.

The dashboard is an independent implementation; [Zashboard](https://github.com/Zephyruso/zashboard) is a separate project used as a UI reference.

© 2026 lemanhquyen20004 · MIT.

## New v0.0.4: Hotspot Manager (opt-in Root Android Beta)

The Hotspot page provides an estimated client list from /proc/net/arp, optional IPv4 block and per-IP MB quota using two dedicated iptables mangle chains, and an experimental Android 11 hotspot toggle guarded by explicit local opt-in.

**Not guaranteed:** IP/MAC rotation, IPv6, hardware tethering offload and OEM Android routing may bypass counters. Quota counters are session-bound and not carrier-accurate. Device support has NOT been verified on the Redmi Note 8T MIUI build.

**Set up with MT Manager:**
- Back up the existing UI folder, extract v0.0.4 ZIP and copy all files (including hotspot.js and hotspot/webuibox-hotspot-arm64) into /data/adb/box/clash/webuibox.
- Keep external-ui configured for that folder in Mihomo.
- Run scripts/enable-hotspot.sh with root from a trusted command runner. This opts into launching a local root service at next boot; it does NOT turn Wi-Fi tethering on.
- Reboot. Use root access to read /data/adb/webuibox-private/hotspot/access.key and enter it into WebUiBox Hotspot -> Connect Backend.
- Toggle hotspot through Android Settings by default. Test on a spare client; rollback with scripts/disable-hotspot.sh as root and reboot.

Only if you have confirmed Android 11 binder calls are safe on your exact ROM, create a root-owned /data/adb/webuibox-private/hotspot/allow-android11-binder marker to enable the experimental toggle buttons. Binder transactions 47/49 are NOT universal to Xiaomi MIUI. The UI only confirms submission of the command, not a successful hotspot state change.

Do not publicly expose port 9097 or the key; keep the controller bound to 127.0.0.1.


## New v0.0.4 — One-tap updates from WebUiBox

The Updates page includes **Install update**. After the user connects the authenticated root backend and confirms the action, it downloads the fixed WebUiBox GitHub Release ZIP, checks the published SHA-256 checksum, extracts allowlisted files into a staging directory, and swaps the WebUI directory with a timestamped backup. No arbitrary URLs or commands may be supplied via the browser. Updates never modify your Box config, proxy subscriptions or iptables.

**One-time manual bootstrap is mandatory from v0.0.3.** The old root helper does not expose the new updater endpoint.

1. Download/extract the v0.0.4 release ZIP and back up the existing UI folder, then replace the files in /data/adb/box/clash/webuibox (including updater-ui.js and the new hotspot/webuibox-hotspot-arm64).
2. Start/enable the optional root backend via scripts/enable-hotspot.sh as root. This service listens only at 127.0.0.1:9097; it does not enable the hotspot automatically. Reboot if an earlier root backend binary was running.
3. Read /data/adb/webuibox-private/hotspot/access.key with MT Manager root and enter it at http://127.0.0.1:9090/ui/#updates, then choose Connect Root Backend.
4. Once a later version (v0.0.5+) is published, use Install update and confirm; the UI reloads after the verified update. Reboot if you need to activate a newer root backend binary.

**Security/limitations:** A SHA-256 published by the same GitHub account ensures asset integrity but is not an independent cryptographic signature. Keep your repository credentials safe, don't expose port 9097 on the LAN/Internet, and never share the root API key. The previous UI is retained in /data/adb/box/clash/webuibox.backup-<timestamp>. GitHub Actions tests do not validate behavior on every MIUI build.


## v0.0.5 — Persistent status across WebUI upgrades

Every release now ships a neutral `box-status.json` (unknown/null placeholders, **no private device data**). The installer and root updater preserve an existing live status snapshot, refresh it from the rooted device, and arrange for the Box status writer to run at boot. Real CPU, RAM, device uptime and selected Box binary are sourced only from the device and refreshed by `bridge/box-status.sh`.

A manual ZIP copy of HTML/JS alone does not activate the root bridge; enable it once with root and keep `service.d/webuibox-status.sh` enabled. Updates do not require manually recreating the JSON thereafter. If hosting the UI via a different domain, ensure the `/ui/box-status.json` path resolves to the phone's instance. Avoid publishing local device data publicly.


## v0.0.8 — Verified Cloudflare Access JWT for remote root API

On the Android-hosted Tunnel domain **https://box.lemanhquyen.io.vn**, the WebUI calls its root API via same-origin HTTPS /api/v1/, while direct localhost access remains unchanged. Unlike v0.0.6, **remote requests to the root daemon are fail-closed unless the configured Cloudflare Access RS256 JWT is cryptographically verified (team domain + application audience) AND the independent root device access key is present**.

Before routing port 9097, protect the **entire** box.lemanhquyen.io.vn hostname in Cloudflare Zero Trust Access (self-hosted application, only your own identity, no Bypass). Install /data/adb/webuibox-private/hotspot/remote-access.json with the verified Team Domain and AUD. Keep root access.key private and outside the web root. Then create the Tunnel's API regex route ahead of its UI route, restart the Android backend by rebooting, and sign in with Access before entering the key in the WebUI.

Full setup instructions and diagnostic codes: [docs/cloudflare-owner-domain.md](docs/cloudflare-owner-domain.md). Neither the phone's proxy configuration nor MIUI hotspot rules are changed by this remote access work.


## v0.0.8 — Private Magisk root Unix socket + one Access-protected gateway

Privileged root operations are no longer available on TCP 9097. The root daemon listens on a chmod 0600 Unix socket under /data/adb/webuibox-private/hotspot/root-api.sock. A separate HTTP gateway listens ONLY on 127.0.0.1:9098 and reverse-proxies Mihomo WebUI/API/websockets to 127.0.0.1:9090 and /api/v1/* to the Unix root socket.

This is **not a port-free browser**: HTML/JavaScript cannot invoke Android su directly. The single local gateway port is needed for Chrome and Cloudflare Tunnel, while the privileged daemon has no TCP listener.

Upgrade: install v0.0.8, then run scripts/enable-hotspot.sh with root (or use root installer that migrates a previously enabled service) and reboot once to retire the v0.0.7 TCP daemon. Browse localhost at http://127.0.0.1:9098/ui/ on the rooted device.

Cloudflare Tunnel: use ONE hostname route box.lemanhquyen.io.vn -> http://127.0.0.1:9098, remove the old API-specific route to 9097 and old UI route to 9090. Protect the entire hostname using Cloudflare Access and configure the exact JWT team domain and AUD in the private remote-access.json. Gateway rejects remote traffic unless the RS256 Cloudflare Access JWT verifies; root calls also require the independent device access.key.

See docs/cloudflare-owner-domain.md for complete setup and rollback. Do not expose local port 9098 to a LAN or unauthenticated Tunnel. Existing Mihomo and hotspot beta limitations remain unchanged.
