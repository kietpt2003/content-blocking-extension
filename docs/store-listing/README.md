# Leaf Content Guard — bộ ảnh 0.0.1

Bộ ảnh được xuất từ giao diện extension thật trong hồ sơ Chromium tạm; không dùng hồ sơ Chrome cá nhân.

Chạy `npm run webstore:assets`. Khi Chromium được cài ở nơi khác, đặt `PLAYWRIGHT_BROWSERS_PATH` trỏ tới thư mục cài của Playwright.

Kết quả: `artifacts/leaf-content-guard-webstore-images-0.0.1.zip` và thư mục `artifacts/webstore-images/`.

## Điền vào Chrome Web Store

- `global/icon-128.png`: icon 128 × 128.
- `global/promo-small-440x280.png`: Small promo tile, 440 × 280.
- `global/promo-marquee-1400x560.png`: Marquee promo tile, 1400 × 560.
- Trong mỗi thư mục `vi`, `en`, `zh-CN`: bốn screenshot 1280 × 800, lần lượt là tổng quan, bộ lọc theo website, quy tắc tùy chỉnh và danh sách domain trình phát.
- Mỗi ngôn ngữ có `name.txt`, `short-description.txt`, `description.txt` để điền nội dung tương ứng. `zh-CN` dùng locale store `zh_CN`.

Screenshot và banner là PNG RGB 24-bit, không alpha. Icon chiếc lá mới đồng bộ với ZIP extension. Các domain thuộc example.com trong ảnh chỉ minh họa cấu hình, không chứng minh hiệu quả chặn quảng cáo thực tế.

ZIP bộ ảnh chỉ chứa tài liệu listing; gói cài extension riêng là `artifacts/leaf-content-guard-0.0.1.zip`. Bộ ảnh cũ được giữ trong archive để đối chiếu. Chưa tải lên Chrome Web Store.
