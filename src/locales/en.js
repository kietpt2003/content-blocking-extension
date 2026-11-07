export default {
  extension_name: {
    message: 'Home Content Blocker',
  },
  extension_description: {
    message:
      'Block ad domains and filter page elements on YouTube, Facebook, TikTok and other websites.',
  },
  options_title: {
    message: 'Settings · Home Content Blocker',
  },
  options_tagline: {
    message: 'Your rules. Stored in your browser.',
  },
  language_label: {
    message: 'Language',
  },
  language_hint: {
    message: 'Language changes apply immediately and are saved in this browser.',
  },
  protection_heading: {
    message: 'PROTECTION',
  },
  protection_title: {
    message: 'Block requests & filter content',
  },
  enabled_label: {
    message: 'Enable filtering',
  },
  enabled_hint: {
    message: 'Master switch for the extension',
  },
  network_label: {
    message: 'Block domains / URLs',
  },
  network_hint: {
    message: 'Prevent resources from loading from ad addresses',
  },
  cosmetic_label: {
    message: 'Hide page elements',
  },
  cosmetic_hint: {
    message: 'Handle new posts, scrolling and SPA navigation',
  },
  website_heading: {
    message: 'WEBSITES',
  },
  website_title: {
    message: 'Rules by platform',
  },
  xvideos_label: {
    message: 'Block XVideos ads',
  },
  vlxx_label: {
    message: 'Block VLXX ads',
  },
  viet69_label: {
    message: 'Block Viet69 ads',
  },
  vnsextop_label: {
    message: 'Block VNSexTop ads',
  },
  xvideos_hint: {
    message:
      'Skip pre-roll and post-roll ads. Requires domain / URL blocking; reload the video after changing this setting.',
  },
  vlxx_hint: {
    message:
      'Applies to vlxx.app and vlxx.phd. Enable domain / URL blocking and page element hiding; reload the video after changing this setting.',
  },
  viet69_hint: {
    message:
      'Applies to viet69.be. Blocks banners and ad tabs opened by clicks. Enable domain / URL blocking and page element hiding; reload after changing this setting.',
  },
  vnsextop_hint: {
    message:
      'vnsextop1.pro. Blocks banners and ad tabs opened by clicks. Enable domain / URL blocking and page element hiding; reload after changing this setting.',
  },
  youtube_data_label: {
    message: 'Experimental: YouTube JSON',
  },
  youtube_data_hint: {
    message:
      'Filter recognized YouTube ad data. Turn this off if playback fails; reload the page after changing it.',
  },
  website_hint: {
    message:
      'Not all in-video ads can be removed. Facebook/TikTok filtering only hides posts with recognized ad markers; it does not search entire post text.',
  },
  custom_heading: {
    message: 'CUSTOM RULES',
  },
  custom_title: {
    message: 'Domains & HTML',
  },
  custom_domains_label: {
    message: 'Additional domains to block',
  },
  custom_domains_hint: {
    message:
      'One domain per line, including subdomains. Do not enter https://, paths or wildcards. Main page navigation is not blocked.',
  },
  custom_cosmetic_label: {
    message: 'HTML rules',
  },
  custom_cosmetic_hint: {
    message: 'Use domain##CSS-selector. This is a simple subset, not a full EasyList parser.',
  },
  disabled_sites_label: {
    message: 'Excluded websites',
  },
  disabled_sites_hint: {
    message:
      'Applies to request and HTML filtering. Exclusions take priority over blocked domains.',
  },
  save: {
    message: 'Save settings',
  },
  export: {
    message: 'Export JSON',
  },
  import: {
    message: 'Import JSON',
  },
  reset: {
    message: 'Restore defaults',
  },
  loading_settings: {
    message: 'Loading settings…',
  },
  footer: {
    message:
      'Browsing history, cookies and page content are not sent to a server. This extension only runs in the Chrome browser where it is installed; it does not filter other apps.',
  },
  popup_subtitle: {
    message: 'Browser content filter',
  },
  popup_enabled_hint: {
    message: 'Domains and page content',
  },
  popup_xvideos_hint: {
    message:
      'Reload the video after changing this setting; requires domain / URL blocking in settings.',
  },
  popup_vlxx_hint: {
    message:
      'vlxx.app / vlxx.phd. Reload after changing this setting; enable URL blocking and page element hiding in settings.',
  },
  popup_viet69_hint: {
    message:
      'viet69.be. Reload after changing this setting; enable URL blocking and page element hiding in settings.',
  },
  popup_vnsextop_hint: {
    message:
      'vnsextop1.pro. Reload after changing this setting; enable URL blocking and page element hiding in settings.',
  },
  popup_current: {
    message: 'CURRENT PAGE',
  },
  loading_page: {
    message: 'Loading…',
  },
  popup_hidden: {
    message: '{count} hidden elements',
  },
  site_disable: {
    message: 'Pause on this website',
  },
  site_enable: {
    message: 'Resume on this website',
  },
  youtube_diagnostics: {
    message: 'YOUTUBE DIAGNOSTICS',
  },
  loading_filter: {
    message: 'Loading filter status…',
  },
  capture_start: {
    message: 'Record for 60 seconds and reload tab',
  },
  capture_stop: {
    message: 'Stop recording requests',
  },
  capture_clear: {
    message: 'Clear request log',
  },
  copy_diagnostics: {
    message: 'Copy diagnostics',
  },
  popup_badge_hint: {
    message:
      'The icon badge counts blocked requests. This page counts hidden HTML elements, not in-video ads.',
  },
  open_options: {
    message: 'Open settings & rules',
  },
  unsupported_page: {
    message: 'Filtering is not available on this page',
  },
  saved: {
    message:
      'Saved. HTML filtering updates immediately; reload for previously loaded requests or JSON data.',
  },
  exported: {
    message: 'Saved settings exported.',
  },
  imported: {
    message: 'File loaded. Click Save settings to apply.',
  },
  reset_confirm: {
    message: 'Restore default filters and delete custom rules?',
  },
  reset_done: {
    message: 'Defaults restored.',
  },
  settings_local: {
    message: 'Settings are stored locally in this Chrome browser.',
  },
  language_saved: {
    message: 'Language saved.',
  },
  updated: {
    message: 'Updated.',
  },
  site_updated: {
    message: 'Updated. Reload the page if previously hidden content has not returned.',
  },
  ads_updated: {
    message: '{site} ad blocking updated. Reload the video to apply all changes.',
  },
  youtube_missing: {
    message:
      'No filter response yet. Reload the extension, then close the tab and reopen the video.',
  },
  youtube_json_missing: {
    message:
      'JSON filtering is not running on this tab. Check switches/exclusions and reload after enabling it.',
  },
  youtube_json_off: {
    message: 'JSON filtering is off. Network blocking follows its own settings.',
  },
  youtube_old: {
    message: 'This tab is running an old script. Close the tab and reopen the video.',
  },
  youtube_on: {
    message: 'Data filtering is on.',
  },
  youtube_off: {
    message: 'Data filtering is off or this website is excluded.',
  },
  youtube_counts: {
    message:
      'Initial data changes: {initial}; fetch: {fetchChanged}/{fetchInspected}; XHR: {xhrChanged}/{xhrInspected}.',
  },
  network_on: {
    message: 'on',
  },
  network_off: {
    message: 'off',
  },
  network_recording: {
    message: ' (recording)',
  },
  network_state: {
    message:
      'Network blocking: {state}; block rules: {rules}; recorded: {requests} requests{recording}.',
  },
  capture_started: {
    message:
      'Recording started before reloading the tab. When an ad appears, stop recording and copy diagnostics.',
  },
  capture_stopped: {
    message: 'Request recording stopped.',
  },
  capture_cleared: {
    message: 'Request log cleared.',
  },
  copied: {
    message: 'Copied; no cookies, tokens, video playback URLs or page content are included.',
  },
  error_copy: {
    message: 'Could not copy: {error}',
  },
  error_get_settings: {
    message: 'Could not read settings.',
  },
  error_save_settings: {
    message: 'Could not save settings.',
  },
  error_domain_type: {
    message: 'Domain must be a string.',
  },
  error_domain: {
    message: 'Invalid domain: {value}. Enter a hostname, not a URL or wildcard.',
  },
  error_domain_limit: {
    message: '{name}: at most 250 domains.',
  },
  domain_list_excluded: {
    message: 'Exclusion list',
  },
  domain_list_custom: {
    message: 'Custom domains',
  },
  error_settings_object: {
    message: 'Settings must be a JSON object.',
  },
  error_settings_unknown: {
    message: 'Settings contain an unsupported field.',
  },
  error_schema: {
    message: 'schemaVersion must be 1.',
  },
  error_boolean: {
    message: '{field} must be a boolean.',
  },
  error_language: {
    message: 'Unsupported language.',
  },
  error_sites: {
    message: 'Invalid sites configuration.',
  },
  error_site_unknown: {
    message: 'Unsupported website in sites.',
  },
  error_site_boolean: {
    message: 'Website switches must be booleans.',
  },
  error_cosmetic_limit: {
    message: 'At most 100 custom HTML rules are allowed.',
  },
  error_cosmetic: {
    message: 'HTML rules require a valid domain and CSS selector.',
  },
  error_cosmetic_format: {
    message: 'HTML rules must use domain##selector: {line}',
  },
  error_css: {
    message: 'Invalid CSS selector: {selector}',
  },
  error_file_size: {
    message: 'Settings files must not exceed 128 KiB.',
  },
  error_json: {
    message: 'Invalid JSON file.',
  },
  error_settings_ui: {
    message: 'Only the extension settings page can change filters.',
  },
  error_network_ui: {
    message: 'Only the extension UI can access network diagnostics.',
  },
  error_tab: {
    message: 'Invalid tab.',
  },
  error_capture_site: {
    message: 'Requests can only be recorded on a YouTube tab.',
  },
};
