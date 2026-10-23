'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ShieldCheck, Lock, Unlock, AlertTriangle, KeyRound } from 'lucide-react';

export type VaultState = 'idle' | 'typing' | 'verifying' | 'unlocked' | 'error';

export interface MechanicalEscrowVaultProps {
  /**
   * Current operating state of the mechanical vault tumbler
   * - 'idle': Resting state, slow breathing rotation, orange standby LEDs
   * - 'typing': ARMED state, responsive rotary clicks and mechanical indexing
   * - 'verifying': High-speed concentric ring alignment and live SHA-256 stream
   * - 'unlocked': Pneumatic lock disengagement, iris opens wide, orange corona burst
   * - 'error': High-frequency magnetic braking shudder, emergency alert strobe
   */
  state?: VaultState;
  /**
   * Optional custom SHA-256 hash preview string to display in the optic aperture
   */
  hashPreview?: string;
  /**
   * Alignment progress (0 to 100) used during 'verifying' state
   */
  progress?: number;
  /**
   * Input entropy (0 to 100) for mechanical ring rotation
   */
  entropy?: number;
  /**
   * Component width/height bounding box in pixels (default: 320)
   */
  size?: number;
  /**
   * Enable subtle 3D gyroscope / pointer parallax perspective tilt
   */
  interactive?: boolean;
  /**
   * Additional Tailwind class names
   */
  className?: string;
}

/**
 * Procedural mock hash generator for realistic cryptographic telemetry
 */
function generatePseudorandomHash(seed: number): string {
  const chars = '0123456789abcdef';
  let hash = '';
  let s = seed + 0x6d2b79f5;
  for (let i = 0; i < 64; i++) {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    const rand = ((s ^ (s >>> 14)) >>> 0) % chars.length;
    hash += chars[rand];
  }
  return hash;
}

export function MechanicalEscrowVault({
  state = 'idle',
  hashPreview,
  progress = 0,
  size = 320,
  interactive = true,
  className = '',
}: MechanicalEscrowVaultProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parallax tilt angles
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mechanical ring rotation states (in degrees)
  const [ringAngles, setRingAngles] = useState({
    ring1: 0, // Outer Hash Tumbler
    ring2: 45, // Mid Interlocking Detent Ring
    ring3: -30, // Inner Code Ring
  });

  // Animated procedural hash ticker
  const [liveHash, setLiveHash] = useState<string>(
    hashPreview || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );

  // Handle pointer parallax tilt
  useEffect(() => {
    if (!interactive) return;
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      setTilt({
        x: Math.max(-6, Math.min(6, x * 6)),
        y: Math.max(-6, Math.min(6, -y * 6)),
      });
    };

    const handlePointerLeave = () => {
      setTilt({ x: 0, y: 0 });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [interactive]);

  // Dynamic mechanical physics loop
  useEffect(() => {
    let animId: number;
    let seed = 1337;

    const updatePhysics = () => {
      setRingAngles((prev) => {
        if (state === 'verifying') {
          // High-speed rotational alignment with detent deceleration
          return {
            ring1: (prev.ring1 + 3.4) % 360,
            ring2: (prev.ring2 - 4.8) % 360,
            ring3: (prev.ring3 + 6.2) % 360,
          };
        }

        if (state === 'unlocked') {
          // Snap directly to 0-degree aligned lock detents
          const lerp = (cur: number, target: number) => cur + (target - cur) * 0.12;
          return {
            ring1: lerp(prev.ring1, 0),
            ring2: lerp(prev.ring2, 0),
            ring3: lerp(prev.ring3, 0),
          };
        }

        if (state === 'typing') {
          // Responsive micro-indexing steps
          return {
            ring1: (prev.ring1 + 0.35) % 360,
            ring2: (prev.ring2 - 0.5) % 360,
            ring3: (prev.ring3 + 0.8) % 360,
          };
        }

        if (state === 'error') {
          // Chaotic oscillation jitter during lock jam
          const jitter = (Math.random() - 0.5) * 4;
          return {
            ring1: prev.ring1 + jitter,
            ring2: prev.ring2 - jitter,
            ring3: prev.ring3 + jitter * 1.5,
          };
        }

        // 'idle' subtle clockwork drift
        return {
          ring1: (prev.ring1 + 0.04) % 360,
          ring2: (prev.ring2 - 0.06) % 360,
          ring3: (prev.ring3 + 0.08) % 360,
        };
      });

      // Stream cryptographic SHA-256 fragments during verification & typing
      if (state === 'verifying' || state === 'typing') {
        seed++;
        if (seed % 4 === 0) {
          setLiveHash(hashPreview || generatePseudorandomHash(seed));
        }
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [state, hashPreview]);

  // Mechanical Iris Shutter Geometry
  // Generates 8 overlapping steel blades rotating tangentially
  const irisBlades = useMemo(() => {
    const bladeCount = 8;
    const blades = [];
    const pivotRadius = 72;
    const center = 220;

    // Aperture rotation based on state
    // Closed = 0 deg, Half/Focusing = 16 deg, Wide open = 36 deg
    let bladeRotation = 4;
    if (state === 'typing') bladeRotation = 14;
    if (state === 'verifying') bladeRotation = 22;
    if (state === 'unlocked') bladeRotation = 40;
    if (state === 'error') bladeRotation = 0;

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i * 360) / bladeCount;
      const rad = (angle * Math.PI) / 180;
      const px = center + pivotRadius * Math.cos(rad);
      const py = center + pivotRadius * Math.sin(rad);

      blades.push({
        id: i,
        angle,
        px,
        py,
        rotation: bladeRotation,
      });
    }
    return blades;
  }, [state]);

  // Pneumatic Locking Bolt Stroke (radial travel in px)
  // When locked: bolt travels inward to r=150. When unlocked: retracts outward to r=178
  const boltRetraction = state === 'unlocked' ? 24 : 0;

  // Status-dependent palette & LED glow
  const isUnlocked = state === 'unlocked';
  const isError = state === 'error';
  const isVerifying = state === 'verifying';
  const isArmed = state === 'typing';

  const primaryGlow = isError
    ? 'rgba(239, 68, 68, 0.85)' // Alert Red-Orange
    : isUnlocked
    ? 'rgba(252, 108, 0, 0.95)' // Brilliant Escrow Orange
    : isVerifying
    ? 'rgba(255, 157, 71, 0.8)' // Pulse Orange Light
    : isArmed
    ? 'rgba(252, 108, 0, 0.65)' // Focus Orange Base
    : 'rgba(252, 108, 0, 0.35)'; // Standby Warm Glow

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        perspective: '1200px',
      }}
      className={`relative select-none flex items-center justify-center transition-transform duration-200 ease-out ${className}`}
      role="img"
      aria-label={`Industrial Escrow Vault Tumbler - State: ${state.toUpperCase()}`}
    >
      {/* Dynamic Atmospheric Floor Glow (Pure Black & Orange) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${primaryGlow} 0%, rgba(252, 108, 0, 0.04) 55%, transparent 75%)`,
          filter: isUnlocked ? 'blur(32px)' : 'blur(24px)',
          transform: isUnlocked ? 'scale(1.2)' : 'scale(1)',
          opacity: isUnlocked ? 0.9 : 0.6,
        }}
      />

      {/* Main 3D Tumbler Assembly Container */}
      <div
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`w-full h-full relative ${isError ? 'animate-[shake_0.35s_ease-in-out_infinite]' : ''}`}
      >
        <svg
          viewBox="0 0 440 440"
          className="w-full h-full drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
        >
          <defs>
            {/* Dark Tungsten & Carbon Steel Gradients */}
            <radialGradient id="housingBase" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="65%" stopColor="#121212" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </radialGradient>

            <linearGradient id="chassisBevel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#383838" />
              <stop offset="50%" stopColor="#181818" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </linearGradient>

            <linearGradient id="milledSteelRing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c2c2c" />
              <stop offset="40%" stopColor="#1a1a1a" />
              <stop offset="60%" stopColor="#141414" />
              <stop offset="100%" stopColor="#262626" />
            </linearGradient>

            <linearGradient id="boltSteel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="50%" stopColor="#222222" />
              <stop offset="100%" stopColor="#111111" />
            </linearGradient>

            <radialGradient id="irisCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff9d47" stopOpacity={isUnlocked ? 0.95 : 0.65} />
              <stop offset="40%" stopColor="#fc6c00" stopOpacity={isUnlocked ? 0.75 : 0.35} />
              <stop offset="80%" stopColor="#c2410c" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.95" />
            </radialGradient>

            {/* Laser Knurl Crosshatch Pattern */}
            <pattern id="knurlGrip" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0 6 L6 0 M0 0 L6 6" stroke="#252525" strokeWidth="0.8" />
              <circle cx="3" cy="3" r="0.6" fill="#000000" />
            </pattern>

            {/* High-Precision Specular Blur Filter */}
            <filter id="bloomGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* LAYER 1: HEAVY CHASSIS HOUSING & FLANGE BEZEL (r=210) */}
          <circle
            cx="220"
            cy="220"
            r="210"
            fill="url(#housingBase)"
            stroke="#262626"
            strokeWidth="3.5"
          />

          {/* Knurled Grip Traction Ring */}
          <circle
            cx="220"
            cy="220"
            r="198"
            fill="url(#knurlGrip)"
            stroke="#161616"
            strokeWidth="2"
          />

          {/* Recessed Mechanical Step */}
          <circle
            cx="220"
            cy="220"
            r="184"
            fill="none"
            stroke="#333333"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />

          {/* 12 Radially Dispersed High-Tensile Socket Cap Screws */}
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = (i * 360) / 12;
            const rad = (deg * Math.PI) / 180;
            const bx = 220 + 200 * Math.cos(rad);
            const by = 220 + 200 * Math.sin(rad);
            return (
              <g key={`bolt-${i}`} transform={`translate(${bx}, ${by})`}>
                <circle cx="0" cy="0" r="4.8" fill="url(#boltSteel)" stroke="#0a0a0a" strokeWidth="1" />
                <polygon
                  points="0,-2.6 2.25,-1.3 2.25,1.3 0,2.6 -2.25,1.3 -2.25,-1.3"
                  fill="#0f0f0f"
                  stroke="#3a3a3a"
                  strokeWidth="0.6"
                />
              </g>
            );
          })}

          {/* Protractor Laser Scale: 72 Radial Degree Hash Marks */}
          <g>
            {Array.from({ length: 72 }).map((_, i) => {
              const deg = (i * 360) / 72;
              const isMajor = i % 6 === 0;
              const rad = (deg * Math.PI) / 180;
              const rInner = isMajor ? 175 : 180;
              const rOuter = 184;
              const x1 = 220 + rInner * Math.cos(rad);
              const y1 = 220 + rInner * Math.sin(rad);
              const x2 = 220 + rOuter * Math.cos(rad);
              const y2 = 220 + rOuter * Math.sin(rad);
              return (
                <line
                  key={`hash-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? '#fc6c00' : '#404040'}
                  strokeWidth={isMajor ? 1.6 : 0.8}
                  opacity={isMajor ? 0.9 : 0.6}
                />
              );
            })}
          </g>

          {/* Chassis Mil-Spec Etchings */}
          <text
            x="220"
            y="48"
            textAnchor="middle"
            fill="#555555"
            fontSize="7"
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="2.5"
            fontWeight="bold"
          >
            ESCROW SEC-CHASSIS // MK-IV
          </text>
          <text
            x="220"
            y="398"
            textAnchor="middle"
            fill="#555555"
            fontSize="6.5"
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="2"
          >
            SHA-256 ROOTS OF TRUST
          </text>

          {/* LAYER 2: 4 PNEUMATIC LOCK BOLT LUGS */}
          {[0, 90, 180, 270].map((angle, idx) => (
            <g
              key={`piston-${idx}`}
              transform={`rotate(${angle} 220 220)`}
              className="transition-transform duration-300 ease-out"
            >
              <rect
                x="208"
                y="38"
                width="24"
                height="32"
                rx="2"
                fill="url(#chassisBevel)"
                stroke="#2a2a2a"
                strokeWidth="1.5"
              />
              <line x1="214" y1="44" x2="226" y2="44" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />
              <line x1="214" y1="52" x2="226" y2="52" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />
              <line x1="214" y1="60" x2="226" y2="60" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />

              <g
                style={{
                  transform: `translateY(${-boltRetraction}px)`,
                  transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
                }}
              >
                <path
                  d="M 211 68 L 229 68 L 227 92 L 213 92 Z"
                  fill="url(#boltSteel)"
                  stroke={isUnlocked ? '#fc6c00' : '#333333'}
                  strokeWidth="1.5"
                />
                <polygon
                  points="215,92 225,92 220,98"
                  fill={isUnlocked ? '#fc6c00' : '#1f1f1f'}
                />
              </g>
            </g>
          ))}

          {/* LAYER 3: ROTOR RING 1 (Outer Hash Ring) */}
          <g
            transform={`rotate(${ringAngles.ring1} 220 220)`}
            style={{ transformOrigin: '220px 220px' }}
          >
            <circle
              cx="220"
              cy="220"
              r="154"
              fill="none"
              stroke="url(#milledSteelRing)"
              strokeWidth="24"
            />
            <circle
              cx="220"
              cy="220"
              r="166"
              fill="none"
              stroke="#0f0f0f"
              strokeWidth="1.5"
            />
            <circle
              cx="220"
              cy="220"
              r="142"
              fill="none"
              stroke="#0f0f0f"
              strokeWidth="1.5"
            />

            {['0', 'F', '4', 'C', '9', '2', 'A', '7', 'E', '1', 'B', '6', '3', 'D', '8', '5'].map(
              (char, i) => {
                const deg = (i * 360) / 16;
                const rad = (deg * Math.PI) / 180;
                const tx = 220 + 154 * Math.cos(rad);
                const ty = 220 + 154 * Math.sin(rad);
                return (
                  <text
                    key={`hex-${i}`}
                    x={tx}
                    y={ty + 3}
                    textAnchor="middle"
                    fill={isUnlocked ? '#ff9d47' : '#888888'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="var(--font-mono, monospace)"
                    transform={`rotate(${deg + 90} ${tx} ${ty})`}
                  >
                    {char}
                  </text>
                );
              }
            )}
          </g>

          {/* LAYER 4: ROTOR RING 2 (Mid Interlocking Detent Escapement) */}
          <g
            transform={`rotate(${ringAngles.ring2} 220 220)`}
            style={{ transformOrigin: '220px 220px' }}
          >
            <circle
              cx="220"
              cy="220"
              r="126"
              fill="none"
              stroke="#171717"
              strokeWidth="20"
            />
            <circle
              cx="220"
              cy="220"
              r="136"
              fill="none"
              stroke="#2e2e2e"
              strokeWidth="1"
            />
            <circle
              cx="220"
              cy="220"
              r="116"
              fill="none"
              stroke="#2e2e2e"
              strokeWidth="1"
            />

            {Array.from({ length: 24 }).map((_, i) => {
              const deg = (i * 360) / 24;
              const rad = (deg * Math.PI) / 180;
              const gx = 220 + 126 * Math.cos(rad);
              const gy = 220 + 126 * Math.sin(rad);
              return (
                <rect
                  key={`tooth-${i}`}
                  x={gx - 2.5}
                  y={gy - 2.5}
                  width="5"
                  height="5"
                  rx="1"
                  fill="#0a0a0a"
                  stroke={i % 3 === 0 ? '#fc6c00' : '#333333'}
                  strokeWidth="0.8"
                  transform={`rotate(${deg} ${gx} ${gy})`}
                />
              );
            })}
          </g>

          {/* LAYER 5: ROTOR RING 3 (Inner Code Dial) */}
          <g
            transform={`rotate(${ringAngles.ring3} 220 220)`}
            style={{ transformOrigin: '220px 220px' }}
          >
            <circle
              cx="220"
              cy="220"
              r="96"
              fill="none"
              stroke="url(#housingBase)"
              strokeWidth="16"
            />
            <circle
              cx="220"
              cy="220"
              r="104"
              fill="none"
              stroke="#3a3a3a"
              strokeWidth="1"
            />
            <circle
              cx="220"
              cy="220"
              r="88"
              fill="none"
              stroke="#3a3a3a"
              strokeWidth="1"
            />

            <polygon
              points="220,86 216,94 224,94"
              fill="#fc6c00"
              filter="url(#bloomGlow)"
            />
            <polygon
              points="220,106 216,98 224,98"
              fill="#ff9d47"
            />
          </g>

          {/* LAYER 6: RECESSED OPTICAL APERTURE */}
          <circle
            cx="220"
            cy="220"
            r="84"
            fill="url(#irisCoreGlow)"
            stroke="#0a0a0a"
            strokeWidth="3"
          />

          <circle
            cx="220"
            cy="220"
            r="60"
            fill="none"
            stroke="#fc6c00"
            strokeWidth="0.8"
            strokeDasharray="4 6"
            opacity={isUnlocked ? 0.9 : 0.4}
          />
          <line x1="160" y1="220" x2="185" y2="220" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />
          <line x1="255" y1="220" x2="280" y2="220" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />
          <line x1="220" y1="160" x2="220" y2="185" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />
          <line x1="220" y1="255" x2="220" y2="280" stroke="#fc6c00" strokeWidth="1" opacity="0.6" />

          {/* LAYER 7: ARTICULATED IRIS DIAPHRAGM (8 Mechanical Blades) */}
          <g>
            {irisBlades.map((b) => (
              <g
                key={`blade-${b.id}`}
                transform={`rotate(${b.angle} 220 220)`}
              >
                <path
                  d="M 220 148 C 248 160, 268 185, 272 220 C 265 200, 240 175, 205 168 Z"
                  fill="url(#boltSteel)"
                  stroke="#121212"
                  strokeWidth="1.2"
                  style={{
                    transformOrigin: `${b.px}px ${b.py}px`,
                    transform: `rotate(${b.rotation}deg)`,
                    transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                />
                <circle cx={b.px} cy={b.py} r="2.2" fill="#3a3a3a" stroke="#000000" strokeWidth="0.6" />
              </g>
            ))}
          </g>

          {/* LAYER 8: CENTER CORE HUD TELEMETRY & STATUS EMBLEM */}
          <g className="transition-all duration-300">
            <circle
              cx="220"
              cy="220"
              r="34"
              fill={isUnlocked ? '#1a1005' : '#0d0d0d'}
              stroke={isUnlocked ? '#fc6c00' : '#2b2b2b'}
              strokeWidth="2"
              filter={isUnlocked ? 'url(#bloomGlow)' : undefined}
            />

            {isUnlocked ? (
              <g transform="translate(204, 204)">
                <Unlock className="w-8 h-8 text-[#fc6c00] animate-bounce" />
              </g>
            ) : isError ? (
              <g transform="translate(204, 204)">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
              </g>
            ) : isVerifying ? (
              <g transform="translate(205, 205)">
                <ShieldCheck className="w-7 h-7 text-[#ff9d47] animate-spin" style={{ animationDuration: '3s' }} />
              </g>
            ) : isArmed ? (
              <g transform="translate(206, 206)">
                <KeyRound className="w-7 h-7 text-[#fc6c00]" />
              </g>
            ) : (
              <g transform="translate(206, 206)">
                <Lock className="w-7 h-7 text-[#737373]" />
              </g>
            )}
          </g>

          {/* LAYER 9: 4 CARDINAL LED BEZELS */}
          {[
            { cx: 70, cy: 220 },
            { cx: 370, cy: 220 },
            { cx: 220, cy: 70 },
            { cx: 220, cy: 370 },
          ].map((led, i) => {
            const ledFill = isError
              ? '#ef4444'
              : isUnlocked
              ? '#ff9d47'
              : isVerifying
              ? (i % 2 === 0 ? '#fc6c00' : '#ff9d47')
              : isArmed
              ? '#fc6c00'
              : '#3a200a';

            return (
              <g key={`led-${i}`}>
                <circle cx={led.cx} cy={led.cy} r="6.5" fill="#141414" stroke="#2e2e2e" strokeWidth="1" />
                <circle
                  cx={led.cx}
                  cy={led.cy}
                  r="3.5"
                  fill={ledFill}
                  filter={state !== 'idle' ? 'url(#bloomGlow)' : undefined}
                />
                <circle cx={led.cx - 1} cy={led.cy - 1} r="1" fill="#ffffff" opacity="0.6" />
              </g>
            );
          })}
        </svg>

        {/* LOWER TACTILE TELEMETRY READOUT STRIP */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-[92%] bg-[#0a0a0a]/95 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-md shadow-lg flex items-center justify-between font-mono text-[10px]">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isError
                  ? 'bg-red-500 animate-ping'
                  : isUnlocked
                  ? 'bg-[#fc6c00]'
                  : isVerifying
                  ? 'bg-[#ff9d47] animate-pulse'
                  : isArmed
                  ? 'bg-[#fc6c00]'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-bold text-white uppercase truncate">
              {state === 'idle' && 'SYS_IDLE // ESCROW_LOCKED'}
              {state === 'typing' && 'ARMED // INPUT_CALIBRATION'}
              {state === 'verifying' && `ALIGNING // [${Math.round(progress)}%]`}
              {state === 'unlocked' && 'VAULT_OPEN // AUTH_VERIFIED'}
              {state === 'error' && 'HALT // INTEGRITY_MISMATCH'}
            </span>
          </div>

          <span className="text-[#ff9d47] font-mono text-[9px] shrink-0 ml-2">
            {liveHash.substring(0, 10)}...{liveHash.substring(58)}
          </span>
        </div>
      </div>
    </div>
  );
}
