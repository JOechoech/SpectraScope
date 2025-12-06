import { memo, useMemo } from 'react';

/**
 * SearchEffects - Fresh green/cyan theme effects
 * Features: Green clouds fading to black at bottom
 */
export const SearchEffects = memo(function SearchEffects() {
  // Generate green cloud positions
  const clouds = useMemo(() => [
    { id: 1, className: 'search-cloud-1', style: { left: '0%', top: '4%' } },
    { id: 2, className: 'search-cloud-2', style: { right: '5%', top: '6%' } },
    { id: 3, className: 'search-cloud-3', style: { left: '20%', top: '2%' } },
    { id: 4, className: 'search-cloud-4', style: { right: '25%', top: '10%' } },
    { id: 5, className: 'search-cloud-5', style: { left: '55%', top: '5%' } },
  ], []);

  return (
    <>
      {/* Background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 search-gradient-overlay" />

      {/* Green clouds layer */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className={`absolute ${cloud.className}`}
            style={cloud.style}
          >
            <svg
              viewBox="0 0 120 60"
              className="w-40 h-20 md:w-52 md:h-26"
              fill="none"
            >
              {/* Cloud shape with blur */}
              <defs>
                <filter id={`search-blur-${cloud.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>
                <linearGradient id={`searchCloudGrad-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.35)" />
                  <stop offset="50%" stopColor="rgba(6, 182, 212, 0.25)" />
                  <stop offset="100%" stopColor="rgba(20, 184, 166, 0.15)" />
                </linearGradient>
              </defs>
              <ellipse cx="35" cy="35" rx="28" ry="16" fill={`url(#searchCloudGrad-${cloud.id})`} filter={`url(#search-blur-${cloud.id})`} />
              <ellipse cx="60" cy="28" rx="32" ry="20" fill={`url(#searchCloudGrad-${cloud.id})`} filter={`url(#search-blur-${cloud.id})`} />
              <ellipse cx="85" cy="35" rx="25" ry="15" fill={`url(#searchCloudGrad-${cloud.id})`} filter={`url(#search-blur-${cloud.id})`} />
            </svg>
          </div>
        ))}
      </div>

      {/* Top gradient bar overlay */}
      <div className="fixed top-0 left-0 right-0 h-16 pointer-events-none z-[5] search-top-gradient" />
    </>
  );
});

export default SearchEffects;
