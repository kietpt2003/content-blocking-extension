# Chrome Web Store review — 0.1.15

Checked 7 November 2026 against the source, built archives, current Developer Dashboard and Chrome documentation. Dashboard access was read-only: no fields were changed, no draft was saved and no submission was made.

## Package and version

- `package.json`, `package-lock.json` and `src/manifest.json` now agree on **0.1.15**. The workspace changed from the initially requested 0.0.15 to 0.1.15 during this audit; that newer edit was preserved.
- The installed Store build is **0.1.14**. Use `artifacts/content-blocking-extension-0.1.15.zip` for this listing. The originally requested `0.0.15.zip` also exists, but cannot update a listing that has published 0.1.14.
- Fixed packaging: `manifest.json` is at the ZIP root, with no wrapping `extension/` directory. Both ZIPs were checked for their declared version, three locale catalogs and required scripts/icons.
- The 0.1.15 ZIP was extracted and loaded in a temporary Chromium profile: version 0.1.15, three UI languages and 21 active DNR rules confirmed.
- 38 unit tests, 35 browser tests, format check and diff check pass. No new permissions were added. No `eval()` / `new Function()` was found in packaged JavaScript; remote domain strings are filtering targets, not remotely loaded extension logic.

## Required Dashboard updates

These are **Developer Dashboard fields**, not additions to `manifest.json`. Select Home Content Blocker, make the changes below and use Save draft before Submit for review.

| Location | Current state observed | Action for this release |
| --- | --- | --- |
| Privacy → Privacy policy URL | Empty | Publish `docs/privacy-policy.md` at a publicly accessible URL that you control, review it for your support details, then enter that URL. A local Markdown path is not a public policy URL. |
| Privacy → Data usage | All nine data categories unchecked | Reassess these declarations. Website content is read/processed by DOM and YouTube JSON filtering; User activity includes the optional network-monitoring diagnostic. Disclose these uses even though processing/storage is local. The extension does not maintain a visited-page history list; explain the limited hostname/request metadata rather than claiming it handles no user data. |
| Privacy → scripting justification | Describes YouTube only | Include the bundled XVideos MAIN-world hook as well. Suggested replacement below. |
| Privacy → declarativeNetRequestWithHostAccess | Describes blocking only | Explain the narrow redirect to bundled `vlxx-no-ads.js`, in addition to ad blocking. Suggested replacement below. |
| Privacy → storage justification | Does not name language preference | Recommended clarification: include UI language alongside filter preferences and local diagnostics. |
| Store listing → Mature content | **Off** | Enable it for the adult-site integrations in this build. This is not a guarantee of approval: an extension whose primary purpose is enhancing pornographic sites can still be rejected. Do not conceal or misrepresent these features. |
| Store listing → Description | Vietnamese only, currently “Hỗ trợ sàn lọc domain HTML, video” | Replace with an accurate description of actual filtering and limitations. After uploading the new package, provide descriptions for Vietnamese, English and Simplified Chinese. Drafts below. |
| Store listing → Screenshots | Two existing screenshots | Update screenshots to match the new settings/language UI. Three 1280×800 RGB PNGs are prepared under `artifacts/release-0.1.15/store-listing/`. |

Already appropriate: the four permission declarations and broad HTTP/HTTPS host scope remain unchanged; **No, I am not using remote code** remains accurate; all three limited-use certifications are checked. The broad host-access field already explains arbitrary user-defined domains/CSS rules. The single-purpose description still accurately describes website ad filtering.

Optional Test instructions are drafted below. Category, support/homepage links, developer identity and distribution were not changed. Uploading/publishing a policy or editing Dashboard fields still needs to be done; this audit did not perform those external changes.

## Permission text ready to paste

### Privacy → storage justification

Used to save the UI language, filter preferences, website exceptions, custom blocked domains and custom CSS rules locally in chrome.storage.local. chrome.storage.session stores temporary, user-initiated YouTube network diagnostics. Settings and diagnostics are not automatically transmitted to external servers.

### Privacy → declarativeNetRequestWithHostAccess justification

Used to block identified advertising and tracking requests according to built-in filters, custom domain rules and website exceptions. One narrowly scoped rule redirects a VLXX advertising-schedule script to a bundled empty-schedule replacement so the original video player can initialize without advertisements. It does not redirect normal navigation or content media to another service.

### Privacy → scripting justification

Used to register, update and unregister bundled scripts at document_start in the MAIN world. The optional YouTube JSON hook removes identified advertising metadata; the XVideos hook disables the native player's advertising gate. Registration follows the enabled filter settings and website exceptions. All injected JavaScript is included in the extension package; no remote executable code is fetched.

## Store descriptions

Use the locale selector in **Store listing** after uploading the localized package. The bundled `_locales` catalogs do not replace these detailed descriptions.

### Vietnamese

Home Content Blocker giúp chặn các request quảng cáo/tracking đã nhận diện và ẩn thành phần quảng cáo trên website. Có bộ lọc cho YouTube, Facebook, TikTok cùng các quy tắc theo website, bao gồm tích hợp với một số website dành cho người lớn.

Bạn có thể bật/tắt bộ lọc, bỏ qua từng website, bổ sung domain hoặc CSS selector và chọn tiếng Việt, tiếng Anh hoặc tiếng Trung giản thể. Cấu hình được lưu trên trình duyệt của bạn.

Tính năng chẩn đoán mạng YouTube chỉ hoạt động khi bạn chủ động bật, trong tối đa 60 giây, với tối đa 200 mục metadata request đã rút gọn lưu trong phiên trình duyệt. Extension không tự gửi cấu hình, nội dung trang hoặc bản ghi chẩn đoán lên máy chủ. Bạn có thể chủ động sao chép hoặc xuất dữ liệu để tự lưu/chia sẻ.

Các bộ lọc phụ thuộc cấu trúc website và không bảo đảm chặn mọi quảng cáo trong video. Có thể cần tải lại trang sau khi đổi cấu hình. Extension không lưu trữ hoặc cung cấp nội dung video; không phải sản phẩm chính thức của các website được hỗ trợ.

### English

Home Content Blocker blocks recognized advertising/tracking requests and hides advertising elements on websites. It includes filters for YouTube, Facebook and TikTok, plus site-specific rules, including integrations with some adult-oriented websites.

Enable or disable filtering, exclude individual websites, add custom domains or CSS selectors, and choose Vietnamese, English or Simplified Chinese. Settings are stored in your browser.

Optional YouTube network diagnostics run only when you start them, for up to 60 seconds, retaining at most 200 sanitized request-metadata entries in browser session storage. The extension does not automatically upload settings, page content or diagnostic logs. You may explicitly copy or export information to save or share it yourself.

Filters depend on website structure and do not guarantee removal of every in-video ad. Reloading may be required after settings changes. The extension does not host or provide video content and is not an official product of supported websites.

### Simplified Chinese

Home Content Blocker 拦截已识别的广告和跟踪请求，并隐藏网站上的广告元素。它包含 YouTube、Facebook、TikTok 过滤规则及特定网站规则，其中包括与部分成人网站的集成。

你可以启用或暂停过滤、排除个别网站、添加自定义域名或 CSS 选择器，并选择越南语、英语或简体中文。设置保存在你的浏览器中。

可选的 YouTube 网络诊断仅在你主动启动后运行，最长 60 秒，并在浏览器会话存储中保留最多 200 条经过精简的请求元数据。扩展程序不会自动上传设置、页面内容或诊断记录。你可以主动复制或导出信息，自行保存或分享。

过滤效果依赖网站结构，无法保证移除所有视频内广告。更改设置后可能需要重新加载页面。本扩展程序不托管或提供视频内容，也不是所支持网站的官方产品。

## Test instructions draft

No account is needed to open the extension popup or settings. Open Settings and change Language between Vietnamese, English and Simplified Chinese; the choice is saved immediately and is shared with other open extension UI pages. Test the master switch, network/cosmetic switches, per-site switches and website exclusions. Reload the target page after changes.

YouTube JSON filtering is optional and can be disabled independently. The popup's network recording is opt-in, restricted to the selected YouTube tab, and limited to 60 seconds/200 sanitized entries. It can be stopped and cleared. All executable logic and the VLXX advertising-schedule replacement are bundled. The extension also includes adult-site integrations exposed by the per-site settings; it does not host media or provide navigation/discovery links to those sites. Website behavior may vary, so this release does not claim to remove every in-video advertisement.

## Official references checked

- [Preparing a package and ZIP root](https://developer.chrome.com/docs/webstore/prepare)
- [Update version and changed listing fields](https://developer.chrome.com/docs/webstore/update)
- [Localized listings and Mature content field](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Permission, remote-code and data declarations](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Local-only handling still needs disclosure and a privacy policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Adult-site integrations and limits of Mature classification](https://developer.chrome.com/docs/webstore/troubleshooting#pornographic-content)
