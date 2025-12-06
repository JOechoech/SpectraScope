/**
 * WarpAnimation - Enhanced space warp effect with AI arrival announcements
 *
 * Features:
 * - Smaller, more numerous star particles
 * - Sequential AI source arrival announcements
 * - Progress indicators showing which sources have arrived
 */

import { useEffect, useRef, useState, memo } from 'react';

interface WarpAnimationProps {
  isActive: boolean;
  onPhaseChange?: (phase: string) => void;
}

interface AISource {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const AI_SOURCES: AISource[] = [
  { id: 'technical', name: 'TECHNICALS', icon: '📊', color: '#3b82f6', description: 'ANALYZING TECHNICAL INDICATORS...' },
  { id: 'openai', name: 'OPENAI', icon: '🤖', color: '#10b981', description: 'OPENAI SCANNING LATEST NEWS...' },
  { id: 'grok', name: 'GROK', icon: '𝕏', color: '#1d9bf0', description: 'GROK ANALYZING X SENTIMENT...' },
  { id: 'gemini', name: 'GEMINI', icon: '✦', color: '#8b5cf6', description: 'GEMINI RESEARCHING WEB DATA...' },
  { id: 'claude', name: 'CLAUDE', icon: '🧠', color: '#d97706', description: 'CLAUDE SYNTHESIZING INTELLIGENCE...' },
];

export const WarpAnimation = memo(function WarpAnimation({
  isActive,
  onPhaseChange
}: WarpAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [currentAI, setCurrentAI] = useState<AISource | null>(null);
  const [arrivedAIs, setArrivedAIs] = useState<string[]>([]);
  const [phase, setPhase] = useState<'warp' | 'arriving' | 'synthesizing'>('warp');
  const [powerLevel, setPowerLevel] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING SPECTRASCOPE...');

  // AI arrival sequence
  useEffect(() => {
    if (!isActive) {
      setCurrentAI(null);
      setArrivedAIs([]);
      setPhase('warp');
      setPowerLevel(0);
      setStatusText('INITIALIZING SPECTRASCOPE...');
      return;
    }

    let currentIndex = 0;
    let cancelled = false;

    const showNextAI = () => {
      if (cancelled) return;

      if (currentIndex < AI_SOURCES.length) {
        const ai = AI_SOURCES[currentIndex];
        setCurrentAI(ai);
        setPhase('arriving');
        setStatusText(ai.description);
        onPhaseChange?.(ai.id);

        setTimeout(() => {
          if (cancelled) return;
          setArrivedAIs(prev => [...prev, ai.id]);
          // Update power level based on completed AIs (20% per AI)
          setPowerLevel(Math.min(100, (currentIndex + 1) * 20));
          setCurrentAI(null);
          currentIndex++;

          if (currentIndex < AI_SOURCES.length) {
            setTimeout(showNextAI, 200);
          } else {
            setPhase('synthesizing');
            setStatusText('ANALYSIS COMPLETE');
          }
        }, 1000);
      }
    };

    const timer = setTimeout(showNextAI, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isActive, onPhaseChange]);

  // Canvas starfield
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Many small stars
    const NUM_STARS = 500;

    interface Star {
      x: number;
      y: number;
      z: number;
      prevZ: number;
      size: number;
    }

    const stars: Star[] = [];

    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        prevZ: 0,
        size: Math.random() * 1 + 0.3, // Very small: 0.3 - 1.3px
      });
    }

    let speed = 2;
    const maxSpeed = 40;
    let isRunning = true;

    function animate() {
      if (!isRunning) return;

      if (speed < maxSpeed) speed += 0.4;

      ctx!.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx!.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.prevZ = star.z;
        star.z -= speed;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = width;
          star.prevZ = width;
        }

        const sx = (star.x / star.z) * 200 + centerX;
        const sy = (star.y / star.z) * 200 + centerY;
        const px = (star.x / star.prevZ) * 200 + centerX;
        const py = (star.y / star.prevZ) * 200 + centerY;

        const size = ((1 - star.z / width) * 1.5 + 0.2) * star.size;
        const hue = 220 + (speed / maxSpeed) * 40;
        const alpha = Math.min(1, (1 - star.z / width) * 1.5);

        // Trail
        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha * 0.6})`;
        ctx!.lineWidth = size * 0.6;
        ctx!.stroke();

        // Point
        ctx!.beginPath();
        ctx!.arc(sx, sy, size * 0.4, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${hue}, 60%, 80%, ${alpha})`;
        ctx!.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      isRunning = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* AI Power Bar at Top */}
        <div className="absolute top-20 left-0 right-0 px-8">
          <div className="max-w-md mx-auto">
            {/* Label */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 animate-pulse">⚡</span>
                <span className="text-xs font-bold tracking-[0.2em] text-amber-400">
                  AI POWER
                </span>
              </div>
              <span className="text-xs font-mono text-white/80">
                {powerLevel}%
              </span>
            </div>

            {/* Power Bar */}
            <div className={`relative h-4 rounded-full overflow-hidden bg-slate-800/80 ${
              powerLevel >= 80 ? 'animate-vibrate' : ''
            }`}>
              {/* Fill */}
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  powerLevel >= 80
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-power-surge'
                    : powerLevel >= 50
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500'
                }`}
                style={{ width: `${powerLevel}%` }}
              />

              {/* Electric Sparks at Edge */}
              {powerLevel > 0 && powerLevel < 100 && (
                <div
                  className="absolute top-0 bottom-0 w-6 animate-electric-spark"
                  style={{ left: `calc(${powerLevel}% - 12px)` }}
                >
                  <div className="absolute inset-0 bg-white/60 blur-sm rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                </div>
              )}

              {/* Lightning bolts when high power */}
              {powerLevel >= 70 && (
                <>
                  <div className="absolute -top-4 left-1/4 text-yellow-300 text-sm animate-pulse">⚡</div>
                  <div className="absolute -top-4 right-1/4 text-yellow-300 text-sm animate-pulse animation-delay-200">⚡</div>
                  <div className="absolute -bottom-4 left-1/3 text-yellow-300 text-xs animate-pulse animation-delay-300">⚡</div>
                </>
              )}
            </div>

            {/* Dynamic Status Text */}
            <div className="mt-3 text-center">
              <span className={`text-xs font-mono tracking-widest ${
                powerLevel >= 100 ? 'text-emerald-400' : 'text-cyan-400'
              } animate-pulse`}>
                {statusText}
              </span>
            </div>
          </div>
        </div>

        {/* AI Arrival Announcement */}
        {currentAI && (
          <div className="animate-arrive text-center">
            <div
              className="text-6xl mb-3 animate-pulse-scale"
              style={{ filter: `drop-shadow(0 0 25px ${currentAI.color})` }}
            >
              {currentAI.icon}
            </div>
            <div
              className="text-3xl font-black tracking-[0.3em] mb-1"
              style={{
                color: currentAI.color,
                textShadow: `0 0 30px ${currentAI.color}, 0 0 60px ${currentAI.color}`,
              }}
            >
              {currentAI.name}
            </div>
            <div className="text-white/70 text-lg tracking-widest">
              ARRIVED
            </div>
          </div>
        )}

        {/* Progress indicators at bottom */}
        <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-3">
          {AI_SOURCES.map(ai => {
            const hasArrived = arrivedAIs.includes(ai.id);
            const isCurrent = currentAI?.id === ai.id;

            return (
              <div
                key={ai.id}
                className={`flex flex-col items-center transition-all duration-300 ${
                  hasArrived ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all
                    ${hasArrived ? 'scale-100' : isCurrent ? 'scale-110' : 'scale-75'}`}
                  style={hasArrived ? {
                    background: `${ai.color}20`,
                    boxShadow: `0 0 12px ${ai.color}`,
                    border: `2px solid ${ai.color}`
                  } : { background: 'rgba(255,255,255,0.05)' }}
                >
                  {ai.icon}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${hasArrived ? 'text-white' : 'text-white/30'}`}>
                  {ai.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Center branding */}
        {!currentAI && (
          <div className="text-center">
            <div className="text-4xl mb-2">🔭</div>
            <div className="text-white/80 font-semibold tracking-wider">SPECTRASCOPE</div>
            <div className="text-white/40 text-xs mt-1">
              {phase === 'synthesizing' ? '🧠 Claude is synthesizing...' : 'Gathering intelligence...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default WarpAnimation;
