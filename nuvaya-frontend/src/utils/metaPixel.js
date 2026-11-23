const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID || '1500161235314497').trim();
let initialized = false;

export function initMetaPixel() {
  if (typeof window === 'undefined' || !PIXEL_ID || initialized) return;
  initialized = true;

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
}

export function trackMetaPageView() {
  if (typeof window === 'undefined' || !PIXEL_ID) return;
  initMetaPixel();
  window.fbq?.('track', 'PageView');
}

export function trackMetaInitiateCheckout({ value, currency = 'INR', contentIds = [], numItems = 1 }) {
  if (typeof window === 'undefined' || !PIXEL_ID) return;
  initMetaPixel();
  window.fbq?.('track', 'InitiateCheckout', {
    value: Number(value || 0),
    currency,
    content_type: 'product',
    content_ids: contentIds.map(String),
    num_items: numItems,
  });
}

export function trackMetaPurchase({ value, currency = 'INR', contentIds = [], numItems = 1, orderId }) {
  if (typeof window === 'undefined' || !PIXEL_ID) return;
  initMetaPixel();
  window.fbq?.(
    'track',
    'Purchase',
    {
      value: Number(value || 0),
      currency,
      content_type: 'product',
      content_ids: contentIds.map(String),
      num_items: numItems,
    },
    orderId ? { eventID: String(orderId) } : undefined
  );
}
