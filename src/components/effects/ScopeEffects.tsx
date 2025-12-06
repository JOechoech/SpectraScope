import { memo, useMemo } from 'react';

/**
 * ScopeEffects - Electric pink/orange theme effects
 * Features: Lightning flashes and electric sparks
 */
export const ScopeEffects = memo(function ScopeEffects() {
  // Generate electric spark particles
  const sparks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: i < 6 ? `${Math.random() * 15}%` : `${85 + Math.random() * 15}%`,
      top: `${20 + Math.random() * 60}%`,
      delay: `${Math.random() * 4}s`,
      size: `${2 + Math.random() * 3}px`,
    }));
  }, []);

  // Generate lightning bolt positions
  const lightningBolts = useMemo(() => [
    { id: 1, position: 'left', delay: '0s' },
    { id: 2, position: 'right', delay: '2s' },
    { id: 3, position: 'left', delay: '4s' },
  ], []);

  return (
    <>
      {/* Background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 scope-gradient-overlay" />

      {/* Electric sparks layer */}
      <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
        {sparks.map((spark) => (
          <div
            key={spark.id}
            className="scope-spark"
            style={{
              left: spark.left,
              top: spark.top,
              animationDelay: spark.delay,
              width: spark.size,
              height: spark.size,
            }}
          />
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
