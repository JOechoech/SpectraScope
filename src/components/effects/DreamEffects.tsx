/**
 * DreamEffects - Rotating starfield with violet rain
 * Same starfield as Scope but with purple rain overlay
 */

import { memo, useMemo } from 'react';

export const DreamEffects = memo(function DreamEffects() {
  // Generate random stars (same as Scope)
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

  // Generate rain drops
  const rainDrops = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 1.5}s`,
      height: `${15 + Math.random() * 20}px`,
    }));
  }, []);

  return (
    <>
      {/* Rotating starfield layer (behind rain) */}
      <div className="dream-stars-container" aria-hidden="true">
        <div className="dream-stars">
          {stars.map((star) => (
            <div
              key={star.id}
              className="dream-star"
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
      </div>

      {/* Violet rain layer (on top) */}
      <div className="dream-rain" aria-hidden="true">
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className="rain-drop"
            style={{
              left: drop.left,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
              height: drop.height,
            }}
          />
        ))}
      </div>

      <style>{`
        /* Rotating starfield */
        .dream-stars-container {
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          pointer-events: none;
          z-index: 0;
          animation: dream-orbit 120s linear infinite;
          transform-origin: center center;
        }

        .dream-stars {
          position: absolute;
          inset: 25%;
          width: 50%;
          height: 50%;
          overflow: visible;
        }

        .dream-star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: dream-twinkle ease-in-out infinite;
        }

        @keyframes dream-twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes dream-orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Additional static stars for depth */
        .dream-stars-container::before {
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
            radial-gradient(1px 1px at 35% 85%, rgba(255,255,255,0.35), transparent);
        }

        /* Violet rain */
        .dream-rain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .rain-drop {
          position: absolute;
          top: -30px;
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(139, 92, 246, 0.4) 30%,
            rgba(167, 139, 250, 0.6) 50%,
            rgba(139, 92, 246, 0.4) 70%,
            transparent 100%
          );
          border-radius: 1px;
          animation: rain-fall linear infinite;
        }

        @keyframes rain-fall {
          0% {
            transform: translateY(-30px);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
});

export default DreamEffects;
