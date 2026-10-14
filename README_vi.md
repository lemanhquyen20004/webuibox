# WebUiBox v0.0.3 — Giao diện Dark Neon

Đây là WebUI dành cho **Box for Magisk / Box for Root khi chạy Mihomo (Clash Meta)**. Bản v0.0.3 thiết kế lại theo ảnh demo desktop + điện thoại đã duyệt. Hỗ trợ **Tiếng Việt và English**.

[English](README.md)

## Chức năng giữ nguyên và mở rộng

- Tốc độ tải xuống/tải lên theo thời gian thực, tổng lưu lượng, danh sách kết nối, proxy đang chọn.
- Các nhóm Proxy, chọn node, đo ping qua API, cập nhật provider, ngắt kết nối, Rules, Logs.
- Rule/Global/Direct, nạp lại cấu hình, xóa DNS/Fake-IP cache.
- Hiển thị **đúng bin_name của Box** từ /data/adb/box/settings.ini bằng bridge root.
- Thêm CPU và RAM **thực tế của điện thoại** qua /proc; RAM Mihomo vẫn được hiển thị riêng.
- Biểu đồ tròn dùng lưu lượng của **kết nối hiện tại** do Mihomo cung cấp, không giả mạo số liệu tổng mỗi ngày.
- Kiểm tra cập nhật GitHub, cảnh báo bản mới, script xác minh SHA-256 và sao lưu khi cài phiên bản mới.
- Layout desktop và mobile riêng, Dark Neon Cyan/Tím, gọn, có VI/EN.
- Dữ liệu DEMO chỉ là minh họa khi bật thủ công.

**Giới hạn:** Đây vẫn là giao diện **Mihomo**. Nếu đổi bin_name sang sing-box, Xray, V2Fly hay Hysteria, Mihomo có thể ngừng phục vụ trang /ui/ và các chức năng riêng của Mihomo không hoạt động. WebUiBox chưa có backend quản lý riêng các core này, chưa điều khiển hotspot. CPU/RAM toàn máy cần script bridge.

## Cài bằng MT Manager trên Android root

**Không flash file ZIP này bằng Magisk.** Đây là gói WebUI.

1. Sao lưu file /data/adb/box/clash/config.yaml và thư mục WebUI cũ.
2. Tải **webuibox-v0.0.3.zip** tại mục Releases, mở trong MT Manager và giải nén.
3. Copy file trực tiếp vào **/data/adb/box/clash/webuibox/**:

        /data/adb/box/clash/webuibox/
        ├── index.html
        ├── app.js
        ├── styles.css
        ├── update.json
        ├── bridge/box-status.sh
        └── scripts/install.sh, update.sh

4. Dừng Mihomo trước khi sửa file /data/adb/box/clash/config.yaml. Giữ cổng và Secret hiện tại nếu đã có, đảm bảo mỗi khóa chỉ khai báo một lần:

        external-controller: 127.0.0.1:9090
        secret: "MAT_KHAU_RIENG_CUA_BAN"
        external-ui: /data/adb/box/clash/webuibox

   Chú ý: Mihomo SAFE_PATHS không cho phép dùng external-ui: /data/adb/box/webuibox ở ngoài clash. Nếu bản Mihomo mới báo lỗi **global-client-fingerprint** đã bị loại bỏ, cần bỏ mục toàn cục đó; tùy node đặt client-fingerprint riêng.
5. Để script đọc bin_name và CPU/RAM tự chạy khi khởi động: bằng MT Manager root tạo file /data/adb/service.d/webuibox-status.sh, đặt quyền 0755, nội dung:

        #!/system/bin/sh
        /system/bin/sh /data/adb/box/clash/webuibox/bridge/box-status.sh >/dev/null 2>&1 &

   Khởi động lại điện thoại hoặc chạy bridge/box-status.sh --once qua môi trường root để sinh file box-status.json. Script cập nhật file trạng thái mỗi khoảng 10 giây.
6. Bật lại Box/Mihomo. Mở **http://127.0.0.1:9090/ui/** trong tab ẩn danh của Chrome. Chọn Cài đặt, nhập API URL cùng Secret, tắt DEMO nếu đang bật. Có thể cần xóa cache Zashboard cũ.

**Nếu muốn chạy trình cài thay vì chép thủ công**, chạy scripts/install.sh bằng quyền root từ thư mục đã giải nén. Trình cài không thay YAML, firewall hay nodes; chỉ cài WebUI, backup và tạo script trạng thái.

## Cập nhật

Khi GitHub update.json có version mới, trang Cập nhật sẽ hiện thông báo. **Trang web không được phép tự chạy lệnh root.** Khi có Release mới, có thể dùng lệnh root sau:

        su -c sh /data/adb/box/clash/webuibox/scripts/update.sh

Script hỏi trước, tải Release ZIP và SHA-256, so khớp rồi thay UI và sao lưu bản cũ. Bản v0.0.1 cũ ở thư mục /data/adb/box/webuibox cần chuyển/cài v0.0.3 một lần để dùng đường dẫn cập nhật mới.

**Không chạy lệnh box.tool upxui** sau khi đổi giao diện nếu muốn giữ WebUiBox, vì Box tải Zashboard vào /data/adb/box/clash/dashboard. Để tránh bị ghi đè, WebUiBox được tách riêng thành clash/webuibox.

© 2026 lemanhquyen20004 · MIT.

## Mới v0.0.3: Hotspot Manager (Android root Beta)

WebUI có thêm mục **Phát Wi-Fi**: xem trạng thái điểm phát, thiết bị kết nối (ước lượng từ /proc/net/arp), chặn/bỏ chặn IPv4 và hạn mức MB theo bộ đếm iptables IPv4.

**Giới hạn bắt buộc biết:** IPv6, offload phần cứng, thay đổi IP/MAC hoặc kernel/iptables của MIUI có thể làm hạn mức sai hoặc bị vượt. Hạn mức tính trong phiên, không được bảo đảm qua reboot. Máy bạn chưa được kiểm thử thực tế. Backend chỉ nghe localhost 127.0.0.1:9097, dùng khóa riêng bên ngoài thư mục WebUI.

**Cài qua MT Manager root:**

1. Sao lưu thư mục /data/adb/box/clash/webuibox và config.yaml. Giải nén ZIP v0.0.3 rồi chép file vào /data/adb/box/clash/webuibox (thêm hotspot.js và hotspot/webuibox-hotspot-arm64).
2. Giữ external-ui của Mihomo là /data/adb/box/clash/webuibox.
3. Chạy /data/adb/box/clash/webuibox/scripts/enable-hotspot.sh bằng quyền root bằng công cụ chạy script phù hợp. Lệnh này chỉ tạo dịch vụ chạy backend lúc boot, không tự bật hotspot, không sửa firewall Box.
4. Khởi động lại điện thoại. Mở MT Manager root, tìm access.key trong /data/adb/webuibox-private/hotspot/access.key. Dán key vào trang Phát Wi-Fi -> Kết nối Backend. **Không chia sẻ key này.**
5. Bật hotspot trong Cài đặt Android như thông thường. Kiểm tra danh sách máy kết nối, thử giới hạn trên thiết bị phụ trước. Nếu cần gỡ, chạy scripts/disable-hotspot.sh với quyền root rồi reboot.

**Nút bật/tắt hotspot chỉ là bản thử nghiệm:** Một số bản Android 11 sử dụng service call wifi 47/49, nhưng số giao dịch Binder khác nhau theo ROM. Chức năng mặc định **vô hiệu**. Chỉ khi bạn đã tự xác minh phương thức trên thiết bị cụ thể và tạo file /data/adb/webuibox-private/hotspot/allow-android11-binder thì nút mới cho gửi yêu cầu. Lệnh trả về không đồng nghĩa hotspot bật/tắt thành công. Không tạo file này nếu chưa biết ROM có hỗ trợ.

Không đưa cổng 9097 ra Internet hoặc Cloudflare. Việc bật/tắt trên MIUI của Redmi Note 8T chưa được bảo đảm. WebUI hiện có chức năng bản beta chứ chưa phải ứng dụng quản lý hotspot hoàn thiện.
