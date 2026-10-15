# WebUiBox v1.0.0 Beta 1 — dựa trên mã nguồn Zashboard

**Mã nguồn Zashboard: [Zephyruso/zashboard](https://github.com/Zephyruso/zashboard).** Phiên bản nền khóa ở commit `e5b48b4e8fe5c727170a57444c969f01aca3fbad`. Giấy phép **MIT**, © 2024 Zephyruso; giữ nguyên thông báo bản quyền trong gói.

## Tính năng có trong beta

- Giữ các chức năng Zashboard gốc cho **Mihomo/Clash**: Proxy/Provider, chọn node, độ trễ, Connections, Overview, Rules, Logs, Settings, PWA.
- Theme Dark Neon Cyan/Tím tùy biến cho điện thoại và máy tính, có ngôn ngữ Việt/Anh; chuỗi chưa dịch sẽ dùng tiếng Anh.
- Tab **Box Manager** mới lấy dữ liệu trạng thái Box, core, CPU/RAM thật từ `box-status.json` do `bridge/box-status.sh` trên máy root tạo.
- Tab **Phát Wi-Fi** truy cập API root hiện có ở `/api/v1/status` qua Gateway cổng 9098 hoặc Cloudflare Access, hỗ trợ xem thiết bị và chặn/bỏ chặn IPv4 khi backend thực sự kết nối.
- Mọi chỉ số không có dữ liệu đều hiện `—` / chưa có dữ liệu.

**Chưa có:** Start/Stop/Restart Box root, quản lý các core ngoài Mihomo bằng cùng Clash API, đảm bảo quota IPv6/hardware offload. Upstream Zashboard đã bỏ hỗ trợ sing-box. Những chức năng này sẽ phát triển sau khi kiểm chứng với bản Box for Magisk cụ thể; không làm nút giả.

## Cài qua MT Manager

ZIP **không flash bằng Magisk**; đây là gói WebUI beta.

1. Sao lưu `/data/adb/box/clash/webuibox/` trong MT Manager root. Giữ lại core/config và `bridge/`, `hotspot/`, `scripts/`, `box-status.json` và `update.json`.
2. Giải nén file release `webuibox-zashboard-v1.0.0-beta.1.zip`, chép toàn bộ file **bên trong `webui/`** vào `/data/adb/box/clash/webuibox/`. Giữ lại các thư mục backend/bridge/script đã có; không chép bộ cũ đè lên assets mới.
3. Giữ trong Mihomo: `external-ui: /data/adb/box/clash/webuibox`. Khởi động lại Mihomo, mở `http://127.0.0.1:9090/ui/`.
4. Zashboard có màn Setup riêng: khai báo API Mihomo 127.0.0.1:9090 và Secret đang dùng. Không dán Secret vào đường dẫn công khai.
5. Nếu đã bật WebUiBox Gateway cổng 9098 từ v0.0.8 thì có thể thử `http://127.0.0.1:9098/ui/`, nhập Access Key trong tab Hotspot. Nếu qua tên miền phải có Cloudflare Access, không đưa API root trực tiếp ra Internet.
6. Nếu WebUI không cập nhật vì PWA cũ lưu cache, xóa dữ liệu website tại Chrome và tải lại.

Có thể dùng `install-android.sh` có quyền root từ gói ZIP để tạo backup tự động, nhưng với MT Manager có thể chép thủ công như trên.

## Khôi phục

Nếu beta lỗi, tắt Mihomo và dùng MT Manager đưa thư mục WebUiBox đã sao lưu trở về `/data/adb/box/clash/webuibox/`. Sau đó khởi động lại Mihomo. Installer giữ backup `/data/adb/box/clash/webuibox.backup-before-zashboard-beta` và không ghi đè backup có sẵn.

## Mã nguồn / CI

Repo `lemanhquyen20004/webuibox` lưu mã nguồn tùy biến ở `next/overlay/`, cùng `next/scripts/patch-upstream.mjs`. GitHub Actions lấy mã nguồn gốc Zashboard tại **đúng commit đã khóa**, chèn mã nguồn thay đổi, kiểm tra TypeScript và build Vite. Không thay đổi bản stable 0.x đang dùng trước khi beta được kiểm thử thật trên Redmi Note 8T. Gói build có file giấy phép `LICENSE-ZASHBOARD`.
