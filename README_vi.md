# WebUiBox v0.0.2 — Giao diện Dark Neon

Đây là WebUI dành cho **Box for Magisk / Box for Root khi chạy Mihomo (Clash Meta)**. Bản v0.0.2 thiết kế lại theo ảnh demo desktop + điện thoại đã duyệt. Hỗ trợ **Tiếng Việt và English**.

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
2. Tải **webuibox-v0.0.2.zip** tại mục Releases, mở trong MT Manager và giải nén.
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

Script hỏi trước, tải Release ZIP và SHA-256, so khớp rồi thay UI và sao lưu bản cũ. Bản v0.0.1 cũ ở thư mục /data/adb/box/webuibox cần chuyển/cài v0.0.2 một lần để dùng đường dẫn cập nhật mới.

**Không chạy lệnh box.tool upxui** sau khi đổi giao diện nếu muốn giữ WebUiBox, vì Box tải Zashboard vào /data/adb/box/clash/dashboard. Để tránh bị ghi đè, WebUiBox được tách riêng thành clash/webuibox.

© 2026 lemanhquyen20004 · MIT.
