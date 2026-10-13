# WebUiBox v0.0.1 — Dark Neon

Giao diện WebUI quản lý **Mihomo/Clash Meta** trong **Box for Magisk/Box for Root**, có 2 ngôn ngữ **Tiếng Việt / English**, chạy được trên điện thoại và máy tính.

[English README](README.md)

## Chức năng đã có

- Biểu đồ tốc độ Download/Upload trực tiếp, tổng lưu lượng, số kết nối và bộ nhớ core.
- Danh sách nhóm proxy, đổi node, kiểm tra ping HTTP, cập nhật proxy provider.
- Xem và ngắt các phiên kết nối, xem quy tắc và nhật ký thời gian thực.
- Chỉnh chế độ Rule / Global / Direct; reload config; xóa DNS cache / Fake-IP.
- **Hiển thị đúng bin_name trong /data/adb/box/settings.ini** thông qua script root xuất JSON, không đọc được root trực tiếp từ trình duyệt.
- Phiên bản ban đầu **v0.0.1**, kiểm tra cập nhật GitHub lúc vào WebUI và sau mỗi 6 giờ; có phiên bản mới sẽ hiện thông báo.
- Script nâng cấp có xác nhận, so SHA-256 và sao lưu bản cũ.
- Chế độ DEMO có nhãn riêng, không gửi lệnh vào core.

Đây là bản WebUiBox mới được viết độc lập để quản lý các chức năng Mihomo phía trên. **Chưa có đầy đủ những tính năng nâng cao của Zashboard** như bản đồ 3D, topology và chỉnh rule chuyên sâu. Chưa có quản lý Hotspot.

## Cài vào Box for Magisk

1. Tải và giải nén mã nguồn/release ZIP.
2. Chạy scripts/install.sh bằng quyền root (có thể dùng môi trường shell hỗ trợ su). Script cài vào /data/adb/box/webuibox và tạo backup tại /data/adb/box/webuibox.backup, không sửa iptables hoặc config Box.
3. Trong file YAML đang chạy bằng Mihomo, thêm/chỉnh **một lần** những mục sau:

        external-controller: 127.0.0.1:9090
        secret: "MAT_KHAU_API_MANH"
        external-ui: /data/adb/box/webuibox

4. Khởi động lại Mihomo. Mở http://127.0.0.1:9090/ui/ trong Chrome. Vào Cài đặt, nhập URL API và secret, tắt DEMO để dữ liệu thực xuất hiện.
5. Để hiển thị bin_name ngay, chạy /system/bin/sh /data/adb/box/webuibox/bridge/box-status.sh --once. Khi khởi động máy lần sau, script Magisk service.d tự cập nhật trạng thái 10 giây một lần.

Nếu Box chọn bin_name là **clash** nhưng lõi thực tế là Mihomo, giao diện sẽ hiển thị **clash**, đúng theo settings.ini. Khi đổi sang sing-box/Xray thì phần API của Mihomo sẽ không hoạt động cho đến khi có adapter tương ứng.

## Cơ chế cập nhật

Giao diện lấy phiên bản trong update.json của repo GitHub. Khi lớn hơn bản đang dùng sẽ báo cập nhật và dẫn tới GitHub Releases. **Trình duyệt không được thực thi lệnh root**, để tránh rủi ro bị website điều khiển thiết bị.

Khi đã có bản phát hành mới, chạy với quyền root:

        su -c sh /data/adb/box/webuibox/scripts/update.sh

Script hỏi xác nhận, tải ZIP và checksum, xác minh SHA-256 trước khi thay file, giữ bản cũ trong thư mục backup. Muốn tạo Release mới cần tăng version trong update.json, package.json, app.js, index.html, sau đó tạo tag vX.Y.Z để workflow GitHub đóng gói và phát hành.

## Bảo mật / lưu ý

- Chỉ mở external-controller ở **127.0.0.1**, đặt secret mạnh, không phơi API ra Internet.
- Secret chỉ lưu trong session trình duyệt.
- Trình duyệt không thể tự đọc thư mục root Android. Bridge chỉ trích bin_name, không thực thi settings.ini.
- Để tránh CORS, nên dùng WebUiBox từ đường dẫn /ui/ do Mihomo phục vụ.
- Chưa kiểm thử thực tế trên mọi bản Magisk/MIUI, hãy sao lưu cấu hình trước khi dùng.

© 2026 lemanhquyen20004 · MIT. Tham khảo dự án Zashboard riêng biệt: https://github.com/Zephyruso/zashboard
