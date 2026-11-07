# Home Content Blocker — Privacy Policy

Last updated: 7 November 2026

Home Content Blocker filters recognized advertising requests and advertising elements on websites. This policy describes the extension's local data processing.

## Website processing

To filter advertising, the extension processes the hostname of the current website, page elements and recognized YouTube player/API data locally in the browser. This processing is used for its filtering features. The extension does not upload page content to a developer-operated server or maintain a list of visited pages.

## Settings

The extension stores language preferences, filter switches, website exclusions, custom blocked domains and custom CSS rules in Chrome local storage. These settings remain until you reset them or remove the extension. The extension does not automatically send settings to external servers.

## Optional network diagnostics

When you explicitly start YouTube network diagnostics, the extension observes requests on the selected YouTube tab for up to 60 seconds. It retains at most 200 entries in Chrome session storage, including hostname, recognized path category, request type, limited technical parameters, relative timing, request outcome and observed player-ad state.

Diagnostic reports do not include cookies, passwords, HTTP headers, response bodies, complete playback URLs or full query strings. The extension filters recognized page/API data for playback separately from this diagnostic log; the log does not retain those response bodies.

The log remains locally after recording stops. You can clear it in the popup. It is also cleared when its tab is closed, the extension is reloaded or the browser session ends. It is not automatically uploaded. Using Copy diagnostics explicitly places a report on your clipboard; what you subsequently do with that copy is under your control.

## Sharing and exports

The extension has no analytics SDK, developer-operated backend or automatic diagnostic upload. It does not sell user data, use it for advertising, or transfer it for unrelated purposes or credit decisions. You may explicitly export a settings JSON file or copy diagnostics and choose to share them yourself. Copies and exported files outside extension storage must be managed or deleted by you.

## External websites

Websites and video providers you visit may perform their own data processing under their own policies. Their behavior is separate from this extension's local filtering. Blocking rules do not guarantee that every third-party request is blocked.

## Contact

For privacy questions, use the developer contact or Support link shown on the Home Content Blocker Chrome Web Store listing.
