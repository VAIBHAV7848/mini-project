'use client';

import React, { useState, useEffect, useRef } from 'react';

export type ReactAiAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'working';

export interface ReactAiAvatarCoderProps {
  state?: ReactAiAvatarState;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  poses?: boolean;
  caption?: string;
}

export function ReactAiAvatarCoder({
  state = 'idle',
  size = 220,
  className = '',
  style,
  poses = true,
  caption,
}: ReactAiAvatarCoderProps) {
  // GigaFlow Brand Theme Colors (Black & Orange)
  const SKIN = '#e8b083';
  const SKIN_SHADOW = '#be8256';
  const SKIN_DEEP = '#9c663f';
  const HAIR = '#1a1a1a';
  const HOODIE = '#141720';
  const TEE = '#fc6c00'; // GigaFlow Laser Orange
  const FRAME = '#fc6c00'; // Orange Glasses Frames
  const BEANIE = '#fc6c00'; // Orange Beanie
  const BEANIE_CUFF = '#e55b00';
  const BEANIE_RIB = '#c2410c';
  const HEADPHONE = '#12141a';
  const HEADPHONE_PAD = '#262933';
  const BG_COLOR = '#0e1117';

  // State-derived poses
  const working = poses && state === 'working';
  const thinking = poses && state === 'thinking';
  const speaking = state === 'speaking';
  const listening = state === 'listening';

  // Natural ambient blink and gaze state
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Random natural blink loop
    let timeoutId: NodeJS.Timeout;
    const scheduleBlink = () => {
      const nextTime = Math.random() * 3200 + 1800;
      timeoutId = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        scheduleBlink();
      }, nextTime);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Subtle gaze shifts during listening / idle
    if (thinking) {
      setGaze({ x: 3, y: -2 }); // Look up and slightly right when thinking
      return;
    }
    if (working) {
      setGaze({ x: 0, y: 3 }); // Look down at laptop screen when working
      return;
    }
    setGaze({ x: 0, y: 0 });
  }, [thinking, working]);

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`} style={style}>
      <div className="relative p-2.5 rounded-full bg-gradient-to-b from-[#1c212c] to-[#0a0c10] border-2 border-[#2b3345] shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
        {/* State Halo Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-500 ${
            thinking
              ? 'bg-[#fc6c00]/30 scale-105 animate-pulse'
              : working
              ? 'bg-[#fc6c00]/25 scale-100'
              : speaking
              ? 'bg-[#4ade80]/20 scale-105'
              : 'bg-[#fc6c00]/10'
          }`}
        />

        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Interactive AI Developer Security Avatar"
          className="relative z-10"
        >
          {/* Outer Status Ring */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke={
              thinking
                ? '#fc6c00'
                : working
                ? '#ff9d47'
                : speaking
                ? '#4ade80'
                : listening
                ? '#ff9d47'
                : '#2a3040'
            }
            strokeWidth="3.5"
            strokeDasharray={thinking ? '6 4' : undefined}
            className={thinking ? 'animate-[spin_4s_linear_infinite]' : ''}
            style={{ transformOrigin: '100px 100px' }}
          />

          {/* Background Disc */}
          <circle cx="100" cy="100" r="79" fill={BG_COLOR} />
          <clipPath id="ai-coder-clip">
            <circle cx="100" cy="100" r="79" />
          </clipPath>

          <g clipPath="url(#ai-coder-clip)">
            {/* Neck */}
            <path d="M85 118 Q83 140 80 152 L120 152 Q117 140 115 118 Z" fill={SKIN} />
            <path d="M85 132 Q100 145 115 132 Q100 141 85 132 Z" fill={SKIN_DEEP} opacity="0.45" />

            {/* Body: Hoodie + Circuit Tee */}
            <path d="M82 150 L118 150 L118 182 L82 182 Z" fill={TEE} />
            <path
              d="M36 182 Q42 148 72 144 Q80 150 86 150 L100 178 L114 150 Q120 150 128 144 Q158 148 164 182 Z"
              fill={HOODIE}
            />

            {/* Circuit Trace on Tee */}
            <g stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.9">
              <path d="M100 156 L100 174 M94 162 L106 162 M97 170 L103 170" />
              <circle cx="100" cy="160" r="1.4" fill="#ffffff" stroke="none" />
            </g>

            {/* Drawstrings */}
            <g>
              <circle cx="85" cy="152" r="1.6" fill="#fc6c00" opacity="0.6" />
              <circle cx="115" cy="152" r="1.6" fill="#fc6c00" opacity="0.6" />
              <path
                d="M85 153 L81 173 M115 153 L119 173"
                stroke="#fc6c00"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
            </g>

            {/* Head Group (tilts when thinking) */}
            <g
              transform={thinking ? 'rotate(6 100 120)' : undefined}
              style={{ transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
            >
              {/* Head Base & Cheeks */}
              <path
                d="M100 55 C121 55 136 71 136 93 C136 112 123 129 107 134 C104 135.5 96 135.5 93 134 C77 129 64 112 64 93 C64 71 79 55 100 55 Z"
                fill={SKIN}
              />
              <ellipse cx="77" cy="116" rx="8" ry="4.5" fill="#e08a6a" opacity="0.35" />
              <ellipse cx="123" cy="116" rx="8" ry="4.5" fill="#e08a6a" opacity="0.35" />

              {/* Hair escaping at temples */}
              <path
                d="M65 64 C61 78 62 92 67 103 C70 95 69 85 72 79 C74 87 73 97 76 103 C78 89 76 74 74 66 Z"
                fill={HAIR}
              />
              <path
                d="M135 64 C139 78 138 92 133 103 C130 95 131 85 128 79 C126 87 127 97 124 103 C122 89 124 74 126 66 Z"
                fill={HAIR}
              />

              {/* Headphone Band */}
              <g stroke={HEADPHONE} strokeWidth="6" strokeLinecap="round" fill="none">
                <path d="M60 94 C56 84 58 74 65 68" />
                <path d="M140 94 C144 84 142 74 135 68" />
              </g>

              {/* Beanie (GigaFlow Orange) */}
              <path d="M70 70 C60 14 150 20 130 70 Z" fill={BEANIE} />
              <path d="M64 60 Q100 70 136 60 L136 72 Q100 82 64 72 Z" fill={BEANIE_CUFF} />
              <g stroke={BEANIE_RIB} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" fill="none">
                <path d="M72 63 L72 71 M80 65.5 L80 73.5 M88 67 L88 75 M96 68 L96 76 M104 68 L104 76 M112 67 L112 75 M120 65.5 L120 73.5 M128 63 L128 71" />
              </g>

              {/* Eyebrows */}
              <g stroke={HAIR} strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M71 82 Q80 78 90 82" />
                <path d="M110 82 Q120 78 129 82" />
              </g>

              {/* Glasses (Orange frames) */}
              <g stroke={FRAME} strokeWidth="3" fill="none">
                <path d="M95 96 Q100 93 105 96" />
                <path d="M69 94 L64 92" />
                <path d="M131 94 L136 92" />
              </g>
              <circle cx="82" cy="96" r="13" fill="#0f1217" stroke={FRAME} strokeWidth="3" />
              <circle cx="118" cy="96" r="13" fill="#0f1217" stroke={FRAME} strokeWidth="3" />

              {/* Eyes & Pupils */}
              {/* Left Eye */}
              <g>
                <ellipse cx="82" cy="97" rx="8" ry="8.5" fill="#ffffff" />
                <circle
                  cx={82 + gaze.x}
                  cy={97 + gaze.y}
                  r="4.6"
                  fill="#1a1a1a"
                />
                <circle cx={84 + gaze.x} cy={94 + gaze.y} r="1.5" fill="#ffffff" />
                {/* Eyelid for natural blink */}
                <rect
                  x="73"
                  y="87"
                  width="18"
                  height={blink ? 18 : 0}
                  fill={SKIN}
                  style={{ transition: 'height 0.08s ease' }}
                />
              </g>

              {/* Right Eye */}
              <g>
                <ellipse cx="118" cy="97" rx="8" ry="8.5" fill="#ffffff" />
                <circle
                  cx={118 + gaze.x}
                  cy={97 + gaze.y}
                  r="4.6"
                  fill="#1a1a1a"
                />
                <circle cx={120 + gaze.x} cy={94 + gaze.y} r="1.5" fill="#ffffff" />
                <rect
                  x="109"
                  y="87"
                  width="18"
                  height={blink ? 18 : 0}
                  fill={SKIN}
                  style={{ transition: 'height 0.08s ease' }}
                />
              </g>

              {/* Laptop Screen Reflection on Glasses (Flickering while working) */}
              {working && (
                <g opacity="0.6">
                  <path d="M74 103 L88 89 L93 89 L79 103 Z" fill="#fc6c00">
                    <animate
                      attributeName="opacity"
                      values="0.6;0.2;0.7;0.3;0.6"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <path d="M110 103 L124 89 L129 89 L115 103 Z" fill="#fc6c00">
                    <animate
                      attributeName="opacity"
                      values="0.6;0.25;0.65;0.2;0.6"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              )}

              {/* Nose */}
              <path
                d="M99 105 C97 111 95 114 97 115.4 C98.6 116.6 101.4 116.6 103 115.4"
                fill="none"
                stroke={SKIN_SHADOW}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Mouth (reacts when speaking) */}
              {speaking ? (
                <ellipse cx="100" cy="122" rx="8" ry="5.5" fill="#8c4a3f">
                  <animate attributeName="ry" values="5.5;2;6;3;5.5" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
              ) : (
                <ellipse cx="100" cy="121" rx="7" ry="2.3" fill="#8c4a3f" />
              )}
              <path
                d="M95 126 Q100 129 105 126"
                fill="none"
                stroke={SKIN_SHADOW}
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Headphone Cups */}
              <rect x="52" y="90" width="16" height="26" rx="8" fill={HEADPHONE} />
              <rect x="55" y="94" width="10" height="18" rx="5" fill={HEADPHONE_PAD} />
              <rect x="132" y="90" width="16" height="26" rx="8" fill={HEADPHONE} />
              <rect x="135" y="94" width="10" height="18" rx="5" fill={HEADPHONE_PAD} />

              {/* Thinking Hand Touching Chin */}
              {thinking && (
                <g id="ai-thinking-hand">
                  <path
                    d="M133 143 L121 156 L146 182 L172 182 Z"
                    fill={HOODIE}
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                  <g fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M126 142 C135 140 142.5 146 143 154.5 L143.5 165 C144 172.5 138 177 130.5 175.5 C123.5 174 119 168.5 119 161.5 L119 152 C119 147 122 143 126 142 Z" />
                    <g fill="none" stroke={SKIN_SHADOW} strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
                      <path d="M121 153.5 C127.5 150.5 136 152 142.5 155.5" />
                      <path d="M120 161.5 C127 158.5 135.5 160 143 163.5" />
                    </g>
                    <path d="M127 147 C123 142 118.5 136.5 115.5 132.5 C113.6 130 116.2 127.6 118.4 129.6 C120.6 131.6 125 137 129.5 143 Z" />
                  </g>
                </g>
              )}
            </g>

            {/* Laptop Workspace & Typing Arms while working */}
            {working && (
              <g id="ai-working-laptop">
                {/* Left Arm Typing */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0,0; 0,-0.8; 0,0.4; 0,-0.5; 0,0"
                    dur="0.22s"
                    repeatCount="indefinite"
                  />
                  <path d="M30 182 L50 158 L64 167 L46 182 Z" fill={HOODIE} stroke="#1f242e" strokeWidth="1" />
                  <path d="M58 164 L75 154" stroke={SKIN} strokeWidth="9" strokeLinecap="round" fill="none" />
                  <circle cx="71" cy="155" r="5" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1" />
                </g>

                {/* Right Arm Typing */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0,0; 0,0.5; 0,-0.7; 0,0.3; 0,0"
                    dur="0.18s"
                    repeatCount="indefinite"
                  />
                  <path d="M170 182 L150 158 L136 167 L154 182 Z" fill={HOODIE} stroke="#1f242e" strokeWidth="1" />
                  <path d="M142 164 L125 154" stroke={SKIN} strokeWidth="9" strokeLinecap="round" fill="none" />
                  <circle cx="129" cy="155" r="5" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1" />
                </g>

                {/* Laptop Lid with GigaFlow GF Logo Sticker */}
                <path d="M60 182 L74 138 L126 138 L138 182 Z" fill="#1c212c" stroke="#10131a" strokeWidth="1.5" />
                <path d="M74 138 L126 138" stroke="#fc6c00" strokeWidth="2" />
                <circle cx="100" cy="160" r="7" fill="#fc6c00" />
                <text
                  x="100"
                  y="163"
                  textAnchor="middle"
                  fill="#000000"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  GF
                </text>
              </g>
            )}
          </g>

          {/* Thought Bubble (when thinking) */}
          {thinking && (
            <g id="ai-thought-bubble">
              <circle cx="154" cy="50" r="4" fill="#1c212c" stroke="#fc6c00" strokeWidth="1.5" />
              <circle cx="168" cy="38" r="5.5" fill="#1c212c" stroke="#fc6c00" strokeWidth="1.5" />
              <circle cx="184" cy="24" r="8" fill="#1c212c" stroke="#fc6c00" strokeWidth="2" />
              <text x="184" y="27" textAnchor="middle" fill="#fc6c00" fontSize="9">
                🔒
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* State Caption Pill */}
      {caption && (
        <div className="mt-3 px-3 py-1 rounded-full bg-[#12151b] border border-[#242934] text-[11px] font-mono text-[#ff9d47] flex items-center gap-1.5 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              thinking
                ? 'bg-[#fc6c00] animate-ping'
                : working
                ? 'bg-[#ff9d47] animate-pulse'
                : speaking
                ? 'bg-[#4ade80]'
                : 'bg-[#fc6c00]'
            }`}
          />
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
}
