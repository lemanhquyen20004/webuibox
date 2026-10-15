# WebUiBox v0.0.7 — Quản lý từ xa qua Cloudflare Access

Tên miền: https://box.lemanhquyen.io.vn
Thiết bị: Android root đang chạy Box/Mihomo và dịch vụ WebUiBox Root Backend.

**Rất quan trọng:** Đây là HTTP API có quyền root. Không bật route API công khai nếu chưa cấu hình Cloudflare Access. Phiên bản v0.0.7 thêm lớp xác minh chữ ký JWT RSA-SHA256, đúng issuer và audience từ Cloudflare; Root Backend còn yêu cầu X-WebUiBox-Key của điện thoại. Nếu chưa có file remote-access.json hợp lệ, API root từ xa trả HTTP 403, KHÔNG mở quyền root.

## 1. Cloudflare Access — bảo vệ TOÀN BỘ hostname

Vào Zero Trust → Access controls → Applications → Add application → Self-hosted.

- Hostname/domain: box.lemanhquyen.io.vn
- Không đặt path hạn chế: bảo vệ toàn bộ hostname bao gồm /ui/*, /api/v1/*, /configs, /proxies và mọi endpoint của Mihomo.
- Policy: Allow chỉ email hoặc danh tính của bạn. Dùng OTP/MFA, không cấu hình Bypass hoặc Everyone.
- Copy **Application Audience (AUD) Tag** của ứng dụng tại Additional settings.
- Xác định **Team domain** trong Zero Trust (ví dụ: example.cloudflareaccess.com). Không nhầm hostname ứng dụng với team domain.

Sau đó mở cửa sổ ẩn danh tới https://box.lemanhquyen.io.vn/ui/; phải có màn hình đăng nhập Access trước khi nhìn thấy giao diện.

## 2. Bật xác minh Cloudflare Access tại Android root

Dùng MT Manager (root), tạo thư mục:

    /data/adb/webuibox-private/hotspot/

Tạo file (chỉ chủ máy đọc, quyền 0600):

    /data/adb/webuibox-private/hotspot/remote-access.json

Nội dung (thay hai placeholder bằng thông tin Access của bạn):

    {
      "team_domain": "TEN-TEAM-CUA-BAN.cloudflareaccess.com",
      "aud": "DAN-APPLICATION-AUDIENCE-TAG-CHINH-XAC-TAI-DAY"
    }

KHÔNG điền box.lemanhquyen.io.vn vào team_domain. Cloudflare Access xác thực dựa trên chữ ký JWT được phát cho đúng AUD của self-hosted application.

Không cần khai báo access.key trong file JSON này; Access Key vẫn giữ ở:

    /data/adb/webuibox-private/hotspot/access.key

Các file này tuyệt đối không được đặt trong /data/adb/box/clash/webuibox/ hoặc upload GitHub.

Nếu file cấu hình chưa có / sai team_domain / sai AUD / JWKS của Access chưa tải được, root API từ xa sẽ từ chối. Đây là hành vi an toàn.

## 3. Cloudflare Tunnel box-android — hai routes trên CÙNG ĐIỆN THOẠI

Chỉ thực hiện khi đã hoàn thành bước Cloudflare Access. Tunnel connector phải chạy trên điện thoại có Box, không phải máy tính/VPS khác, vì 127.0.0.1 trong route là localhost CỦA MÁY CHẠY cloudflared.

Trong Cloudflare dashboard → Networking → Tunnels → box-android → Routes:

| Ưu tiên | Hostname | Path (regex) | Service |
|---|---|---|---|
| 1 | box.lemanhquyen.io.vn | ^/api/v1(/.*)?$ | http://127.0.0.1:9097 |
| 2 | box.lemanhquyen.io.vn | (không ràng buộc) | http://127.0.0.1:9090 |

Mihomo phục vụ WebUI tại /ui/. KHÔNG strip prefix /api/v1. Trên Cloudflare Tunnel giữ nguyên HTTP Host Header mặc định: box.lemanhquyen.io.vn. Không đặt override HTTP Host Header thành 127.0.0.1:9097, vì backend kiểm tra host chính xác.

Nếu dùng locally managed cloudflared, cấu hình ingress tương ứng:

    ingress:
      - hostname: box.lemanhquyen.io.vn
        path: ^/api/v1(/.*)?$
        service: http://127.0.0.1:9097
      - hostname: box.lemanhquyen.io.vn
        service: http://127.0.0.1:9090
      - service: http_status:404

Không cache /api/v1/* trên Cloudflare. Không mở router/firewall port 9097 ra LAN hoặc Internet.

## 4. Cài WebUiBox v0.0.7 bằng MT Manager

1. Sao lưu /data/adb/box/clash/webuibox/ và cấu hình Box.
2. Tải webuibox-v0.0.7.zip tại GitHub Releases. Giải nén và chép các file vào /data/adb/box/clash/webuibox/ như trước.
3. Giữ external-ui: /data/adb/box/clash/webuibox và external-controller: 127.0.0.1:9090 trong Mihomo.
4. Nếu backend chưa bật: kích hoạt script /data/adb/box/clash/webuibox/scripts/enable-hotspot.sh bằng root. Script tạo service.d; KHÔNG tự bật phát Wi-Fi.
5. Đặt remote-access.json (bước 2), sau đó **khởi động lại máy** để nạp backend ARM64 v0.0.7. Không chỉ chép đè binary khi tiến trình cũ còn chạy.
6. Đăng nhập Cloudflare Access qua https://box.lemanhquyen.io.vn/ui/, mở Phát Wi-Fi hoặc Cập nhật và nhập access.key của điện thoại. Trình duyệt gọi HTTPS same-origin /api/v1/*.
7. Thử ở localhost http://127.0.0.1:9090/ui/ nếu đường truyền Cloudflare chưa hoạt động. Access JWT **không bắt buộc** khi truy cập trực tiếp localhost, nhưng key vẫn bắt buộc.

## 5. Kiểm tra và lỗi

- 404 từ /api/v1/status: sai route / thứ tự route / đã đi vào Mihomo thay vì backend.
- 502: cloudflared không kết nối được 127.0.0.1:9097 trên điện thoại, hoặc backend chưa chạy.
- 403: thiếu/sai Access JWT, sai Team Domain / Audience, sai Host Header hoặc Origin.
- 401: sai Access Key root. Đừng đưa key qua ảnh, chat, GitHub.
- Trang HTML Cloudflare Access thay vì JSON: chưa đăng nhập Access/Access policy chưa bảo vệ cả API.
- Nếu dùng ox.lemanhquyen.io.vn cũ, chỉ web UI có thể mở được; Root Backend v0.0.7 CHỈ cho phép từ xa qua box.lemanhquyen.io.vn và đúng Access JWT.

Lưu ý: Cloudflare Access làm lớp bảo vệ đăng nhập; token ở phía origin vẫn được xác minh bằng JWKS của Team Domain và AUD, không tin mù quáng vào bất kỳ HTTP header nào từ Internet.

**Quan trọng:** Các chức năng hạn mức IPv4/ARP và bật/tắt Wi-Fi vẫn là bản Beta phụ thuộc MIUI; không bảo đảm quản lý khách nối hoặc ngắt chính xác 100%. Không thay đổi thiết lập proxy/iptables của Box khi thêm remote support.
