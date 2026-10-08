export const LANDING_PATHS = Object.freeze({ home: '/', 'neon-classic': '/neon-classic', playground: '/playground' });

export function resolvePage(location) {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' && /^#(?:playground(?:-results)?|custom-neon-text|shop-name)$/.test(location.hash || '')) return 'playground';
  if (path === '/checkout') return 'checkout';
  if (path === '/payment-status') return 'payment-status';
  return Object.keys(LANDING_PATHS).find((source) => LANDING_PATHS[source] === path) || 'not-found';
}

export function normaliseLandingSource(source) {
  return Object.hasOwn(LANDING_PATHS, source) ? source : '';
}
