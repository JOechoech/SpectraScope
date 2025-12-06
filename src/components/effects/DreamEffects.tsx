import { memo, useMemo } from 'react';

/**
 * DreamEffects - Immersive violet/purple theme effects
 * Features: 3D floating clouds and subtle rain
 */
export const DreamEffects = memo(function DreamEffects() {
  // Generate rain drops with random positions and delays
  const rainDrops = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${1.2 + Math.random() * 0.8}s`,
      height: `${10 + Math.random() * 15}px`,
    }));
  }, []);

  // Generate cloud positions
  const clouds = useMemo(() => [
    { id: 1, className: 'dream-cloud-1', style: { left: '5%', top: '8%' } },
    { id: 2, className: 'dream-cloud-2', style: { right: '10%', top: '5%' } },
    { id: 3, className: 'dream-cloud-3', style: { left: '30%', top: '12%' } },
    { id: 4, className: 'dream-cloud-4', style: { right: '25%', top: '3%' } },
    { id: 5, className: 'dream-cloud-5', style: { left: '60%', top: '15%' } },
  ], []);

  return (
    <>
      {/* Background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 dream-gradient-overlay" />

      {/* Floating clouds layer */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className={`absolute ${cloud.className}`}
            style={cloud.style}
          >
            <svg
              viewBox="0 0 100 50"
              className="w-32 h-16 md:w-48 md:h-24"
              fill="none"
            >
              {/* Cloud shape with blur */}
              <defs>
                <filter id={`blur-${cloud.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>
                <linearGradient id={`cloudGrad-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(167, 139, 250, 0.25)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
                </linearGradient>
              </defs>
              <ellipse cx="30" cy="30" rx="25" ry="15" fill={`url(#cloudGrad-${cloud.id})`} filter={`url(#blur-${cloud.id})`} />
              <ellipse cx="50" cy="25" rx="30" ry="18" fill={`url(#cloudGrad-${cloud.id})`} filter={`url(#blur-${cloud.id})`} />
              <ellipse cx="70" cy="30" rx="22" ry="14" fill={`url(#cloudGrad-${cloud.id})`} filter={`url(#blur-${cloud.id})`} />
            </svg>
          </div>
        ))}
      </div>

      {/* Rain effect layer */}
      <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className="dream-rain-drop"
            style={{
              left: drop.left,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
              height: drop.height,
            }}
          />
        ))}
      </div>

      {/* Top gradient bar overlay */}
      <div className="fixed top-0 left-0 right-0 h-16 pointer-events-none z-[5] dream-top-gradient" />
    </>
  );
});

export default DreamEffects;
