# WebUiBox v0.0.4 — Giao diện Dark Neon

Đây là WebUI dành cho **Box for Magisk / Box for Root khi chạy Mihomo (Clash Meta)**. Bản v0.0.4 thiết kế lại theo ảnh demo desktop + điện thoại đã duyệt. Hỗ trợ **Tiếng Việt và English**.

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
2. Tải **webuibox-v0.0.4.zip** tại mục Releases, mở trong MT Manager và giải nén.
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

Script hỏi trước, tải Release ZIP và SHA-256, so khớp rồi thay UI và sao lưu bản cũ. Bản v0.0.1 cũ ở thư mục /data/adb/box/webuibox cần chuyển/cài v0.0.4 một lần để dùng đường dẫn cập nhật mới.

**Không chạy lệnh box.tool upxui** sau khi đổi giao diện nếu muốn giữ WebUiBox, vì Box tải Zashboard vào /data/adb/box/clash/dashboard. Để tránh bị ghi đè, WebUiBox được tách riêng thành clash/webuibox.

© 2026 lemanhquyen20004 · MIT.

## Mới v0.0.4: Hotspot Manager (Android root Beta)

WebUI có thêm mục **Phát Wi-Fi**: xem trạng thái điểm phát, thiết bị kết nối (ước lượng từ /proc/net/arp), chặn/bỏ chặn IPv4 và hạn mức MB theo bộ đếm iptables IPv4.

**Giới hạn bắt buộc biết:** IPv6, offload phần cứng, thay đổi IP/MAC hoặc kernel/iptables của MIUI có thể làm hạn mức sai hoặc bị vượt. Hạn mức tính trong phiên, không được bảo đảm qua reboot. Máy bạn chưa được kiểm thử thực tế. Backend chỉ nghe localhost 127.0.0.1:9097, dùng khóa riêng bên ngoài thư mục WebUI.

**Cài qua MT Manager root:**

1. Sao lưu thư mục /data/adb/box/clash/webuibox và config.yaml. Giải nén ZIP v0.0.4 rồi chép file vào /data/adb/box/clash/webuibox (thêm hotspot.js và hotspot/webuibox-hotspot-arm64).
2. Giữ external-ui của Mihomo là /data/adb/box/clash/webuibox.
3. Chạy /data/adb/box/clash/webuibox/scripts/enable-hotspot.sh bằng quyền root bằng công cụ chạy script phù hợp. Lệnh này chỉ tạo dịch vụ chạy backend lúc boot, không tự bật hotspot, không sửa firewall Box.
4. Khởi động lại điện thoại. Mở MT Manager root, tìm access.key trong /data/adb/webuibox-private/hotspot/access.key. Dán key vào trang Phát Wi-Fi -> Kết nối Backend. **Không chia sẻ key này.**
5. Bật hotspot trong Cài đặt Android như thông thường. Kiểm tra danh sách máy kết nối, thử giới hạn trên thiết bị phụ trước. Nếu cần gỡ, chạy scripts/disable-hotspot.sh với quyền root rồi reboot.

**Nút bật/tắt hotspot chỉ là bản thử nghiệm:** Một số bản Android 11 sử dụng service call wifi 47/49, nhưng số giao dịch Binder khác nhau theo ROM. Chức năng mặc định **vô hiệu**. Chỉ khi bạn đã tự xác minh phương thức trên thiết bị cụ thể và tạo file /data/adb/webuibox-private/hotspot/allow-android11-binder thì nút mới cho gửi yêu cầu. Lệnh trả về không đồng nghĩa hotspot bật/tắt thành công. Không tạo file này nếu chưa biết ROM có hỗ trợ.

Không đưa cổng 9097 ra Internet hoặc Cloudflare. Việc bật/tắt trên MIUI của Redmi Note 8T chưa được bảo đảm. WebUI hiện có chức năng bản beta chứ chưa phải ứng dụng quản lý hotspot hoàn thiện.


## Mới v0.0.4 — Cập nhật ngay trong WebUiBox

WebUiBox nay có nút **Cập nhật ngay** trong trang Cập nhật: khi phát hiện bản mới, người dùng nhập **Access Key** của Root Backend, kết nối và xác nhận cài. Backend chỉ tải từ GitHub Releases của repo lemanhquyen20004/webuibox, kiểm tra SHA-256, giải nén các file đã cho phép, sao lưu giao diện cũ rồi thay nguyên thư mục WebUiBox. **Không tự chạy khi mới mở trang và không thay đổi config.yaml, node, iptables hoặc Box.**

**Cần cài thủ công một lần từ v0.0.3:** bản v0.0.3 chưa có API cập nhật một chạm, nên không thể tự nâng cấp lên v0.0.4 chỉ bằng nút ở bản cũ.

1. Tải ZIP v0.0.4 tại GitHub Releases, sao lưu /data/adb/box/clash/webuibox, giải nén rồi chép đè file vào /data/adb/box/clash/webuibox. Đặc biệt phải có file updater-ui.js và binary ARM64 hotspot/webuibox-hotspot-arm64 mới.
2. Nếu chưa kích hoạt WebUiBox Root Backend: chạy scripts/enable-hotspot.sh bằng quyền root, hoặc cấu hình service.d như hướng dẫn phần Hotspot Manager. Dịch vụ chỉ nghe ở 127.0.0.1:9097; **không tự bật hotspot**. Nếu backend đã chạy bản cũ, khởi động lại máy để nạp binary mới.
3. Dùng MT Manager root đọc key riêng /data/adb/webuibox-private/hotspot/access.key (không chia sẻ ra ngoài). Mở http://127.0.0.1:9090/ui/#updates, nhập key và nhấn **Kết nối Root Backend**.
4. Từ các bản sau (v0.0.5 trở lên), khi mục Cập nhật phát hiện phiên bản mới thì nhấn **Cập nhật ngay**, xác nhận. Chờ xác minh, sao lưu và cài; WebUI sẽ tải lại sau khi hoàn tất. Nếu binary backend thay đổi, reboot để nạp binary mới.

**An toàn:** API cập nhật root buộc có key bí mật, chấp nhận Origin localhost của Mihomo, và chỉ cho tải repo cố định. Đây là kiểm tra checksum từ cùng chủ sở hữu repo, **không phải chữ ký độc lập**, vì vậy cần bảo vệ tài khoản GitHub. Bản cũ được lưu theo thư mục /data/adb/box/clash/webuibox.backup-<timestamp> để khôi phục thủ công nếu cần. Không đưa cổng 9097 lên Cloudflare hoặc LAN. Kiểm thử CI không thay thế thử nghiệm thực tế trên Redmi Note 8T.


## v0.0.5 — Sửa lỗi mất CPU / RAM / Core sau khi cập nhật

Mỗi Release giờ đóng gói kèm file **box-status.json khởi tạo**, giá trị ban đầu là `unknown`/`null`, KHÔNG phải dữ liệu thật của máy. Khi cài/cập nhật, WebUiBox **giữ bản box-status.json thực đang có** và chạy `bridge/box-status.sh` để tự tạo dữ liệu theo điện thoại. File service khởi động lại cùng máy ở `/data/adb/service.d/webuibox-status.sh` cũng được tạo/sửa khi cài từ script.

Nếu chỉ dùng MT Manager để **chép đè riêng file HTML/JS** thì script root chưa chắc đã chạy. Muốn CPU/RAM/Core thật hoạt động, vẫn phải bật bridge root tối thiểu một lần. Bản cập nhật sau sẽ không yêu cầu thêm thủ công file JSON nữa khi backend và service đang hoạt động.

**Không upload JSON thật của điện thoại lên GitHub** vì đó là dữ liệu riêng và sẽ không tự thay đổi nếu chỉ lưu trên repo. Khi sử dụng tên miền thay cho `127.0.0.1:9090/ui/`, cần đảm bảo đường dẫn `/ui/box-status.json` được phục vụ đúng; không công khai những dữ liệu thiết bị không cần thiết.
