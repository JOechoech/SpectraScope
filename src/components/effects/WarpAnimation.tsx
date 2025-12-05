/**
 * WarpAnimation - Space warp effect during AI analysis
 *
 * Creates an immersive star field animation that accelerates
 * as the AI analysis progresses.
 */

import { useEffect, useRef, memo } from 'react';

interface WarpAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
}

export const WarpAnimation = memo(function WarpAnimation({
  isActive,
}: WarpAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Star properties
    const stars: Star[] = [];
    const numStars = 200;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        z: Math.random() * canvas.width,
        prevX: 0,
        prevY: 0,
      });
    }

    let speed = 1;
    const maxSpeed = 50;
    const acceleration = 0.5;

    function animate() {
      // Accelerate
      if (speed < maxSpeed) {
        speed += acceleration;
      }

      // Clear with fade effect
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      for (const star of stars) {
        // Store previous position
        star.prevX = (star.x / star.z) * 300 + centerX;
        star.prevY = (star.y / star.z) * 300 + centerY;

        // Move star closer
        star.z -= speed;

        // Reset if too close
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width;
          star.y = (Math.random() - 0.5) * canvas.height;
          star.z = canvas.width;
          star.prevX = (star.x / star.z) * 300 + centerX;
          star.prevY = (star.y / star.z) * 300 + centerY;
        }

        // Calculate current position
        const x = (star.x / star.z) * 300 + centerX;
        const y = (star.y / star.z) * 300 + centerY;

        // Size based on depth
        const size = (1 - star.z / canvas.width) * 3;

        // Color based on speed (white -> blue -> purple)
        const hue = 200 + (speed / maxSpeed) * 60;
        const lightness = 50 + (speed / maxSpeed) * 30;

        // Draw line (motion blur)
        ctx!.beginPath();
        ctx!.moveTo(star.prevX, star.prevY);
        ctx!.lineTo(x, y);
        ctx!.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${1 - star.z / canvas.width})`;
        ctx!.lineWidth = size;
        ctx!.stroke();

        // Draw star point
        ctx!.beginPath();
        ctx!.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${hue}, 100%, ${lightness}%, 1)`;
        ctx!.fill();
      }

      // Center glow
      const gradient = ctx!.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        100 + speed * 2
      );
      gradient.addColorStop(
        0,
        `rgba(100, 150, 255, ${0.1 + (speed / maxSpeed) * 0.2})`
      );
      gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Continue animation
      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="text-2xl font-bold mb-2 animate-pulse">
          Analyzing...
        </div>
        <div className="text-sm text-blue-300 opacity-80">
          Gathering intelligence from multiple sources
        </div>

        {/* Progress dots */}
        <div className="flex gap-4 mt-6">
          {['Technicals', 'News', 'Social', 'Research'].map((source, i) => (
            <div
              key={source}
              className="flex flex-col items-center"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div
                className="w-2 h-2 rounded-full bg-blue-400 animate-ping"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              <span className="text-xs text-slate-400 mt-2">{source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default WarpAnimation;
