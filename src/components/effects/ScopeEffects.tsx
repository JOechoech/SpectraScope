/**
 * ScopeEffects - Rotating starfield
 * Like being in orbit in a slowly rotating capsule
 */

import { memo, useMemo } from 'react';

export const ScopeEffects = memo(function ScopeEffects() {
  // Generate random stars
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() > 0.7 ? 2 : 1,
      opacity: 0.3 + Math.random() * 0.7,
      twinkleDelay: `${Math.random() * 5}s`,
      twinkleDuration: `${2 + Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="scope-container" aria-hidden="true">
      <div className="scope-stars">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.twinkleDelay,
              animationDuration: star.twinkleDuration,
            }}
          />
        ))}
      </div>
      <style>{`
        .scope-container {
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          pointer-events: none;
          z-index: 0;
          animation: orbit-rotate 120s linear infinite;
          transform-origin: center center;
        }

        .scope-stars {
          position: absolute;
          inset: 25%;
          width: 50%;
          height: 50%;
          overflow: visible;
        }

        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes orbit-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Additional static stars layer for depth */
        .scope-container::before {
          content: '';
          position: absolute;
          inset: 25%;
          width: 50%;
          height: 50%;
          background:
            radial-gradient(1px 1px at 5% 15%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.4), transparent),
            radial-gradient(2px 2px at 45% 5%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 65% 55%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 85% 25%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 10% 65%, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 75% 75%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 35% 85%, rgba(255,255,255,0.35), transparent),
            radial-gradient(2px 2px at 55% 45%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 95% 65%, rgba(255,255,255,0.4), transparent);
        }
      `}</style>
    </div>
  );
});

export default ScopeEffects;
