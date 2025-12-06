/**
 * HomeEffects - Subtle teal/green nebula wisps
 * Like looking into deep space with faint aurora
 */

import { memo } from 'react';

export const HomeEffects = memo(function HomeEffects() {
  return (
    <div className="home-nebula" aria-hidden="true">
      <style>{`
        .home-nebula {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(13, 148, 136, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(16, 185, 129, 0.06) 0%, transparent 40%),
            radial-gradient(ellipse 70% 45% at 50% 80%, rgba(13, 148, 136, 0.05) 0%, transparent 45%),
            radial-gradient(ellipse 50% 35% at 10% 70%, rgba(6, 182, 212, 0.04) 0%, transparent 35%);
          animation: nebula-drift 30s ease-in-out infinite;
        }

        @keyframes nebula-drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          25% {
            transform: translate(10px, -5px) scale(1.02);
            opacity: 0.9;
          }
          50% {
            transform: translate(-15px, 8px) scale(1.05);
            opacity: 1;
          }
          75% {
            transform: translate(5px, -10px) scale(1.03);
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
});

export default HomeEffects;
