const META_PIXEL_ID = '510580329408580';
const TRACKED_EVENTS_KEY = 'yh-meta-pixel-events';
const EVENT_SESSION_KEY = 'yh-meta-pixel-session-id';

const createSessionId = () => {
  const browserUuid = window.crypto?.randomUUID?.();
  return browserUuid || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

const getEventSessionId = () => {
  try {
    const existing = window.sessionStorage.getItem(EVENT_SESSION_KEY);
    if (existing) return existing;
    const sessionId = createSessionId();
    window.sessionStorage.setItem(EVENT_SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return createSessionId();
  }
};

const cleanEventIdPart = (value, maxLength) => String(value || '')
  .replace(/[^a-zA-Z0-9_-]/g, '-')
  .slice(0, maxLength);

const createEventId = (name, key) => [
  'yh',
  cleanEventIdPart(name, 24),
  cleanEventIdPart(key, 42),
  cleanEventIdPart(getEventSessionId(), 28),
].filter(Boolean).join('_').slice(0, 100);

const getTrackedEvents = () => {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(TRACKED_EVENTS_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const rememberEvent = (key) => {
  try {
    const tracked = getTrackedEvents();
    tracked.add(key);
    window.sessionStorage.setItem(TRACKED_EVENTS_KEY, JSON.stringify([...tracked]));
  } catch {
    // Tracking must never interrupt the shopping flow.
  }
};

export function initMetaPixel() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!window.fbq) {
    const fbq = function (...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

export function trackMetaEvent(name, parameters = {}, { eventId = '' } = {}) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (eventId) window.fbq('track', name, parameters, { eventID: eventId });
  else window.fbq('track', name, parameters);
}

export function trackMetaCustomEvent(name, parameters = {}, { eventId = '' } = {}) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (eventId) window.fbq('trackCustom', name, parameters, { eventID: eventId });
  else window.fbq('trackCustom', name, parameters);
}

export function trackMetaEventOnce(key, name, parameters = {}, { custom = false, eventId = '' } = {}) {
  if (typeof window === 'undefined') return;
  const tracked = getTrackedEvents();
  if (tracked.has(key)) return;
  const resolvedEventId = eventId || createEventId(name, key);
  if (custom) trackMetaCustomEvent(name, parameters, { eventId: resolvedEventId });
  else trackMetaEvent(name, parameters, { eventId: resolvedEventId });
  rememberEvent(key);
}

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  return document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix))?.slice(prefix.length) || '';
};

export function getMetaAttribution() {
  if (typeof window === 'undefined') return {};
  const query = new URLSearchParams(window.location.search);
  const fbclid = query.get('fbclid') || '';
  return {
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : ''),
    fbclid,
    utmSource: query.get('utm_source') || '',
    utmMedium: query.get('utm_medium') || '',
    utmCampaign: query.get('utm_campaign') || '',
    utmContent: query.get('utm_content') || '',
    utmTerm: query.get('utm_term') || '',
    landingPage: window.location.href,
  };
}
