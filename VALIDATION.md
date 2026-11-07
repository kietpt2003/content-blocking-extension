# Bổ sung VNSexTop — 07/11/2026 (giữ version 0.1.14)

- Đã đọc HTML và DOM trực tiếp trên tab `vnsextop1.pro` đang mở. Banner đầu trang
  nằm trong `.hiadu`; banner nổi `.catfish-image` chứa iframe `__clb-spot_...`.
  Không ẩn `#wrapper` vì nó cũng chứa header, main, footer và nội dung website.
- Chặn subresource từ bốn host quảng cáo đã quan sát: `driverhugoverblown.com`,
  `astronautlividlyreformer.com`, `earmuffpostnasalrisotto.com`, `thickteaching.com`.
  Initiator giới hạn `vnsextop1.pro`, không chặn main_frame hoặc website khác.
- Công tắc riêng `sites.vnsextop` mặc định true ở popup/options; cấu hình cũ giữ
  lựa chọn website trước đó. Ngoại lệ domain được ưu tiên. Giữ thư viện site,
  HLS/DPlayer và iframe provider `b.dfplayer.cc`.
- Mẫu Chromium thật có extension: trang chủ chặn 4 request nguồn quảng cáo,
  0 quảng cáo tải thành công, 0 banner hiển thị. Bấm link clip từ trang chủ:
  tổng 8 request quảng cáo bị chặn, 0 popup, 0 banner hiển thị, iframe player
  vẫn có trong DOM. Không lưu ảnh hoặc video.
- Giới hạn: provider `b.dfplayer.cc` không nạp được trong mẫu không có extension
  và mẫu có extension; mẫu cuối ghi nhận `net::ERR_BLOCKED_BY_RESPONSE`.
  Không sửa chính sách frame của nhà cung cấp hoặc coi click fixture là bằng chứng
  phát clip thật/đã chặn hết quảng cáo trong video.
- Unit suite: 34/34; browser suite: 33/33; format check đạt. Fixture bao phủ
  bật/tắt qua options/popup, khôi phục banner, ngoại lệ domain, giới hạn website,
  giữ wrapper/nội dung và click player iframe. Regex kiểm tra giữ đường dẫn player
  và không khớp hostname giả dạng.
- Đã nạp lại extension và tải lại tab trang chủ thật của người dùng, khôi phục
  vị trí cuộn. `.hiadu` và `.catfish-image` đều display=none, height=0, marker
  vnsextop; 0 banner hiển thị, 0 iframe quảng cáo; 32 thẻ nội dung và wrapper
  vẫn hiện. Bản build đã đóng gói vào ZIP 0.1.14.

# Bổ sung Viet69 — 07/11/2026 (giữ version 0.1.14)

## Banner còn sót dưới video trong tab người dùng

- Đã kiểm tra trực tiếp tab Viet69 ẩn danh mà người dùng đang mở: vùng
  `.app-ad.app-ad--related-before` cao khoảng 257 px, chứa iframe
  `__clb-spot_1926112_qts_1_container` cao 250 px. Đây là nguồn quảng cáo khác
  ba script vietadx đã xử lý, không phải vùng player.
- Trang nạp `https://vertigovitalitywieldable.com/bn.js`; iframe chứa ảnh cùng
  hostname. Bổ sung rule cho subresource từ domain này, chỉ initiator Viet69;
  giữ điều hướng main_frame và các website khác. Thêm `.app-ad` vào bộ selector
  riêng Viet69, không áp dụng selector này cho VLXX.
- Kiểm thử bổ sung bao phủ iframe/banner cũ, slot được thêm muộn, khôi phục khi
  tắt Viet69, đổi class tái sử dụng, không ẩn player/nội dung và không chặn trên
  VLXX. Unit suite: 32/32, browser suite: 32/32, format check đạt.
- Đã nạp lại extension và tải lại đúng tab người dùng (video đang dừng ở giây 0).
  Kiểm tra DOM thật sau cập nhật: slot related-before có display=none, height=0,
  marker `data-content-blocker-hidden=viet69`, 0 iframe quảng cáo còn hiển thị.
  Video vẫn hiện kích thước khoảng 598 x 336 px, readyState=4, paused=true, time=0.

- Đã kiểm tra HTML trang chủ/trang clip, request và mã script quảng cáo công khai.
  Nguồn quảng cáo là `cdn2.vietadx.net/v/v-main-adx.js`, `v-top-adx.js` và
  `v-underplayer-adx.js`; script main cài các handler click/popunder, banner preload
  và catfish. Các container dùng cùng ID/class với bộ lọc VLXX hiện có.
- Quy tắc mới chỉ chặn ba script này, loại script, initiator `viet69.be`.
  Không chặn CDN giao diện `cdn.viedn.net`, API `get.video.php`, thư viện player
  hoặc iframe `emb.cd-vs.com`. DOM chỉ nhận diện container trên domain Viet69.
- Công tắc **Chặn QC Viet69** có ở popup/options, mặc định true, cấu hình cũ
  giữ lựa chọn website khác. Tải lại sau khi đổi; ngoại lệ domain được ưu tiên.
- Kiểm tra trực tiếp trong Chromium tạm với extension thật: 3 request quảng cáo
  bị chặn, 0 script quảng cáo tải thành công, 0 popup và 0 banner top/underplayer/
  preload/catfish nhìn thấy. API player trả 200 và iframe vẫn được nạp.
- Giới hạn: cả mẫu chưa dùng extension và mẫu có extension đều không tạo video
  trong iframe sau khi bấm cover. Đã thử hai nút server của trang (cùng provider).
  Mẫu có extension ghi nhận `jwplayer is not defined` và lỗi gọi kết quả console.log
  như hàm từ script inline của trang. Không sửa lỗi player/anti-debug của website
  hoặc khẳng định đã chặn mọi quảng cáo trong video khi chưa phát được clip thực.
- `npm test`: 31/31; `npm run check`: đạt; browser suite: 31/31. Fixture mới kiểm tra
  click trong iframe, script quảng cáo, banner, công tắc options/popup, lưu cấu hình,
  ngoại lệ domain và không áp dụng rule Viet69 cho website khác.

# Bổ sung VLXX — 07/11/2026 (giữ version 0.1.14)

- Đã kiểm tra HTML, request AJAX và iframe trên trang thật. `vlxx.phd` trả 301 sang
  `vlxx.app`. Player AJAX nhúng `play.vlstream.net`, dùng JW Player và
  `embed-vast.js`; script này chờ `funcGetvastAdx()` rồi mới gọi `setup`.
- Chặn chính xác script `/vlxx/vl-top-adx.js`, `vl-underplayer-adx.js`,
  `vl-main-adx.js` trên `cdn.adxcontent.com` để ngăn banner và popunder/click hijack.
  Thay `vl-inplayer-adx.js` bằng tài nguyên extension cấp lịch rỗng, COUNT_VAST=0
  và callback ready không tạo banner. Không chặn script khởi tạo player hoặc nguồn HLS.
  Quy tắc dự phòng chặn `/vlxx/tvc/*.xml` theo loại XHR và initiator đã quan sát.
- DOM chỉ ẩn các vùng quảng cáo đã nhận diện trên hai domain VLXX. Công tắc
  **Chặn QC VLXX** mặc định bật ở popup/options; tắt công tắc hoặc thêm ngoại lệ
  khôi phục cả request lẫn DOM sau khi tải lại trang, kể cả iframe con.
- Thử bản build cuối trong Chromium tạm, hai clip có đường dẫn khác nhau qua
  `vlxx.app` và `vlxx.phd` (trang đích cuối đều là `.app`), bấm nút Play JW Player:
  lịch rỗng, COUNT_VAST=0, cấu hình nguồn khớp `__SRC`, state=playing,
  readyState=4, thời gian phát tăng trên 3 giây, 0 popup, 0 banner trong player,
  0 banner top/preload/catfish nhìn thấy và 0 response thành công từ script quảng cáo.
  Chưa kiểm tra mọi clip, server dự phòng, thiết bị hoặc sự thay đổi domain tương lai.
- `npm test`: 29/29; `npm run check`: đạt; browser suite: 30/30. Fixture VLXX
  kiểm tra redirect sang script extension thật trong iframe, player khởi tạo
  không bị kẹt, giữ nguồn nội dung, banner, chặn VAST, công tắc popup và ngoại lệ
  website trên cả `.app` và `.phd`. Không tải quảng cáo thật trong fixture.
- Script thay thế được build/đóng gói cùng extension và chỉ khai báo web-accessible
  cho hai domain VLXX cùng iframe provider đã quan sát. Không cần quyền mới.

# Bổ sung XVideos — 07/11/2026 (giữ version 0.1.14)

## Công tắc Chặn QC XVideos

- Có công tắc riêng ở popup và trang cài đặt, lưu qua `sites.xvideos`.
  Cấu hình cũ được bổ sung mặc định `true` và giữ các lựa chọn website khác.
- Công tắc chi phối đăng ký hook MAIN, trạng thái hook trong tab đã mở và quy tắc
  ngoại lệ DNR cho `xvideos.com`. Tải lại clip sau khi đổi để áp dụng đầy đủ.
- `npm test`: 27/27; browser suite: 29/29; format check và package đạt.
  Browser test mới thao tác công tắc options/popup, tải lại trang để kiểm tra lưu
  trạng thái, xác nhận hook và request VAST thực sự đổi từ blocked sang allowed
  rồi blocked. Không gửi request quảng cáo thật; endpoint được đáp bằng fixture.

## Kiểm tra lại theo thao tác bấm Play

- Người dùng báo quảng cáo vẫn xuất hiện khi bấm xem clip. Lần kiểm tra trước
  gọi `video.play()` trực tiếp nên không chứng minh luồng bấm Play của player.
- Kiểm tra Chrome thực tế: bản UNPACKED từ `dist/extension` đã được nạp và bật,
  bản Store đã tắt, nhưng bản UNPACKED có `incognitoAccess.isActive=false`.
  Đã bật quyền ẩn danh cho đúng bản UNPACKED; đọc lại xác nhận `isActive=true`.
- Mở trang clip mới trong tab ẩn danh người dùng và bấm `#anc-tst-play-btn`:
  video gốc phát, thời gian tăng, `readyState=4`, không có request VAST.
  Sau đó kiểm tra thêm 4 ID clip khác nhau ngay trong tab này: cả 4 bấm Play
  phát được nội dung, thời gian tăng quá 4 giây, `readyState=4`, 0 request VAST
  và không thấy phần tử skip/pre-roll/video-ad trong player. Tạm dừng khi kết thúc.
- Chromium tạm cũng thử nút Play qua 4 clip khác nhau với bản sửa: 4/4 phát,
  hook có mặt và 0 request VAST. Phiên đối chứng tắt Network cũng không nhận
  quảng cáo, vì vậy không dùng đối chứng này để khẳng định tái hiện được chu kỳ
  quảng cáo. Không thay mã blocker chỉ dựa trên một lần người dùng báo còn quảng cáo.

## Kết quả lần kiểm tra đầu

- Đã đọc DOM, script player và resource timing trên tab ẩn danh người dùng chỉ định.
  Quan sát request quảng cáo `s.pemsrv.com/v1/vast.php`. Mã player công khai có
  `nbView_increment`, xét `(1 + nbView_getNbView()) % 2` để quyết định pre-roll.
- Bản Chrome Web Store đang cài có quyền ẩn danh chưa bật. Không sửa bản cài Store
  hoặc tự nhận bản sửa đã được áp dụng vào tab Chrome cá nhân.
- Bản sửa dùng MAIN hook trước constructor; `_checkVideoAdsCommon` trả false khi
  bật lọc Network. Không sửa bộ đếm trong cookie/localStorage hoặc thay URL media.
- Kiểm tra trực tiếp cùng trang phát đã mở bằng Chromium tạm, extension build thật,
  ba lượt tải cùng clip: cả ba có hook, 0 request VAST, HLS tải bình thường, video
  `readyState=4`, `paused=false`, thời gian phát tăng. Không lưu hình ảnh hoặc video.
  Đây là một clip/phiên kiểm tra, chưa chứng minh mọi clip, tài khoản hoặc CDN.
- `npm test`: 26/26; `npm run check`: đạt; browser suite: 28/28. Fixture mới kiểm tra
  hook chạy trước script player, giữ nguồn nội dung, bật/tắt Network trong trang đang
  mở và ngoại lệ domain khi tải trang mới.
- Chromium kiểm thử được tải vào `/private/tmp/content-blocker-playwright` vì máy
  chưa có bản browser đúng với Playwright. Lệnh chạy:
  `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/content-blocker-playwright npm run test:browser`.

# Kết quả bản 0.1.14 — 31/10/2026

## Tốc độ khởi phát YouTube trên Chrome/profile người dùng

Đo bằng probe tạm trên tab YouTube tắt tiếng, cùng profile/cấu hình JSON đang bật.
Chỉ ghi thời gian sự kiện, host/path API và media, kích thước, trạng thái phát;
không lưu ID video/playlist, token, cookie hoặc nội dung response. Mốc đo ở
startup của document/yt-navigate-start, kết thúc khi video phát sự kiện playing;
không phải phép đo mọi mạng/tài khoản hay đầy đủ thời gian trước khi document tải.

Hai mẫu gốc: 5.315 s khi mở và 5.356 s khi Next. Player API trả về sớm, media
khởi động bằng response nhỏ rồi chờ khoảng 4 giây mới yêu cầu chunk có nội dung.
Bộ lọc JSON không có dấu hiệu mất 3–5 giây trong các mẫu này.

Nhánh thử native loadVideoById cùng video/vị trí: 1.855 s. Khi thêm điều kiện
onSnackbarMessage=1 và còn readyState=0, mẫu thử đạt 2.006 s. Mã chính thức
0.1.14 đo được 2.162 s và startupRecoveries=1, probe chỉ đo không tự phục hồi.
Các mẫu tải bình thường sau đó: 0.987 / 1.241 / 1.031 s, startupRecoveries=0;
không quy toàn bộ khác biệt của các mẫu không bị gián đoạn cho bản sửa.

Cơ chế chỉ thực hiện một lần mỗi lần điều hướng khi chưa nhận metadata sau
700 ms, video vẫn yêu cầu phát, phản hồi OK và có SABR stream. Giữ vị trí bắt đầu,
không thao tác Skip/tua, không đổi playbackRate. Bỏ qua Pause, video đã nhận metadata,
mid-playback buffering, ad-showing, livestream, lỗi/quyền đăng nhập và stale navigation.
Phụ thuộc công tắc JSON YouTube; không tự bật JSON nếu người dùng đã tắt.

Native loadVideoById xóa queue. Chỉ phục hồi playlist khi có đủ dữ liệu/API setter;
kiểm tra lại trong 5 giây vì response /next đến muộn có thể xóa queue đã khôi phục.
Thử trực tiếp xác nhận setter native có hiệu lực bất đồng bộ. Các mẫu tải bình thường
cuối xác nhận native playlist khớp URL, index=0, playbackRate=1, paused=false.
Race /next xóa queue lần nữa được kiểm chứng bằng unit test; chưa bắt lại được
mẫu gián đoạn tự nhiên sau lần chỉnh cuối cửa sổ theo dõi playlist.

Một guard so sánh cả URL ban đầu đã được sửa: YouTube tự bỏ tracking/autoplay
parameters, nên so sánh đúng video/playlist và hủy khi điều hướng thực sự.

Bằng chứng cục bộ:

- artifacts/youtube-startup-baseline-1.json
- artifacts/youtube-startup-baseline-2.json
- artifacts/youtube-startup-experiment-reload.json
- artifacts/youtube-startup-014-diagnostics.json
- artifacts/youtube-startup-014-after-open.json
- artifacts/youtube-startup-014-after-next-normal.json
- artifacts/youtube-startup-014-normal-open.json
- artifacts/youtube-startup-014-playlist-state.json
- artifacts/youtube-startup-timing-summary.json

Unit tests: 22/22 PASS. Browser fixtures Chromium: 27/27 PASS, bao gồm media WAV
thật phát sau recovery, một lần recovery, Pause thủ công, bật/tắt policy và toàn bộ
nhánh cũ. Format, git diff --check, build/package/ZIP: PASS. Probe và trang tạm
không nằm trong ZIP. Bản đóng gói: artifacts/content-blocking-extension-0.1.14.zip.

---

# Kết quả bản 0.1.13 — 31/10/2026

Bổ sung youtu.be vào NETWORK_DOMAINS để cấu hình hiện có tự nhận quy tắc khi
extension được nạp lại, không cần thêm vào customDomains. Giữ cơ chế hiện có:
chặn tài nguyên trong trang, cho phép điều hướng main_frame; giữ công tắc mạng
và các ngoại lệ. Domain đã có trong customDomains được gộp, không sinh rule trùng.

Unit tests 16/16, format, build, package, git diff --check và kiểm tra rule mặc
định/gộp trùng/tắt mạng: PASS. Chưa kiểm tra request youtu.be trên Chrome thật
trong lần cập nhật này. Bản ZIP: artifacts/content-blocking-extension-0.1.13.zip.

---

# Kết quả bản 0.1.12 — 31/10/2026

- Unit tests: 16/16 PASS; Chromium extension browser tests: 26/26 PASS.
- Format, `git diff --check`, build, package và kiểm tra ZIP: PASS.

## Chẩn đoán trực tiếp “Experiencing interruptions?” trên Chrome/profile người dùng

Sau khi người dùng bật JavaScript from Apple Events, kiểm tra Chrome đang nạp
đúng thư mục dist/extension, phiên bản 0.1.11, enabled/cosmetic/YouTube đều true,
JSON đang bật, không có ngoại lệ domain. Bắt được thông báo thật hiển thị bằng
`snackbar-view-model` bên trong `.ytSnackbarContainerSnackbarContainer`, nằm dưới
`snackbar-container`. Cả snackbar và wrapper có computed display=block; đây là
cấu trúc chưa có trong danh sách surface của 0.1.11.

Bổ sung selector cho wrapper mới và snackbar-view-model, giữ nhận diện text trong
surface. Ẩn cả vùng chứa để không để lại khung chắn thao tác; toast không liên quan
và node tái sử dụng cho Added to queue vẫn hiển thị. Regression test dùng cấu trúc
DOM thật FAIL trên 0.1.11, PASS trên 0.1.12. Có kiểm tra display ban đầu được khôi
phục, tắt/bật lọc HTML và snackbar được thêm muộn.

Đã Reload extension trong Chrome/profile hiện tại và tải lại tab YouTube, lưu và
khôi phục vị trí/trạng thái phát. Xác nhận extension và MAIN script đều 0.1.12.
Mở tab kiểm tra riêng cùng profile, tắt tiếng và chuyển video bằng nút Next thật:
YouTube tự phát sinh lại “Experiencing interruptions?”. Các mẫu observer xác nhận
snackbar-view-model và wrapper Opened/Closed đều display:none !important; video
paused=false, readyState=4 và currentTime tiếp tục tăng. Không chèn snackbar giả
trong lần kiểm chứng trực tiếp này.

Bằng chứng cục bộ chỉ chứa nhãn thông báo, cấu trúc/style DOM và trạng thái phát:

- artifacts/youtube-prompts-011-live-before.json
- artifacts/youtube-prompts-012-live-after.json
- artifacts/youtube-prompts-012-live-version.json

Các tab/file chẩn đoán tạm được dọn; không đưa mã chẩn đoán vào ZIP phát hành.
Kết quả trực tiếp này xác nhận snackbar gián đoạn đã được ẩn trong tình huống quan
sát được; không khẳng định sửa mọi nguyên nhân buffering từ máy chủ. Hai loại
hộp thoại idle/ad blocker còn được kiểm chứng bằng browser fixtures như bản 0.1.11.
Bản đóng gói: artifacts/content-blocking-extension-0.1.12.zip.

---

# Kết quả bản 0.1.11 — 31/10/2026

- Unit tests: 16/16 PASS.
- Browser tests nạp extension thật vào Chromium: 25/25 PASS.
- Format và `git diff --check`: PASS.

## Thông báo và nhắc nhở YouTube

Bổ sung bộ xử lý trong content script, chỉ chạy trên YouTube khi bật lọc HTML
và bộ lọc của website. Không phụ thuộc chế độ JSON thử nghiệm.

- Tự xác nhận “Video paused. Continue watching?” / “Tiếp tục xem?” và gọi phát
  tiếp khi video bị pause cùng lúc nhắc nhở. Không gọi play cho video đã kết thúc
  hoặc player đang ad-showing/ad-interrupting. Giữ Pause thủ công sau khi xử lý.
- Chỉ đọc text trong toast, dialog và các surface riêng của player. Ẩn thông báo
  “Experiencing interruptions?”; giữ toast Saved to playlist/Added to queue,
  bình luận thường và hộp thoại Share.
- Đóng cảnh báo ad blocker qua nút Close/Dismiss nhận diện được; ẩn surface/modal
  nếu không có nút đóng. Không chọn Allow ads hoặc Premium. Chỉ ẩn backdrop và
  mở khóa cuộn khi không có hộp thoại khác đang hiển thị.
- Giữ node để trang hoàn tất lifecycle. Khôi phục style khi tái sử dụng node cho
  nội dung thường, tắt extension/HTML/YouTube hoặc áp dụng ngoại lệ domain.
- MutationObserver xử lý trước lần vẽ tiếp theo khi đã có cấu hình; quét mỗi
  giây để xử lý nút/listener xuất hiện muộn. Không giả lập hoạt động người dùng.

Browser fixtures xác nhận media WAV thật được phát tiếp và currentTime tăng,
Pause thủ công vẫn giữ, điều hướng SPA vẫn xử lý nhắc nhở mới, cùng một dialog
được mở lại vẫn xác nhận được. Có kiểm tra controls tải muộn, nhãn Việt/Anh,
không xác nhận template đang hidden, không chạy trên host khác, khôi phục display,
backdrop và overflow khi có dialog khác.

Chưa tái hiện ba thông báo trong phiên YouTube đăng nhập thực tế của người dùng.
Các kiểm thử trên xác nhận hành vi fixture; ẩn cảnh báo không khắc phục việc máy
chủ từ chối cấp nội dung hoặc buffering do mạng. Autoplay vẫn chịu chính sách
của trình duyệt. Bản đóng gói: artifacts/content-blocking-extension-0.1.11.zip;
Load unpacked: dist/extension.

---

# Kết quả bản 0.1.10 — 25/10/2026

- Unit tests: 16/16 PASS.
- Browser tests nạp extension thật vào Chromium: 19/19 PASS.
- Format, build, package và kiểm tra tên tệp Chrome: PASS.

## Facebook Sponsored cột bên

Kiểm tra trực tiếp trên Chrome/profile của người dùng, không bấm quảng cáo hay
đọc nội dung feed/tin nhắn. Trước sửa: heading Sponsored, hai ảnh/liên kết quảng
cáo, không có phần tử sidebar được bộ lọc đánh dấu. Ảnh quảng cáo từ
scontent.fsgn19-1.fna.fbcdn.net; liên kết có join.elevenlabs.io và l.facebook.com.
Khối không có role=article/FeedUnit nên detector cũ bỏ sót.

Bản sửa tìm heading chính xác trong complementary/RightRail, rồi ẩn wrapper nhỏ
nhất chứa heading và các liên kết có ảnh. Không dùng class x... thay đổi liên tục,
không ẩn toàn bộ sidebar. Khi ảnh tải muộn ở nhánh cạnh heading, observer quét lại
sidebar; khi heading bị tái sử dụng thành mục thường, khôi phục display ban đầu.

Sau nạp 0.1.10 vào cùng Chrome: enabled/cosmetic/facebook đều true,
sponsoredHeadings=1, sponsoredHidden=1, markedSponsored=1, sidebarVisible=1.
Ba mẫu liên tiếp giữ kết quả này. Sidebar thực tế không có heading thường trong
lần quan sát đó; bảo toàn Contacts/Birthdays được xác nhận bằng browser fixtures.

Hai bài thử sidebar thất bại trên bundle cũ và PASS sau sửa. Kiểm thử gồm nhãn
có ký tự zero-width, hai thẻ quảng cáo, Contacts/Birthdays, bài thường dùng chữ
Sponsored, tắt/bật Facebook, ảnh tải muộn và khôi phục section đổi heading.
Đây là lọc HTML cho kiểu sidebar đã nhận diện, không xác nhận chặn mọi quảng cáo
Facebook/feed/Reels ở lớp mạng.

Bằng chứng chỉ có thuộc tính DOM/bộ đếm/hostname, không có nội dung feed:
- artifacts/facebook-sidebar-before.json
- artifacts/facebook-sidebar-after.json

## Kết quả YouTube 0.1.9 được giữ trong 0.1.10

Đã xác định adSlots chứa playerVars.player_response nhúng nguồn quảng cáo ngay
trong HTML đầu trang; nguồn quảng cáo cũng có source=youtube trên googlevideo.com.
Sửa hook JSON khởi động trước bootstrap khi người dùng bật JSON, bỏ việc gửi
DEFAULTS=false lúc cấu hình thật chưa về, thêm get_watch vào matcher và chặn hẹp
/get_midroll_info theo URL trong adBreakServiceRenderer.getAdBreakUrl thực tế.

Trên bundle cũ, bài thử đọc adPlacements ngay cùng inline script và bài get_watch
đều FAIL. Sau sửa cả hai PASS; các trường hợp tắt JSON/YouTube và ngoại lệ không cài
hook sớm cũng PASS.

Đã kiểm tra trong Chrome/profile người dùng: player không ở ad-showing,
adPlacements/adSlots/playerAds của initial response và player response đều bằng 0.
Video pB64u5qBd5g phát tự nhiên từ khoảng 770 đến 782 giây. Sau thao tác bấm một
link đề xuất trong tab thử, RF0jYdTXQK4 phát từ khoảng 9 đến 20 giây, không có ad
trong các mẫu quan sát, không Skip/tua. Người dùng xác nhận YouTube đã hết quảng cáo.

Bằng chứng: artifacts/youtube-profile-ad-analysis.json,
artifacts/youtube-profile-019-playback-check.json,
artifacts/youtube-profile-019-next-video-check.json.
Bản MHTML/HTML thô chứa dữ liệu cá nhân đã xóa ngay sau phân tích theo phạm vi
người dùng cho phép. Tệp/tab chẩn đoán tạm không được đưa vào ZIP phát hành.

## Các kiểm tra trước đó

# Kết quả kiểm tra bản chẩn đoán 0.1.8 — 25/10/2026

Bản 0.1.6 vẫn có quảng cáo trên tài khoản người dùng. Chẩn đoán hiện có chỉ chứa
bộ đếm JSON, chưa có request media. Bản 0.1.7 chưa sửa rule chặn cho quảng cáo trong
ảnh; bổ sung công cụ lấy dữ liệu cần thiết, không khẳng định đã chặn hết quảng cáo.

- Unit tests: 14/14 PASS.
- Browser tests nạp extension thật vào Chromium: 15/15 PASS.
- Format, build và package: PASS.

Tính năng ghi request:

- Chỉ bắt đầu sau thao tác người dùng, chỉ tab YouTube đã chọn, tối đa 60 giây.
- Giữ 200 request gần nhất trong storage.session, có thể dừng hoặc xóa trong popup.
- Dữ liệu đã lọc gồm host, loại path cố định, loại request, một số marker URL được
  giới hạn giá trị, trạng thái player lúc quan sát và outcome của request.
- Không giữ URL/query đầy đủ, video ID, chữ ký stream, cookie, header hay body.
- Giới hạn 60 giây được kiểm tra trước khi nhận event; report hết hạn có unit test.
  Chưa chạy browser test chờ đủ 60 giây hoặc kiểm tra tự phục hồi sau worker restart.
- Browser tests xác nhận opt-in, một tab, stop/clear, bỏ token và nút popup hoạt động.
- Unit tests kiểm tra sanitizer, loại giá trị query/path tùy ý và report hết hạn.

Hồi quy DNR, ngoại lệ, DOM, CSP, JSON/fetch/XHR, nhập/xuất: PASS.
Fixture WAV thật xác nhận không có tự bấm Skip, tua, đổi playbackRate hay gọi play.
Rule mạng vẫn giữ nguyên so với 0.1.6; không chặn toàn bộ googlevideo.com.

Thử thật trên YouTube bằng profile tạm, video aqz-KE-bpKQ:
- Bộ ghi nhận được /videoplayback trên googlevideo.com với client=WEB,
  source=youtube và có request tier=L.
- Nhận được request googleads.g.doubleclick.net/pagead/ bị blockedByClient.
- Không quan sát được adShowing=true; media cuối lần thử time=0, paused=true.
  Vì vậy không dùng lần thử này để khẳng định chặn quảng cáo hay phát thành công.
- Browser/profile tạm đã được đóng/xóa.

Cần người dùng ghi trên đúng tab có quảng cáo thực tế rồi gửi phần network.capture
để đánh giá dấu hiệu có thể phân biệt request quảng cáo/nội dung. adAtObservation
không phải nhãn xác định quảng cáo vì có prefetch; blockedByClient không xác định
extension nào chặn. Không tự tạo rule từ domain chỉ dựa vào thời điểm player có ads.

## Đối chiếu link wUcsujEjnb8 người dùng gửi

Mở trực tiếp https://www.youtube.com/watch?v=wUcsujEjnb8 trong hai profile tạm:
network=true, lần một youtubeData=false và lần hai youtubeData=true. Tiêu đề đều là
Find and Add Citations Fast With Grammarly - YouTube. Sau thao tác Play trong
Chromium, cả hai lần media phát liên tục khoảng 2 đến 16 giây, paused=false,
readyState=4, không có ad-showing/ad-interrupting trong tám lần lấy mẫu mỗi lượt.
Request /videoplayback trên googlevideo.com hoàn tất HTTP 200, client=WEB,
source=youtube; không có marker oad/adformat trong các request media đã ghi.
Đây là phát trực tiếp clip Grammarly do người dùng cung cấp, chưa tái hiện ngữ cảnh
clip đó được chèn làm quảng cáo trong video chính. Không thêm rule chặn domain hoặc
CDN từ kết quả này vì nó chưa phân biệt quảng cáo/nội dung trên request thực tế.

Bằng chứng đã loại token: artifacts/youtube-wUcsujEjnb8-check.json. Cả hai browser
và profile tạm đã đóng/xóa. Cần URL video chính và capture trong đúng ngữ cảnh
quảng cáo chèn để tiếp tục đối chiếu. Không đổi code, phiên bản hay artifact ZIP
trong lượt kiểm tra này.

## Sửa bộ ghi theo capture thực tế người dùng gửi

Capture 0.1.7 cho thấy chặn mạng có hiệu lực, /pagead/ bị blockedByClient.
Các request khi adAtObservation=true chỉ có path=[other], một số có adformat.
Request /videoplayback duy nhất đã ghi ở mốc 8106 ms có adAtObservation=false.
Không có bằng chứng xác định URL media quảng cáo, nên không thêm rule chặn rộng.
DOM video src=blob là URL object nội bộ, không phải domain tải media từ server.

0.1.8 thêm nút Ghi 60 giây và tải lại tab: arm listener, lưu session, rồi reload
đúng tab với bypassCache. Không gọi play hoặc điều khiển player. Trường
startedWithReload trong báo cáo ghi nhận chế độ này. Browser test xác nhận bắt
được request media phát sinh ngay trong script khi trang vừa được reload.
Sanitizer giữ riêng /api/stats/watchtime, /api/stats/playback, /api/stats/qoe,
/ptracking và một số endpoint cố định khác, thay vì gộp các path này thành [other].
Unit test xác nhận path thống kê vẫn bỏ docid và giá trị query tùy ý.

Đã qua 14 unit test và 15 browser test. Chưa có rule giải quyết quảng cáo thực tế
được xác nhận từ log đã cung cấp. Cần capture khởi động trước khi tải media để
tiếp tục phân biệt URL; không coi adformat hay trạng thái player riêng lẻ là bằng
chứng để chặn mọi request tương ứng.
