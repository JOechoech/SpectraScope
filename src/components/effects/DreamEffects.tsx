/**
 * DreamEffects - Subtle violet rain drops falling slowly
 * Very subtle, doesn't obstruct reading
 */

import { memo, useMemo } from 'react';

export const DreamEffects = memo(function DreamEffects() {
  // Generate rain drops with random positions and delays
  const rainDrops = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 1.5}s`,
      height: `${12 + Math.random() * 18}px`,
    }));
  }, []);

  return (
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
      <style>{`
        .dream-rain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .rain-drop {
          position: absolute;
          top: -30px;
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(139, 92, 246, 0.3) 30%,
            rgba(139, 92, 246, 0.5) 70%,
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
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

export default DreamEffects;
