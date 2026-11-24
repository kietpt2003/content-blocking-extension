# Leaf Content Guard — Privacy Policy

Last updated: 22 November 2026

Leaf Content Guard filters recognized advertising requests and advertising elements on websites. This policy applies to Leaf Content Guard version 0.0.1 and describes the extension's local data processing.

## Website processing

To filter advertising, the extension processes the hostname of the current website, page elements and recognized YouTube player/API data locally in the browser. This processing is used for its filtering features. The extension does not upload page content to a developer-operated server or maintain a list of visited pages.

Locally processed data includes the current website hostname/URL used for rule matching, website content read to detect advertising elements, and network request activity during diagnostics explicitly started by you. These correspond to the Web history, Website content and User activity categories disclosed in Chrome Web Store. No browsing-history profile is built and these data are not automatically transmitted outside the browser.

## Permissions

- `storage`: settings in local storage and optional diagnostics in session storage.
- `declarativeNetRequestWithHostAccess`: advertising/tracking request rules and user-defined blocked domains, applied locally by Chrome.
- `webRequest`: optional diagnostics of request outcomes on the user-selected YouTube tab, limited to 60 seconds and 200 sanitized entries.
- `scripting`: bundled MAIN-world YouTube filtering and compatible-player hooks on configured domains. No remotely hosted code is loaded.
- HTTP/HTTPS host access: rule matching and advertising element detection on websites, including user-defined domains and CSS selectors. Users may disable filtering or exclude websites.

## Settings

The extension stores language preferences, filter switches, website exclusions, custom blocked domains and custom CSS rules in Chrome local storage. These settings remain until you reset them or remove the extension. The extension does not automatically send settings to external servers.

## Optional network diagnostics

When you explicitly start YouTube network diagnostics, the extension observes requests on the selected YouTube tab for up to 60 seconds. It retains at most 200 entries in Chrome session storage, including hostname, recognized path category, request type, limited technical parameters, relative timing, request outcome and observed player-ad state.

Diagnostic reports do not include cookies, passwords, HTTP headers, response bodies, complete playback URLs or full query strings. The extension filters recognized page/API data for playback separately from this diagnostic log; the log does not retain those response bodies.

The log remains locally after recording stops. You can clear it in the popup. It is also cleared when its tab is closed, the extension is reloaded or the browser session ends. It is not automatically uploaded. Using Copy diagnostics explicitly places a report on your clipboard; what you subsequently do with that copy is under your control.

## Sharing and exports

The extension has no analytics SDK, developer-operated backend or automatic diagnostic upload. It does not sell user data, use it for advertising, or transfer it for unrelated purposes or credit decisions. You may explicitly export a settings JSON file or copy diagnostics and choose to share them yourself. Copies and exported files outside extension storage must be managed or deleted by you.

Leaf Content Guard uses data received through Chrome APIs only for its disclosed filtering and diagnostic features and complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## External websites

Websites and video providers you visit may perform their own data processing under their own policies. Their behavior is separate from this extension's local filtering. Blocking rules do not guarantee that every third-party request is blocked.

## User-configured player filtering and guide

Player intervention domains are stored locally with settings and included in settings JSON imports/exports. The list is empty by default. The bundled hook, adapted from the XVideos integration, changes HTML5Player._checkVideoAdsCommon on user-configured HTTPS domains. It does not support every player and may operate on adult websites when configured. Legacy VLXX/Viet69/VNSexTop integrations are archived and excluded from the current package.

The guide linked from settings includes adult-site reference domains and support limitations. It is documentation, not a remotely loaded filter list. Opening it connects the browser to GitHub Pages at your request; the extension does not send settings or diagnostics to the guide.

The policy website uses bundled HTML, CSS, JavaScript and icons. It uses no cookies, localStorage, analytics SDK or automatically loaded third-party resources. GitHub Pages may process connection data under GitHub's own privacy policy.

## Contact

For privacy questions, use the developer contact or Support link shown on the Leaf Content Guard Chrome Web Store listing.
