/**
 * ScopeEffects - Starfield with twinkling stars
 * Like flying through space
 */

import { memo, useMemo } from 'react';

export const ScopeEffects = memo(function ScopeEffects() {
  // Generate random stars
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
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
    <div className="scope-stars" aria-hidden="true">
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
      <style>{`
        .scope-stars {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
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

        /* Slow drift animation for background stars */
        .scope-stars::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 30% 40%, rgba(255,255,255,0.3), transparent),
            radial-gradient(2px 2px at 50% 10%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 85% 80%, rgba(255,255,255,0.3), transparent);
          animation: stars-drift 60s linear infinite;
        }

        @keyframes stars-drift {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-100px);
          }
        }
      `}</style>
    </div>
  );
});

export default ScopeEffects;
