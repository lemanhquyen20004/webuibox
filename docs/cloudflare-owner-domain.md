# WebUiBox v0.0.8 — Một Cloudflare Tunnel và Magisk Root Unix socket

Mục tiêu: https://box.lemanhquyen.io.vn

## Kiến trúc

- Mihomo vẫn ở 127.0.0.1:9090, phục vụ WebUI, proxy, rules, logs, websocket.
- Một cổng GATEWAY localhost: 127.0.0.1:9098 — là điểm vào duy nhất cho Tunnel, KHÔNG bind ra 0.0.0.0.
- Gateway chuyển /api/v1/* vào Unix socket /data/adb/webuibox-private/hotspot/root-api.sock (quyền 0600), chuyển các đường dẫn khác vào Mihomo 9090.
- Không mở cổng API root 9097. Root daemon chạy bởi Magisk service.d trên điện thoại.
- Với truy cập từ xa, Gateway kiểm tra chữ ký Cloudflare Access JWT (RS256, đúng Team Domain/AUD). Tất cả lệnh root còn yêu cầu access.key riêng.
- Truy cập localhost trực tiếp qua 9098 vẫn cần access.key để thực hiện lệnh root. Trình duyệt không thể tự chạy su.

## 1. Cloudflare Access: phải xác thực toàn bộ tên miền

Zero Trust → Access → Applications → Self-hosted → tạo ứng dụng cho box.lemanhquyen.io.vn. Bảo vệ **toàn bộ hostname**, không chỉ /ui/ hay /api/v1/. Policy Allow chỉ email/tài khoản của bạn với OTP/MFA. Không dùng Bypass hoặc Everyone. Ghi lại Application Audience (AUD) Tag và Team Domain của Access.

Trên Redmi Note 8T (MT Manager root), tạo:

    /data/adb/webuibox-private/hotspot/remote-access.json

Nội dung (thay bằng giá trị thực của chính tài khoản):

    {
      "team_domain": "YOUR-TEAM.cloudflareaccess.com",
      "aud": "YOUR-APPLICATION-AUDIENCE-TAG"
    }

Quyền thư mục 0700, file JSON 0600. Team Domain là miền cloudflareaccess.com, KHÔNG phải box.lemanhquyen.io.vn. Không để file này trong thư mục web công khai.

Root Access Key nằm tại:

    /data/adb/webuibox-private/hotspot/access.key

File key chỉ được tạo khi root daemon chạy. Không gửi key qua chat hoặc upload lên GitHub.

## 2. Cập nhật WebUiBox v0.0.8 và chạy service Magisk

1. Sao lưu thư mục /data/adb/box/clash/webuibox và cấu hình Box. Giải nén gói Release v0.0.8, copy các file vào thư mục đó.
2. Giữ Mihomo external-controller là 127.0.0.1:9090 và external-ui là /data/adb/box/clash/webuibox. KHÔNG sửa firewall/iptables Box.
3. Từ MT Manager root, chạy scripts/enable-hotspot.sh (trong thư mục WebUiBox) để tạo service.d. Nếu bạn đã bật backend ở phiên bản trước và dùng trình cài root, launcher sẽ được nâng cấp tự động.
4. **Khởi động lại điện thoại** một lần để xóa daemon TCP 9097 cũ và nạp 2 tiến trình mới: --root (Unix) và --gateway (localhost).
5. Mở Chrome trên chính máy chạy Box: http://127.0.0.1:9098/ui/. Vào Phát Wi-Fi hoặc Cập nhật, nhập access.key rồi kết nối backend.
6. Log để kiểm tra: /data/adb/webuibox-private/hotspot/backend.log và gateway.log.

Nếu chỉ copy file bằng MT Manager mà không chạy lại enable-hotspot.sh hoặc cập nhật service.d, launcher cũ có thể vẫn đang khởi động sai tiến trình. Không coi chỉ copy ZIP là hoàn tất kích hoạt backend.

## 3. Cloudflare Tunnel box-android — CHỈ MỘT ROUTE

Sau khi xác minh Gateway chạy trên 9098, vào Cloudflare → Tunnels → box-android → Routes.

XÓA route cũ:

    box.lemanhquyen.io.vn /api/v1/* -> http://127.0.0.1:9097

SỬA route toàn hostname (không có path):

    Hostname: box.lemanhquyen.io.vn
    Path: để trống
    Service: http://127.0.0.1:9098

Không còn route riêng cho API và không trực tiếp trỏ Cloudflare vào 9090. Cloudflared phải chạy trên chính Redmi Note 8T, vì localhost ở đây là máy đang chạy cloudflared.

Không override HTTP Host Header thành localhost. Không strip header Cf-Access-Jwt-Assertion. Không cache /api/v1/*.

Từ xa dùng:

    https://box.lemanhquyen.io.vn/ui/

Phải đăng nhập Cloudflare Access trước khi nhìn thấy WebUI. Nếu Cloudflare Access chưa bảo vệ hostname đúng, DỪNG sử dụng route từ xa.

## 4. Cách kiểm tra và lỗi

- 502 trên tên miền: Gateway 9098 chưa chạy hoặc cloudflared không chạy cùng điện thoại.
- 403: sai Team Domain, AUD, Access token, origin hoặc thiếu JWKS/cấu hình. Gateway từ chối khi thiếu xác thực.
- 401 khi bấm root: sai Access Key trên thiết bị.
- 503 /api/v1/: Unix socket root backend chưa chạy. Xem backend.log.
- WebUI chạy trên 9090 nhưng lệnh root không hoạt động: mở **9098** hoặc HTTPS tên miền Cloudflare đúng.
- CPU/RAM/Core không hiển thị: kiểm tra /ui/box-status.json và bridge service.d/webuibox-status.sh.
- Bật tắt Hotspot qua Android 11 Binder, giới hạn IPv4 qua iptables vẫn là beta. Tùy MIUI/IPv6/offload, không cam kết độ chính xác hay tương thích 100%.

## 5. Quyền riêng tư / Bảo mật

Port 9098 là localhost HTTP phục vụ Tunnel, không phải một API root TCP. Unix socket được đặt trong thư mục chỉ root đọc. Cloudflare Access JWT được kiểm tra chữ ký tại gateway và socket backend, còn mọi thao tác root cần khóa thiết bị riêng. Không đưa cổng 9098 ra Wi-Fi LAN/Internet hay mở tunnel phụ không có Access.
