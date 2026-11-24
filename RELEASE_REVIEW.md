# Chrome Web Store review — 0.1.17

Prepared 21 November 2026. No Dashboard edits, publication, appeal or resubmission performed.

This version retains the player ad-gate hook adapted from XVideos. It is now invoked through an explicit user-configured domain list, empty by default. The linked guide includes adult-site domain references. Do not claim that all functionality on adult websites has been removed, or that this refactor resolves the reviewer decision. Ask the reviewer whether the retained functionality and linked guide are acceptable before resubmission.

## Package

Use `artifacts/leaf-content-guard-0.1.17.zip` for the extension, and `artifacts/webstore-images.zip` for listing assets only. `archive/0.1.15/` is excluded from dist and both ZIPs. Reload tabs after upgrade; the previous persisted XVideos script registration is removed on startup.

## Permission justifications

- storage: Stores language, filtering preferences, user-entered player domains, blocked resource domains, CSS rules and exceptions locally. Optional YouTube diagnostics use session storage.
- scripting: Registers bundled YouTube JSON filtering and a bundled HTML5Player ad-gate hook at document_start in MAIN world. The latter is adapted from the XVideos integration and runs only on user-configured HTTPS domains and subdomains. All executable code is packaged locally. Website exclusions and global/network switches apply.
- declarativeNetRequestWithHostAccess: Blocks identified ad/tracking requests and user-configured resource domains. This version removes the legacy VLXX replacement redirect and adult-site-specific network presets.
- webRequest: Observes optional user-started YouTube network diagnostics, limited to 60 seconds and 200 sanitized entries, stored locally.

## Listing

Upload all four screenshots from each of vi, en and zh-CN and use the matching detailed descriptions. Descriptions explain user-configured player filtering and its limitations without listing adult-site names. Reviewer-facing technical details and the policy guide remain explicit about the retained hook. Shared promotional art is illustrative; screenshots show real settings with reserved example domains. Review Privacy practices, content classification and public policy URL against actual behavior; no classification guarantees approval.

## Reviewer test instructions

Default settings: only YouTube has a registered MAIN-world script; the custom player domain list is empty. No per-adult-site switches or legacy VLXX/Viet69/VNSexTop presets remain. Entering a domain under Player intervention domains registers the bundled HTML5Player hook for that domain and subdomains. The hook modifies `_checkVideoAdsCommon`, when available, to skip pre/post-roll ad checks. It may operate on adult websites; the guide lists reference domains. Unsupported players are untouched. Global/network off, domain removal and website exclusions disable intervention; reload to test startup behavior. No remote code or remote filter list is loaded.

## Validation completed

29 active unit tests and 30 Chromium fixture tests passed. Formatting and diff checks passed. The extension ZIP was compared byte-for-byte with dist, and checked for version 0.1.17, both active MAIN scripts, three locale catalogs, and exclusion of archive/legacy script files. Four localized screenshots per language were generated and dimension/color validated. The policy page passed direct-anchor, language-switching and 375px/1280px layout checks. These results do not prove live-site ad removal or Store approval. The policy changes are local and have not been deployed.

## 0.1.17 follow-up

Player domains also accept whole-site HTTPS patterns, normalized to a bare domain; path-specific patterns are rejected rather than broadened silently. Settings schema 2 migrates schema 1 by retaining current site keys, without enumerating retired platforms. Persisted registrations outside the active script IDs are removed generically. Live inspection confirmed that the configured hook was installed and the player ad-check returned false; actual click-to-play validation was blocked by the site age gate, so live ad-free playback is not confirmed.
