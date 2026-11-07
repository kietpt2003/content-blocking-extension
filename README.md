# Home Content Blocker — Chrome Extension

Project Node.js độc lập để build Chrome Extension Manifest V3, lọc request quảng cáo
và nội dung HTML trên trình duyệt. Không phải DNS server, không cần proxy/CA và không
chạy trên ESP32. Node.js chỉ dùng để build/test; extension chạy trực tiếp trong Chrome.

## Các lớp lọc

| Lớp          | Chức năng                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Network      | Chrome `declarativeNetRequest` chặn domain và endpoint quảng cáo/tracking được nhận diện               |
| HTML/DOM     | Quan sát trang động bằng MutationObserver, ẩn ad slot và bài có metadata quảng cáo                     |
| YouTube JSON | Thử nghiệm, mặc định bật: lọc dữ liệu trình phát ban đầu và một số response fetch/XHR JSON của YouTube |

- **YouTube:** nhận diện ad slot, promoted/display renderers và overlay HTML. JSON mode
  nhận diện `/youtubei/v1/player`, `/next`, `/browse`; giữ nguyên dữ liệu streaming và
  playability. Không đọc URL stream để phát lại, không sửa trạng thái Premium hay DRM.
- **Thông báo YouTube:** khi bật Ẩn thành phần HTML và YouTube, tự xác nhận
  “Video paused. Continue watching?” và phát tiếp video bị tạm dừng bởi nhắc nhở;
  ẩn “Experiencing interruptions?” và đóng/ẩn cảnh báo ad blocker nhận diện được.
  Giữ thao tác Pause thủ công, không tự bấm Skip hoặc tua video. Tắt bộ lọc hoặc
  thêm ngoại lệ domain sẽ dừng xử lý và khôi phục các phần tử đang ẩn.
  Chỉ xử lý giao diện; không bảo đảm phát được khi máy chủ từ chối cấp nội dung.
- **Khởi phát YouTube:** khi bật JSON YouTube, bản 0.1.14 phục hồi một lần nếu
  player báo gián đoạn, video chưa nhận metadata sau 700 ms và vẫn đang yêu cầu phát.
  Dùng API YouTube tải lại đúng video/vị trí, giữ queue playlist khi có đủ API khôi phục.
  Không kích hoạt khi mạng chậm đơn thuần, video đã phát, người dùng Pause, livestream
  hoặc nội dung cần đăng nhập/không phát được. Chẩn đoán có bộ đếm `startupRecoveries`.
- **Facebook:** nhận diện bài trong feed qua marker quảng cáo, liên kết ad metadata
  và aria-label tài trợ tiếng Việt/Anh. Cột bên nhận diện heading Sponsored/Được tài trợ
  và các thẻ ảnh liên kết trong cùng một khối; giữ nguyên Contacts/Birthdays và các
  khối lân cận. Đây là lọc HTML, cần bật Ẩn thành phần HTML và Facebook; không chặn
  rộng fbcdn.net. Không tìm chữ "Sponsored" trên toàn bộ nội dung bài viết.
- **TikTok:** nhận diện thẻ feed có metadata sponsored/ad-label.
- **XVideos (`xvideos.com`):** công tắc **Chặn QC XVideos** có ở popup và trang cài đặt,
  mặc định bật; cấu hình cũ tự bổ sung công tắc mà không đổi lựa chọn website khác.
  Khi bật công tắc và lọc Network, hook MAIN tại `document_start`
  chặn nhánh kiểm tra pre-roll/post-roll của HTML5Player, giữ nguồn HLS và player gốc.
  Có quy tắc dự phòng giới hạn request `/v1/vast.php` của `pemsrv.com` do trang này
  khởi tạo. Tắt công tắc XVideos, Network/bộ lọc hoặc thêm ngoại lệ domain để dừng xử lý.
  Tải lại clip sau khi đổi công tắc để áp dụng đầy đủ.
  Không phụ thuộc bộ đếm clip chẵn/lẻ. Cần tải lại trang sau khi nạp bản extension mới;
  dùng cửa sổ ẩn danh cần bật **Allow in Incognito** trong trang Details của extension.
- **VLXX (`vlxx.app`, `vlxx.phd`):** công tắc **Chặn QC VLXX** ở popup và trang cài đặt,
  mặc định bật. Chặn các script banner/popunder đã nhận diện và các VAST tag trong
  `/vlxx/tvc/`; thay riêng script cung cấp lịch quảng cáo bằng lịch rỗng để JW Player
  vẫn khởi tạo với nguồn clip gốc trong iframe `play.vlstream.net`. Không chặn thư viện
  JW Player hoặc script khởi tạo `embed-vast.js` dùng chung với nội dung.
  Cần bật Chặn domain / URL cho phần player/popup và Ẩn thành phần HTML cho các
  vị trí banner. Tải lại clip sau khi đổi công tắc. Ngoại lệ website vẫn được ưu tiên.
  `vlxx.phd` hiện chuyển hướng sang `vlxx.app`; bộ lọc nhận diện cả hai tên miền.
- **Website khác:** domain quảng cáo chung, ad slot phổ biến và CSS selector do bạn thêm.

Đây là bộ quy tắc khởi đầu có thể mở rộng, **không phải bản sao uBlock Origin** và
không đảm bảo YouTube/Facebook/TikTok hết quảng cáo. Các nền tảng thay đổi DOM/API
và A/B test liên tục. Extension chưa được xác nhận hiệu quả trên tài khoản thật.
Đặc biệt, chỉ ẩn HTML không có nghĩa bỏ được quảng cáo đang phát trong video.

## Cài đặt và build

Yêu cầu Node.js 20 trở lên, npm và Chrome desktop 120 trở lên.

```bash
cd /path/to/content-blocking-extension
npm ci
npm run build
```

Mở **chrome://extensions** → bật **Developer mode** → **Load unpacked** → chọn thư mục
**`dist/extension`** bên trong project. Chọn đúng thư mục chứa `manifest.json`.
Ghim biểu tượng extension trên thanh công cụ và tải lại các tab cần lọc.

Khi cập nhật từ ZIP cũ, Reload chỉ đọc lại thư mục đã nạp trước đó. Cần giải nén
bản ZIP mới vào đúng thư mục đó, hoặc nạp lại bằng **Load unpacked** và chọn
`dist/extension` vừa build. Nếu nạp thư mục khác, tắt bản cũ để tránh chạy hai bản.
Đóng tab YouTube cũ, mở tab mới rồi kiểm tra chẩn đoán: `extensionVersion`,
`pageVersion` và `youtube.version` đều phải là `0.1.14`.

Extension không dùng các cờ sideload tự động trên Chrome cá nhân. Chrome/Edge mới
đã bỏ một số cờ này; kiểm thử dùng Chromium riêng của Playwright.

## Sử dụng

Popup có:

- Bật/tắt toàn bộ bộ lọc.
- Tạm tắt trên website hiện tại; bật lại sẽ bỏ ngoại lệ domain đang khớp.
- Số thành phần DOM đang bị ẩn trong frame chính của tab.
- Nút mở cài đặt.

Số trên icon do Chrome thống kê request bị chặn; số trong popup là số phần tử HTML
đang ẩn, không phải số video ads. Một quảng cáo có thể chứa nhiều phần tử và request.

Trong trang cài đặt:

1. Chọn lọc network, HTML và các website muốn hỗ trợ.
2. Thêm domain hoặc CSS riêng nếu cần.
3. Bấm **Lưu cấu hình**. Quy tắc DNR cập nhật nguyên tử và HTML được áp dụng trên tab đang mở.
4. Tải lại trang khi muốn hủy request đã tải hoặc nội dung JSON đã được sửa trước đó.

Khi tạm tắt, các phần tử extension đang ẩn được trả về giá trị `display` trước đó.
Khi trang tái sử dụng một bài cũ thành bài thường, bộ lọc kiểm tra lại metadata và bỏ ẩn.
Lưu lượng đã bị Chrome chặn không thể tự khôi phục nếu không tải lại request/trang.

### Domain tùy chỉnh

Từ bản 0.1.13, `youtu.be` đã có trong danh sách chặn mặc định; không cần nhập
vào domain tùy chỉnh. Áp dụng cơ chế chặn tài nguyên trong trang như các domain mặc định khác.

```text
ads.example.com
tracking.example.com
```

Mỗi dòng một hostname ASCII/punycode, không có URL, path hoặc wildcard.
Một domain bao gồm chính nó và subdomain; `example.com` không khớp `notexample.com`.
Tối đa 250 domain riêng. Network rules mặc định không chặn điều hướng `main_frame`,
nhằm giữ quyền mở website trực tiếp; chúng chặn tài nguyên được tải trong trang.
Không thêm domain chứa nội dung chính như `youtube.com`, `facebook.com` hoặc
`googlevideo.com` nếu vẫn muốn xem nội dung từ chúng.

### Quy tắc HTML tùy chỉnh

```text
news.example.com##.advertisement
example.com###ad-slot
example.com##[data-advertisement="true"]
```

Dạng `domain##CSS-selector`, tối đa 100 quy tắc. Chọn dấu `#` đầu selector theo CSS
thông thường: muốn chọn `id=ad-slot` thì dòng có ba dấu `#` liên tiếp.
Trình duyệt kiểm tra cú pháp selector trước khi lưu qua UI; selector lỗi không làm
dừng các bộ lọc còn lại. Đây không phải parser ABP/EasyList đầy đủ: không hỗ trợ
`:has-text()`, `:upward()`, scriptlet hoặc JavaScript dán vào cấu hình.

Ví dụ cho các lớp phủ quảng cáo thường gặp trên YouTube:

```text
youtube.com##.ytp-ad-player-overlay
youtube.com##.ytp-ad-image-overlay
youtube.com##.ytp-ad-text-overlay
```

Các selector này chỉ ẩn giao diện quảng cáo, không dừng quảng cáo đang phát trong luồng video.
Bản 0.1.6 đã bỏ toàn bộ mã tự bấm Skip, tua và gọi play trên video quảng cáo.
Lớp network dùng Chrome declarativeNetRequest để chặn request trước khi tải:

- Domain quảng cáo riêng như doubleclick.net, googlesyndication.com, googleadservices.com.
- Endpoint youtube.com/pagead/ và youtube.com/api/stats/ads.
- Endpoint youtube.com/get_midroll_info được tham chiếu từ adBreakServiceRenderer,
  chỉ chặn XHR do YouTube khởi tạo. Không chặn toàn bộ youtube.com.
- Rule hẹp cho googlevideo.com/initplayback có source=youtube, c=TVHTML5 và oad,
  chỉ áp dụng XHR được khởi tạo từ youtube.com. Rule này không áp dụng cho mọi
  quảng cáo desktop; không chặn toàn bộ googlevideo.com hoặc videoplayback.

Nguồn điều kiện rule initplayback:
[uAssets](https://github.com/uBlockOrigin/uAssets/blob/master/filters/filters.txt).
Rule này là điều kiện nhận diện request, không phải danh sách domain dành riêng cho
mọi video quảng cáo YouTube. Các request dùng chung host/path với video chính mà
không có dấu hiệu phân biệt không thể chặn an toàn chỉ bằng domain.

Tùy chọn JSON vẫn là lớp lọc riêng, chỉ chạy khi được bật; muốn chỉ lọc mạng,
tắt **Ẩn thành phần HTML** và **Thử nghiệm: JSON YouTube**, giữ **Chặn domain / URL**.
Nếu quảng cáo vẫn phát, điều đó có thể là request chưa được rule mạng nhận diện;
extension không thay bằng thao tác Skip/tua tự động.

### Ngoại lệ

Danh sách bỏ qua có ưu tiên cao hơn blocklist. Bỏ qua một domain cũng bỏ qua
subdomain của nó. Network exceptions cho frame và request do domain khởi tạo;
iframe bên thứ ba đã tải trước khi đổi cấu hình có thể cần reload để nhận đúng phạm vi.

### Nhập/xuất cấu hình

Xuất JSON lấy cấu hình **đã lưu**. Nhập JSON chỉ điền vào form, cần bấm Lưu mới áp dụng.
File import tối đa 128 KiB; schema không hợp lệ bị từ chối. File không chứa cookie,
tài khoản hoặc lịch sử duyệt web.

Cấu hình dùng `chrome.storage.local` trên từng Chrome profile. Muốn dùng trên nhiều
máy, cài extension ở mỗi Chrome và nhập cùng file cấu hình; đây chưa phải hệ thống
quản lý từ một home server. Extension không lọc ứng dụng YouTube/Facebook/TikTok native,
thiết bị TV hay các máy khác chỉ nhờ chung Wi-Fi.

## Chế độ JSON YouTube

Tùy chọn **Thử nghiệm: JSON YouTube** mặc định bật khi cài mới hoặc đặt lại cấu hình;
cài đặt đã lưu được giữ nguyên. Từ bản 0.1.9, khi bật,
background đăng ký hook MAIN tại document_start bằng chrome.scripting, trước
khi inline player bootstrap đọc quảng cáo. Không đăng ký khi JSON tắt, công tắc
chung/YouTube tắt; excludeMatches áp dụng ngoại lệ domain. Khi đổi cấu hình cần
tải lại tab để việc đăng ký có hiệu lực từ đầu trang. Không gửi giá trị mặc định
JSON=false sang MAIN trong lúc chưa đọc xong cấu hình thật.

Các đường dữ liệu được lọc:

- Lọc `ytInitialPlayerResponse` và `ytInitialData` khi được gán, khi nhận cấu hình
  hoặc YouTube điều hướng trang. Giữ reference của object/array đang được trang sử dụng.
- Lọc giá trị đã giải mã ở `ytplayer.config.args.raw_player_response` và chuỗi
  `player_response` khi có sẵn.
- Lọc response fetch/XHR JSON 200 từ player/next/browse/get_watch của YouTube. XHR text/json
  giữ status, responseURL, thứ tự sự kiện và hành vi lỗi khi đọc sai responseType.

Fetch/text JSON tối đa 2 MiB; JSON object có giới hạn độ sâu/node. Bỏ qua định dạng
không nhận diện. Không xử lý worker/service-worker fetch, protobuf, WebSocket, JSON
nhúng tùy ý chưa được trang giải mã hoặc quảng cáo gộp vào cùng luồng media.
Việc xóa metadata không bảo đảm trình phát sẽ bỏ được mọi video ad; mã trang có thể
đã khởi tạo quảng cáo trước khi cấu hình extension được đọc. Dữ liệu đã sửa không thể
khôi phục đầy đủ trong player đang chạy. Tắt và mở tab mới nếu phát video gặp lỗi.

### Nếu vẫn thấy quảng cáo trong video

Từ bản 0.1.7 có ghi request để chẩn đoán; bản 0.1.8 bật ghi trước khi tự reload tab.
Hai bản này không bổ sung rule quảng cáo mới chưa
được kiểm chứng. Bộ đếm JSON không chứa URL request, nên không đủ để xác định
request tải quảng cáo đang lọt qua rule mạng.

1. Nạp extension 0.1.10 và mở lại tab YouTube.
2. Trong popup trên tab đó, bấm **Ghi 60 giây và tải lại tab**. Bộ ghi được bật trước, sau đó
   extension tự tải lại tab với bypassCache; không cần tự canh thời điểm reload.
3. Khi quảng cáo xuất hiện, mở lại popup, bấm **Dừng ghi request** và
   **Sao chép chẩn đoán**. Nếu hết 60 giây, dữ liệu đã ghi vẫn có thể sao chép.
4. Có thể bấm **Xóa bản ghi request** để xóa ngay.

Chẩn đoán gồm trạng thái mạng có hiệu lực, số rule chặn, domain/loại đường dẫn,
loại request, client/source/tier đã giới hạn giá trị và sự hiện diện của oad/adformat.
Không giữ query đầy đủ, ID video, chữ ký stream, cookie, header hay response body.
Chỉ ghi tab đã chọn sau khi bấm nút, tối đa 60 giây, giữ 200 request gần nhất trong
storage.session; droppedRequests cho biết số request cũ bị loại khỏi bộ đệm.
Bản ghi được xóa khi đóng tab, reload extension hoặc tắt trình duyệt.

adAtObservation là trạng thái player lúc lấy mẫu sau request, không phải bằng chứng
request đó là quảng cáo (player có thể tải trước nội dung/quảng cáo). blockedByClient
chỉ mô tả lỗi Chrome trả về, không khẳng định extension nào đã chặn.
Dùng domain/path và dấu hiệu URL so sánh quảng cáo/nội dung trước khi viết rule mới;
không chặn cả CDN chỉ vì có request phát sinh trong lúc quảng cáo.

Script MAIN không có quyền Chrome, không gửi body/cookie cho background và không có
remote code/eval. Cầu nối DOM chỉ truyền công tắc lọc; website có thể nhìn thấy hoặc
can thiệp hành vi trong MAIN world. Không dùng cầu nối này cho bí mật hay thao tác
cấu hình extension có quyền cao.

## Kiến trúc source

```text
src/background.js         Đọc cấu hình, cập nhật DNR, tuần tự hóa thao tác lưu
src/core/settings.js      Validate schema, domain, import/export
src/core/network.js       Biên dịch rule DNR + ngoại lệ
src/core/youtube-json.js  Lọc JSON thuần, không sửa dữ liệu phát video
src/content/              DOM engine, detector từng website, bridge MAIN world
src/ui/                   Popup và trang cài đặt tiếng Việt
src/config/defaults.js    Domain/selector mặc định để mở rộng
scripts/                  Build bundle, tạo icon PNG, đóng gói ZIP
tests/                    Unit tests và Chromium extension tests
```

Cách quan sát DOM tham khảo trực tiếp `YoutubeBrowser.js` của `my-grandpa-app`.
Source hiện tại ở app đó dọn giao diện và theo dõi thay đổi DOM; project mới không
sao chép các thao tác ẩn nút Like/Share/Subscribe hay phần phát video native của app.

Sau khi sửa source, chạy `npm run build`, bấm **Reload** tại `chrome://extensions`
và tải lại các tab. Đổi bundle không tự cập nhật script đã nằm trong tab cũ.

## Quyền và dữ liệu

- `declarativeNetRequestWithHostAccess`: chặn request trên host được cấp quyền.
- Host access HTTP/HTTPS: cần cho lọc nội dung trên các website người dùng mở.
- `storage`: lưu cấu hình cục bộ và bản ghi chẩn đoán tạm trong session.
- `scripting`: đăng ký sớm hook JSON theo công tắc và ngoại lệ đã lưu; không tự Skip/tua.
- `webRequest`: quan sát request khi người dùng bật ghi 60 giây trên một tab YouTube;
  không dùng quyền webRequestBlocking và không tự thay đổi rule theo trạng thái player.

Không có analytics, server nền hay remote script. Bản ghi request chỉ có khi người dùng bật chẩn đoán. Nội dung
website được đọc/xử lý ngay trên thiết bị. Chrome có thể hiện cảnh báo quyền đọc và
thay đổi dữ liệu trên website khi cài; đây là quyền cần cho DOM filtering.
Không chạy trên `chrome://`, Chrome Web Store, PDF viewer nội bộ và trang bị Chrome
hạn chế. Chrome Android thông thường không cài được extension desktop này.

## Kiểm thử

```bash
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
```

Kiểm thử mở profile Chromium tạm, không dùng profile Chrome cá nhân. Browser tests
load extension thật để kiểm tra DNR chặn request đến HTTP fixture và script DOM trên
các URL fixture Facebook/YouTube/TikTok. URL HTTPS được Playwright fulfill bằng HTML
fixture, không đăng nhập hoặc gửi request tới dịch vụ thật. Kiểm thử không chứng minh
quảng cáo thực tế được chặn hoàn toàn.

Ảnh giao diện options/popup được ghi vào `artifacts/` bởi browser test cuối.
Các quy tắc trang động cần duy trì thêm fixture khi phát hiện DOM/API mới.

## Đóng gói

```bash
npm run package
```

Tạo `artifacts/content-blocking-extension-<version>.zip` và `SHA256SUMS`.
Giải nén ZIP rồi Load unpacked thư mục `extension`. ZIP không phải CRX đã ký và chưa
được phát hành lên Chrome Web Store. Script đóng gói yêu cầu lệnh `zip` (macOS/Linux).

## Tài liệu nền

- [Chrome DNR](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [Content scripts / isolated world](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome MAIN world](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions)
