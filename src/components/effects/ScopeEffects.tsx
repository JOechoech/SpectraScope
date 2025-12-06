import { memo, useMemo } from 'react';

/**
 * ScopeEffects - Electric pink/orange theme effects
 * Features: Orange clouds and subtle lightning flashes
 */
export const ScopeEffects = memo(function ScopeEffects() {
  // Generate orange cloud positions
  const clouds = useMemo(() => [
    { id: 1, className: 'scope-cloud-1', style: { left: '0%', top: '5%' } },
    { id: 2, className: 'scope-cloud-2', style: { right: '5%', top: '8%' } },
    { id: 3, className: 'scope-cloud-3', style: { left: '25%', top: '3%' } },
    { id: 4, className: 'scope-cloud-4', style: { right: '20%', top: '12%' } },
    { id: 5, className: 'scope-cloud-5', style: { left: '50%', top: '6%' } },
    { id: 6, className: 'scope-cloud-6', style: { left: '70%', top: '2%' } },
  ], []);

  // Generate lightning bolt positions
  const lightningBolts = useMemo(() => [
    { id: 1, position: 'left', delay: '0s' },
    { id: 2, position: 'right', delay: '3s' },
  ], []);

  return (
    <>
      {/* Background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 scope-gradient-overlay" />

      {/* Orange clouds layer */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className={`absolute ${cloud.className}`}
            style={cloud.style}
          >
            <svg
              viewBox="0 0 120 60"
              className="w-40 h-20 md:w-56 md:h-28"
              fill="none"
            >
              {/* Cloud shape with blur */}
              <defs>
                <filter id={`scope-blur-${cloud.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                </filter>
                <linearGradient id={`scopeCloudGrad-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(251, 146, 60, 0.35)" />
                  <stop offset="50%" stopColor="rgba(249, 115, 22, 0.25)" />
                  <stop offset="100%" stopColor="rgba(234, 88, 12, 0.15)" />
                </linearGradient>
              </defs>
              <ellipse cx="35" cy="35" rx="30" ry="18" fill={`url(#scopeCloudGrad-${cloud.id})`} filter={`url(#scope-blur-${cloud.id})`} />
              <ellipse cx="60" cy="28" rx="35" ry="22" fill={`url(#scopeCloudGrad-${cloud.id})`} filter={`url(#scope-blur-${cloud.id})`} />
              <ellipse cx="85" cy="35" rx="28" ry="16" fill={`url(#scopeCloudGrad-${cloud.id})`} filter={`url(#scope-blur-${cloud.id})`} />
            </svg>
          </div>
        ))}
      </div>

      {/* Lightning flash layer */}
      <div className="fixed inset-0 pointer-events-none z-[3] overflow-hidden">
        {lightningBolts.map((bolt) => (
          <div
            key={bolt.id}
            className={`scope-lightning scope-lightning-${bolt.position}`}
            style={{ animationDelay: bolt.delay }}
          >
            <svg
              viewBox="0 0 30 100"
              className="w-8 h-24 md:w-12 md:h-32"
              fill="none"
            >
              <defs>
                <filter id={`glow-${bolt.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id={`boltGrad-${bolt.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(251, 191, 36, 0.9)" />
                  <stop offset="50%" stopColor="rgba(249, 115, 22, 0.8)" />
                  <stop offset="100%" stopColor="rgba(244, 63, 94, 0.6)" />
                </linearGradient>
              </defs>
              {/* Lightning bolt path */}
              <path
                d="M15 0 L10 35 L18 38 L8 70 L22 45 L14 42 L20 10 Z"
                fill={`url(#boltGrad-${bolt.id})`}
                filter={`url(#glow-${bolt.id})`}
                opacity="0.8"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Telescope lens flare effect - centered at top */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none z-[4]">
        <div className="scope-lens-flare" />
      </div>

      {/* Top gradient bar overlay */}
      <div className="fixed top-0 left-0 right-0 h-16 pointer-events-none z-[5] scope-top-gradient" />
    </>
  );
});

export default ScopeEffects;
