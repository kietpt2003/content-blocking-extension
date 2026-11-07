export default {
  extension_name: {
    message: 'Home Content Blocker',
  },
  extension_description: {
    message: '拦截广告域名，过滤 YouTube、Facebook、TikTok 及其他网站的页面元素。',
  },
  options_title: {
    message: '设置 · Home Content Blocker',
  },
  options_tagline: {
    message: '你的规则，保存在你的浏览器中。',
  },
  language_label: {
    message: '语言',
  },
  language_hint: {
    message: '语言更改立即生效，并保存在此浏览器中。',
  },
  protection_heading: {
    message: '防护',
  },
  protection_title: {
    message: '拦截请求与过滤内容',
  },
  enabled_label: {
    message: '启用过滤',
  },
  enabled_hint: {
    message: '扩展程序总开关',
  },
  network_label: {
    message: '拦截域名 / URL',
  },
  network_hint: {
    message: '阻止加载来自广告地址的资源',
  },
  cosmetic_label: {
    message: '隐藏页面元素',
  },
  cosmetic_hint: {
    message: '处理新帖子、滚动加载及单页应用导航',
  },
  website_heading: {
    message: '网站',
  },
  website_title: {
    message: '按平台设置规则',
  },
  xvideos_label: {
    message: '拦截 XVideos 广告',
  },
  vlxx_label: {
    message: '拦截 VLXX 广告',
  },
  viet69_label: {
    message: '拦截 Viet69 广告',
  },
  vnsextop_label: {
    message: '拦截 VNSexTop 广告',
  },
  xvideos_hint: {
    message: '跳过片头及片尾广告。需启用域名 / URL 拦截；更改后请重新加载视频。',
  },
  vlxx_hint: {
    message:
      '适用于 vlxx.app 和 vlxx.phd。需启用域名 / URL 拦截及页面元素隐藏；更改后请重新加载视频。',
  },
  viet69_hint: {
    message:
      '适用于 viet69.be。拦截横幅广告及点击时打开的广告标签页。需启用域名 / URL 拦截及页面元素隐藏；更改后请重新加载页面。',
  },
  vnsextop_hint: {
    message:
      'vnsextop1.pro。拦截横幅广告及点击时打开的广告标签页。需启用域名 / URL 拦截及页面元素隐藏；更改后请重新加载页面。',
  },
  youtube_data_label: {
    message: '实验功能：YouTube JSON',
  },
  youtube_data_hint: {
    message: '过滤已识别的 YouTube 广告数据。如播放出错请关闭；更改后需重新加载页面。',
  },
  website_hint: {
    message:
      '无法保证移除所有视频内广告。Facebook/TikTok 仅隐藏带有已识别广告标记的帖子，不搜索整篇帖子内容。',
  },
  custom_heading: {
    message: '自定义规则',
  },
  custom_title: {
    message: '域名与 HTML',
  },
  custom_domains_label: {
    message: '需要拦截的其他域名',
  },
  custom_domains_hint: {
    message:
      '每行一个域名，规则包含其子域名。请勿输入 https://、路径或通配符。不会阻止主页面导航。',
  },
  custom_cosmetic_label: {
    message: 'HTML 规则',
  },
  custom_cosmetic_hint: {
    message: '格式为 domain##CSS-selector。仅支持简单规则，并非完整的 EasyList 解析器。',
  },
  disabled_sites_label: {
    message: '排除的网站',
  },
  disabled_sites_hint: {
    message: '同时适用于请求和 HTML 过滤。排除规则优先于域名拦截规则。',
  },
  save: {
    message: '保存设置',
  },
  export: {
    message: '导出 JSON',
  },
  import: {
    message: '导入 JSON',
  },
  reset: {
    message: '恢复默认设置',
  },
  loading_settings: {
    message: '正在加载设置…',
  },
  footer: {
    message:
      '不会向服务器发送浏览记录、Cookie 或页面内容。扩展程序仅在已安装它的 Chrome 浏览器中运行，不过滤其他应用。',
  },
  popup_subtitle: {
    message: '浏览器内容过滤',
  },
  popup_enabled_hint: {
    message: '域名与页面内容',
  },
  popup_xvideos_hint: {
    message: '更改后请重新加载视频；需在设置中启用域名 / URL 拦截。',
  },
  popup_vlxx_hint: {
    message: 'vlxx.app / vlxx.phd。更改后请重新加载；需在设置中启用 URL 拦截及页面元素隐藏。',
  },
  popup_viet69_hint: {
    message: 'viet69.be。更改后请重新加载；需在设置中启用 URL 拦截及页面元素隐藏。',
  },
  popup_vnsextop_hint: {
    message: 'vnsextop1.pro。更改后请重新加载；需在设置中启用 URL 拦截及页面元素隐藏。',
  },
  popup_current: {
    message: '当前页面',
  },
  loading_page: {
    message: '正在加载…',
  },
  popup_hidden: {
    message: '已隐藏 {count} 个元素',
  },
  site_disable: {
    message: '暂停过滤此网站',
  },
  site_enable: {
    message: '恢复过滤此网站',
  },
  youtube_diagnostics: {
    message: 'YOUTUBE 诊断',
  },
  loading_filter: {
    message: '正在加载过滤状态…',
  },
  capture_start: {
    message: '记录 60 秒并重新加载标签页',
  },
  capture_stop: {
    message: '停止记录请求',
  },
  capture_clear: {
    message: '清除请求记录',
  },
  copy_diagnostics: {
    message: '复制诊断信息',
  },
  popup_badge_hint: {
    message: '图标上的数字是被拦截的请求数。这里显示的是已隐藏的 HTML 元素数，并非视频内广告数。',
  },
  open_options: {
    message: '打开设置与规则',
  },
  unsupported_page: {
    message: '此页面不支持过滤',
  },
  saved: {
    message: '已保存。HTML 过滤立即更新；已加载的请求或 JSON 数据需重新加载页面。',
  },
  exported: {
    message: '已导出当前保存的设置。',
  },
  imported: {
    message: '已读取文件。点击“保存设置”以应用。',
  },
  reset_confirm: {
    message: '恢复默认过滤设置并删除自定义规则？',
  },
  reset_done: {
    message: '已恢复默认设置。',
  },
  settings_local: {
    message: '设置保存在此 Chrome 浏览器本地。',
  },
  language_saved: {
    message: '已保存语言设置。',
  },
  updated: {
    message: '已更新。',
  },
  site_updated: {
    message: '已更新。如果之前隐藏的内容尚未恢复，请重新加载页面。',
  },
  ads_updated: {
    message: '已更新 {site} 广告拦截。请重新加载视频以完整应用更改。',
  },
  youtube_missing: {
    message: '尚未收到过滤器响应。请重新加载扩展程序，然后关闭标签页并重新打开视频。',
  },
  youtube_json_missing: {
    message: '此标签页尚未运行 JSON 过滤。请检查开关及排除规则，启用后重新加载标签页。',
  },
  youtube_json_off: {
    message: 'JSON 过滤已关闭。网络拦截由其独立设置控制。',
  },
  youtube_old: {
    message: '此标签页正在运行旧脚本。请关闭标签页并重新打开视频。',
  },
  youtube_on: {
    message: '数据过滤已启用。',
  },
  youtube_off: {
    message: '数据过滤已关闭，或此网站已被排除。',
  },
  youtube_counts: {
    message:
      '初始数据修改：{initial}；fetch：{fetchChanged}/{fetchInspected}；XHR：{xhrChanged}/{xhrInspected}。',
  },
  network_on: {
    message: '启用',
  },
  network_off: {
    message: '关闭',
  },
  network_recording: {
    message: '（记录中）',
  },
  network_state: {
    message: '网络拦截：{state}；拦截规则：{rules}；已记录：{requests} 个请求{recording}。',
  },
  capture_started: {
    message: '已在重新加载标签页前开始记录。出现广告时，请停止记录并复制诊断信息。',
  },
  capture_stopped: {
    message: '已停止记录请求。',
  },
  capture_cleared: {
    message: '已清除请求记录。',
  },
  copied: {
    message: '已复制，不包含 Cookie、令牌、视频播放地址或页面内容。',
  },
  error_copy: {
    message: '无法复制：{error}',
  },
  error_get_settings: {
    message: '无法读取设置。',
  },
  error_save_settings: {
    message: '无法保存设置。',
  },
  error_domain_type: {
    message: '域名必须为字符串。',
  },
  error_domain: {
    message: '域名无效：{value}。请输入主机名，不要输入 URL 或通配符。',
  },
  error_domain_limit: {
    message: '{name}：最多 250 个域名。',
  },
  domain_list_excluded: {
    message: '排除列表',
  },
  domain_list_custom: {
    message: '自定义域名',
  },
  error_settings_object: {
    message: '设置必须为 JSON 对象。',
  },
  error_settings_unknown: {
    message: '设置包含不支持的字段。',
  },
  error_schema: {
    message: 'schemaVersion 必须为 1。',
  },
  error_boolean: {
    message: '{field} 必须为布尔值。',
  },
  error_language: {
    message: '不支持的语言。',
  },
  error_sites: {
    message: 'sites 配置无效。',
  },
  error_site_unknown: {
    message: 'sites 中包含不支持的网站。',
  },
  error_site_boolean: {
    message: '网站开关必须为布尔值。',
  },
  error_cosmetic_limit: {
    message: '最多允许 100 条自定义 HTML 规则。',
  },
  error_cosmetic: {
    message: 'HTML 规则需要有效的域名和 CSS 选择器。',
  },
  error_cosmetic_format: {
    message: 'HTML 规则格式必须为 domain##selector：{line}',
  },
  error_css: {
    message: 'CSS 选择器无效：{selector}',
  },
  error_file_size: {
    message: '设置文件大小不得超过 128 KiB。',
  },
  error_json: {
    message: 'JSON 文件无效。',
  },
  error_settings_ui: {
    message: '只有扩展程序设置页面可以更改过滤设置。',
  },
  error_network_ui: {
    message: '只有扩展程序界面可以读写网络诊断信息。',
  },
  error_tab: {
    message: '标签页无效。',
  },
  error_capture_site: {
    message: '仅可在 YouTube 标签页中记录请求。',
  },
};
