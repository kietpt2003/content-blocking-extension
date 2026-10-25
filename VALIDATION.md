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
