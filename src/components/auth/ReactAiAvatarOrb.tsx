'use client';

import React, { useEffect, useRef } from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'working';

export interface ReactAiAvatarOrbProps {
  state?: OrbState;
  size?: number;
  className?: string;
  caption?: string;
}

export function ReactAiAvatarOrb({
  state = 'idle',
  size = 200,
  className = '',
  caption,
}: ReactAiAvatarOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.38;

      // Outer Glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.3);
      if (state === 'speaking') {
        glow.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        glow.addColorStop(0, 'rgba(252, 108, 0, 0.45)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Main Core Sphere
      const sphere = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      if (state === 'speaking') {
        sphere.addColorStop(0, '#86efac');
        sphere.addColorStop(0.5, '#22c55e');
        sphere.addColorStop(1, '#052e16');
      } else {
        sphere.addColorStop(0, '#ff9d47');
        sphere.addColorStop(0.5, '#fc6c00');
        sphere.addColorStop(1, '#1a0800');
      }

      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Energy Ring Rotation
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.strokeStyle = state === 'speaking' ? 'rgba(134, 239, 172, 0.8)' : 'rgba(255, 157, 71, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.08, 0, Math.PI * 1.5);
      ctx.stroke();

      ctx.restore();

      // Speed depends on state
      const speed =
        state === 'thinking' ? 0.12 : state === 'working' ? 0.08 : state === 'listening' ? 0.05 : 0.02;
      angle += speed;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state, size]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative p-2 rounded-2xl bg-[#0e1117] border border-[#242934] shadow-[0_12px_36px_rgba(0,0,0,0.85)]">
        <canvas ref={canvasRef} width={size} height={size} className="block" />
      </div>

      {caption && (
        <div className="mt-3 px-3 py-1 rounded-full bg-[#12151b] border border-[#242934] text-[11px] font-mono text-[#ff9d47] flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#fc6c00] animate-pulse" />
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
}
