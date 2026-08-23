export const neonIcons = [
  { id: 'none', label: 'Tiada icon' },
  { id: 'love', label: 'Love' },
  { id: 'crown', label: 'Crown' },
  { id: 'moon', label: 'Moon' },
];

export function NeonIcon({ id, className = '' }) {
  if (!id || id === 'none') return null;

  const paths = {
    love: <path d="M32 53C27 47 11 38 11 24C11 15 22 10 32 21C42 10 53 15 53 24C53 38 37 47 32 53Z" />,
    crown: <path d="M10 21Q18 29 24 18Q32 31 40 18Q46 29 54 21L49 47Q32 52 15 47Z" />,
    moon: <path d="M43 11C26 14 17 28 22 41C26 52 39 56 51 49C42 48 34 42 32 34C29 25 34 17 43 11Z" />,
  };

  return <svg className={`neon-icon ${className}`.trim()} viewBox="0 0 64 64" aria-label={`${id} icon`} role="img" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">{paths[id]}</svg>;
}
