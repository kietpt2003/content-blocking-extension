// The site's constructor is assigned before its prototype is populated. Patch
// when it is read for construction, so the ad gate exists before initPlayer.
export function installXVideosAdGate(target) {
  let enabled = true;
  const wrappers = new WeakSet();
  function patch(constructor) {
    const prototype = constructor?.prototype;
    const original = prototype?._checkVideoAdsCommon;
    if (typeof original !== 'function' || wrappers.has(original)) return;
    const wrapper = function (...args) {
      return enabled ? false : Reflect.apply(original, this, args);
    };
    try {
      prototype._checkVideoAdsCommon = wrapper;
      wrappers.add(wrapper);
    } catch {
      // A future player may seal its API; the narrow network rule still applies.
    }
  }
  const descriptor = Object.getOwnPropertyDescriptor(target, 'HTML5Player');
  if (!descriptor || (descriptor.configurable && 'value' in descriptor)) {
    let constructor = descriptor?.value;
    Object.defineProperty(target, 'HTML5Player', {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      get() {
        patch(constructor);
        return constructor;
      },
      set(value) {
        constructor = value;
      },
    });
  } else patch(target.HTML5Player);
  return (value) => {
    enabled = value === true;
  };
}
