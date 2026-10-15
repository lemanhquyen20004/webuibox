# WebUiBox v0.0.6 — Hotspot Manager over owner's HTTPS hostname

Owner hostname: **https://ox.lemanhquyen.io.vn**

This release updates the **browser** and the **on-device ARM64 root backend**:
- On the exact hostname above, Hotspot Manager and the one-click updater request **same-origin HTTPS** `/api/v1/...`. Neither frontend embeds an HTTP localhost URL for the domain.
- On the phone, `http://127.0.0.1:9090/ui/` still calls the root backend on `http://127.0.0.1:9097` as before.
- The backend still binds **only** `127.0.0.1:9097`, requires the private `X-WebUiBox-Key` header on every request, and checks the **exact Origin**. The key remains at `/data/adb/webuibox-private/hotspot/access.key` (outside the static UI directory).

## REQUIRED: Cloudflare Access before routing the root API

A hidden/unshared URL is **not** access control. Use Cloudflare Zero Trust **Access → Applications** to protect the entire `ox.lemanhquyen.io.vn` hostname (including `/api/v1/*`) with a **self-hosted application**, a login policy allowing **only your own identity**, and MFA/one-time PIN or another strong sign-in method. Verify that an incognito browser cannot access the site without logging in.

Do not put `access.key` in GitHub, a Cloudflare environment variable, or any UI's public files. Do not expose/port-forward TCP 9097.

## REQUIRED: Cloudflare Tunnel path routing on the Android phone

**Keep both origins local to the same Android phone on which Box is running.** The Tunnel connector must run on the phone; if it runs on a VPS/another device, that device's `127.0.0.1` would not be the phone's backend.

Create **two ingress rules** in this order for one public hostname:

1. **API before UI** — hostname `ox.lemanhquyen.io.vn`, path regex `^/api/v1(/.*)?$`, service `http://127.0.0.1:9097`.
2. **UI fallback** — same hostname, no path constraint, service `http://127.0.0.1:9090`.

For a locally managed `cloudflared` Tunnel (`config.yml`) this is conceptually:

```yaml
ingress:
  - hostname: ox.lemanhquyen.io.vn
    path: ^/api/v1(/.*)?$
    service: http://127.0.0.1:9097
  - hostname: ox.lemanhquyen.io.vn
    service: http://127.0.0.1:9090
  - service: http_status:404
```

For a remotely managed Tunnel use its **Published application routes/Public Hostnames** UI and put the more specific API route before the catch-all. Some dashboard versions name the setting `Path` and expect a regular expression rather than an asterisk wildcard. Keep the complete `/api/v1/...` path when proxying; do not strip the prefix. Do not alter Mihomo's VPN/TProxy configuration.

Disable caching for `/api/v1/*` in Cloudflare. Require Access authentication for API routes **as well as the rest of the site**.

## Upgrade to v0.0.6

1. Back up `/data/adb/box/clash/webuibox/` and your active Box configuration.
2. Download the `webuibox-v0.0.6.zip` Release. Extract/copy everything under `/data/adb/box/clash/webuibox/` using MT Manager root (or run its trusted `scripts/install.sh` as root). Keep `external-ui: /data/adb/box/clash/webuibox`.
3. **Reboot the phone after installation.** The Go backend is a compiled binary; overwriting a file does **not** upgrade an already-running process. Verify your existing opt-in `/data/adb/service.d/webuibox-hotspot.sh` still starts `hotspot/webuibox-hotspot-arm64`.
4. Confirm the `backend.log` and `access.key` under the private hotspot directory. Never share the key.
5. Verify your Tunnel ingress and Access policy. When logged in at `https://ox.lemanhquyen.io.vn`, navigate to **Phát Wi-Fi → Kết nối Backend** and enter the key.

## Troubleshooting

- Open `https://ox.lemanhquyen.io.vn/api/v1/status` **after logging in**. An `HTTP 401` for a browser address-bar request **without the private key** is an **expected signal that the API route points to the root backend**. It is not proof that a keyed request succeeds.
- `404` or an HTML page indicates the Tunnel API path routing is missing, points at the UI, or Cloudflare Access is prompting.
- `502` indicates the Tunnel cannot connect to the local API service; verify port 9097, root service, and that cloudflared runs **on the same phone**.
- `401` from WebUiBox's keyed request indicates a wrong/old `access.key`. `403` often means an Origin/Access policy problem.
- `Failed to fetch`: check browser Console/Network for mixed content, Cloudflare Access/session state, proxy misrouting, or unavailable service. Old cached WebUiBox JavaScript may still point to HTTP localhost; reload/clear its cached files.

**Important:** On Android 11 MIUI the built-in hotspot toggle remains **experimental and disabled by default**. Device listing via ARP and IPv4 quota enforcement are **best-effort** (hardware offload and IPv6 may bypass them). This release changes **routing to the WebUiBox root API**, not the MIUI hotspot kernel or Box firewall.

## Rollback

To return to local-only mode, restore the old static UI/binary backup, remove the API path rule from your Tunnel, keep your Cloudflare Access protection, and reboot to restart the old backend. You can also continue using `http://127.0.0.1:9090/ui/` with v0.0.6.
