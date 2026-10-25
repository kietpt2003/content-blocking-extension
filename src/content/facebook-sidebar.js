export const FACEBOOK_SIDEBAR_ROOT = '[role="complementary"], [data-pagelet^="RightRail"]';
export const FACEBOOK_SIDEBAR_HEADINGS =
  ':is([role="complementary"], [data-pagelet^="RightRail"]) :is(h2, h3, [role="heading"])';
const HEADINGS = 'h2, h3, [role="heading"]';
const AD_LABEL = /^(sponsored|được tài trợ|tài trợ|quảng cáo)$/iu;

function adHeading(element) {
  return AD_LABEL.test(
    (element.textContent || '').replace(/[\u200B-\u200F\u2066-\u2069\uFEFF]/g, '').trim(),
  );
}

export function facebookSidebarAdContainer(heading) {
  if (!heading.matches(HEADINGS) || !adHeading(heading)) return null;
  const sidebar = heading.closest(FACEBOOK_SIDEBAR_ROOT);
  if (!sidebar || heading.closest('[role="article"], [data-pagelet^="FeedUnit_"]')) return null;
  // Find the first shared wrapper of the Sponsored heading and its image links.
  // Stop before the whole sidebar or a neighbouring Contacts/Birthdays section.
  for (let node = heading.parentElement; node && node !== sidebar; node = node.parentElement) {
    if (node.matches('[role="feed"], [role="navigation"], [role="article"]')) return null;
    if (
      [...node.querySelectorAll(HEADINGS)].some(
        (item) => !adHeading(item) && !item.closest('a[href]'),
      )
    )
      return null;
    if (node.querySelector('a[href] img, a[href] [role="img"]')) return node;
  }
  return null;
}

export function isFacebookSidebarAd(element) {
  if (!element.closest(FACEBOOK_SIDEBAR_ROOT)) return false;
  return [...element.querySelectorAll(HEADINGS)].some(
    (heading) => facebookSidebarAdContainer(heading) === element,
  );
}
