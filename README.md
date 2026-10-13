# WebUiBox v0.0.1

**Dark Neon WebUI for Mihomo / Clash Meta**, with a root-only status bridge for Box for Root (Box for Magisk). Responsive mobile and desktop layouts with **Vietnamese / English**.

[Hướng dẫn tiếng Việt](README_vi.md)

## Implemented features

- Live upload/download from Mihomo WebSocket, totals and active connections.
- Proxy groups, switch node, measure delay, refresh proxy providers.
- List/terminate active sessions, inspect routing rules, view live logs.
- Rule / Global / Direct mode, reload Mihomo configuration, clear DNS and Fake-IP cache.
- Show actual **bin_name** from /data/adb/box/settings.ini using a safe local JSON status file (does not execute settings.ini).
- Check update.json at startup and every six hours; show a banner when a newer version is available.
- Explicit upgrade script that verifies SHA-256, asks permission and creates a backup.
- Clearly labeled DEMO preview, with no API write actions permitted while DEMO is on.

This is an **independent, new frontend** implementing the Mihomo features above, not a copy of the full Zashboard distribution. Advanced Zashboard features (3D globe, topology, deep rules editing) and Hotspot management are not yet implemented.

## Install on Android with Box for Root

1. Download/extract this repository (or a release ZIP once available).
2. Run **scripts/install.sh** as root from its extracted folder. For example using a root shell with the correct extracted path: su -c sh /path/to/webuibox/scripts/install.sh
3. This installs files under /data/adb/box/webuibox without editing your Box settings or firewall. It backs up any earlier WebUiBox installation to /data/adb/box/webuibox.backup.
4. Add or modify the following entries in your currently selected **Mihomo YAML** (do not introduce duplicate keys):

        external-controller: 127.0.0.1:9090
        secret: "SET_A_STRONG_PRIVATE_SECRET"
        external-ui: /data/adb/box/webuibox

5. Restart Mihomo from Box. Visit http://127.0.0.1:9090/ui/ in your phone browser, open Settings, enter the local API endpoint and secret, and turn DEMO off.
6. For immediate core detection, run /system/bin/sh /data/adb/box/webuibox/bridge/box-status.sh --once; on next reboot Magisk service.d runs the background writer every 10 seconds.

If your external-ui-name is customized, adjust the /ui/ URL. If you switch Box bin_name to sing-box/Xray, the selected binary name still displays, but the Mihomo API features require a running Mihomo-compatible controller.

## Updates

The **update.json** manifest on main declares the published version. Bump version in **update.json**, **package.json**, **app.js**, and **index.html** when releasing; create a matching Git tag **vX.Y.Z**. GitHub Actions builds **webuibox-vX.Y.Z.zip** and its SHA-256 checksum and publishes them as release assets.

The browser checks for updates but **does not execute root commands**. Once a new release exists, the optional authenticated root-side upgrade is:

        su -c sh /data/adb/box/webuibox/scripts/update.sh

It prompts for approval, verifies the ZIP checksum and backs up the existing WebUI. Installing from GitHub Releases requires a real published release ZIP (an update.json change alone is not enough).

## Security and compatibility

- Keep **external-controller bound to 127.0.0.1** and protect it with a strong secret. Do not expose the API or status files publicly.
- API secret is saved in browser **sessionStorage** (not committed to GitHub).
- Same-origin hosting via Mihomo external-ui is recommended; separate websites may be blocked by CORS/mixed content.
- The Box reader does **not source or execute settings.ini**, nor add iptables rules, VPN hooks, or any root HTTP listeners.
- CPU percentage is intentionally not invented: the standard Mihomo endpoints used here do not provide device CPU. RAM shows Mihomo process memory when available.
- Android/Magisk compatibility requires on-device verification; back up working configs first.

Inspired by the visual direction requested after reviewing the separate [Zashboard](https://github.com/Zephyruso/zashboard) project, but not a redistribution of its code.

© 2026 lemanhquyen20004 · MIT License.
