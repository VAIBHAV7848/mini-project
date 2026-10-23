'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export type VideoAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'working';

export interface RealisticAiVideoAvatarProps {
  state?: VideoAvatarState;
  size?: number;
  className?: string;
  caption?: string;
}

const CLIPS: Record<VideoAvatarState, string> = {
  idle: '/avatar/idle.mp4',
  listening: '/avatar/listening.mp4',
  thinking: '/avatar/thinking.mp4',
  working: '/avatar/working.mp4',
  speaking: '/avatar/speaking.mp4',
};

const STATE_MESSAGES: Record<VideoAvatarState, string> = {
  idle: 'AI Security Guardian: Ready',
  listening: 'AI Guardian: Listening to credentials',
  thinking: 'AI Guardian: Computing HMAC-SHA256 signature...',
  working: 'AI Guardian: Verifying dual-rail ledger...',
  speaking: 'AI Guardian: Identity authenticated! Welcome.',
};

export function RealisticAiVideoAvatar({
  state = 'idle',
  size = 220,
  className = '',
  caption,
}: RealisticAiVideoAvatarProps) {
  const [activeState, setActiveState] = useState<VideoAvatarState>(state);
  const videoRefs = useRef<Record<VideoAvatarState, HTMLVideoElement | null>>({
    idle: null,
    listening: null,
    thinking: null,
    working: null,
    speaking: null,
  });

  // Handle smooth state transitions and play active clip
  useEffect(() => {
    setActiveState(state);

    const activeVideo = videoRefs.current[state];
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.play().catch(() => {
        // Handle browser autoplay policy restrictions gracefully
      });
    }

    // Pause non-active videos after crossfade duration (350ms) to save CPU/GPU cycles
    const timer = setTimeout(() => {
      Object.entries(videoRefs.current).forEach(([key, video]) => {
        if (key !== state && video) {
          video.pause();
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer Housing Container */}
      <div className="relative p-2.5 rounded-full bg-gradient-to-b from-[#1c212c] via-[#12151b] to-[#0a0c10] border-2 border-[#2b3345] shadow-[0_16px_50px_rgba(0,0,0,0.9)]">
        {/* Ambient Laser Orange Pulse Ring */}
        <div
          className={`absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-500 ${
            activeState === 'thinking'
              ? 'bg-[#fc6c00]/35 scale-110 animate-pulse'
              : activeState === 'speaking'
              ? 'bg-[#4ade80]/30 scale-105'
              : activeState === 'working'
              ? 'bg-[#ff9d47]/25 scale-100'
              : 'bg-[#fc6c00]/15'
          }`}
        />

        {/* Video Circle Mask */}
        <div
          style={{ width: size, height: size }}
          className="relative rounded-full overflow-hidden border border-[#fc6c00]/40 shadow-inner bg-[#0a0c10]"
        >
          {(Object.keys(CLIPS) as VideoAvatarState[]).map((clipKey) => (
            <video
              key={clipKey}
              ref={(el) => {
                videoRefs.current[clipKey] = el;
              }}
              src={CLIPS[clipKey]}
              poster="/avatar/poster.jpg"
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: clipKey === activeState ? 1 : 0,
                transition: 'opacity 350ms ease-in-out',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Precision Crosshair HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none border border-[#fc6c00]/20 rounded-full" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#fc6c00]/40 pointer-events-none" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#fc6c00]/40 pointer-events-none" />
        </div>

        {/* Floating Verified AI Badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#12151b] border border-[#fc6c00]/50 text-[10px] font-mono text-[#ff9d47] flex items-center gap-1 shadow-md whitespace-nowrap">
          <Bot className="w-3 h-3 text-[#fc6c00]" />
          <span>REACT-AI-AVATAR</span>
        </div>
      </div>

      {/* Dynamic Caption Readout */}
      <div className="mt-4 px-3.5 py-1.5 rounded-full bg-[#12151b] border border-[#242934] text-xs font-mono text-[#ff9d47] flex items-center gap-2 shadow-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            activeState === 'thinking'
              ? 'bg-[#fc6c00] animate-ping'
              : activeState === 'speaking'
              ? 'bg-[#4ade80]'
              : activeState === 'working'
              ? 'bg-[#ff9d47] animate-pulse'
              : activeState === 'listening'
              ? 'bg-[#ff9d47]'
              : 'bg-[#fc6c00]'
          }`}
        />
        <span>{caption || STATE_MESSAGES[activeState]}</span>
      </div>
    </div>
  );
}
