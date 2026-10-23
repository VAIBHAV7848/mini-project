'use client';

/**
 * Procedural Web Audio API sound synthesis for the Mechanical Escrow Vault.
 * Zero external audio files (0kb download, zero network latency).
 * Pure synthesis using oscillators, gain nodes, and biquad filters.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
}

export function getIsMuted(): boolean {
  return isMuted;
}

/**
 * Mechanical Tumbler Ratchet Click (fired as the user types credentials)
 */
export function playTumblerClick(pitchVariation = 1.0) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // High metal resonant click
    osc.type = 'triangle';
    const baseFreq = 850 * pitchVariation * (0.95 + Math.random() * 0.1);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    // Bandpass to give metallic chime feel
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(8, now);

    // Ultra-snappy envelope (35ms total)
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Gracefully handle browser audio restrictions
  }
}

/**
 * Vault Concentric Ring Rotor Tick (fired during rapid verification alignment)
 */
export function playRotorTick(step = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = 420 + (step % 5) * 60;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.025);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {}
}

/**
 * Heavy Hydraulic Pneumatic Unlock + Steel Clamp Thud
 */
export function playVaultUnlock() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Hydraulic whoosh (white noise burst through sweeping lowpass)
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(250, now + 0.22);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.25);

    // 2. Heavy steel bolt impact (sub-bass drop + resonant metallic thud)
    const boltOsc = ctx.createOscillator();
    boltOsc.type = 'sine';
    boltOsc.frequency.setValueAtTime(140, now + 0.12);
    boltOsc.frequency.exponentialRampToValueAtTime(32, now + 0.38);

    const boltGain = ctx.createGain();
    boltGain.gain.setValueAtTime(0.001, now);
    boltGain.gain.setValueAtTime(0.28, now + 0.12);
    boltGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    boltOsc.connect(boltGain);
    boltGain.connect(ctx.destination);

    boltOsc.start(now + 0.12);
    boltOsc.stop(now + 0.48);

    // 3. Resonant harmonic chime (positive authorization tone)
    const chimeOsc = ctx.createOscillator();
    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(523.25, now + 0.18); // C5
    chimeOsc.frequency.setValueAtTime(659.25, now + 0.26); // E5
    chimeOsc.frequency.setValueAtTime(783.99, now + 0.34); // G5

    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.setValueAtTime(0.14, now + 0.18);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    chimeOsc.start(now + 0.18);
    chimeOsc.stop(now + 0.72);
  } catch {}
}

/**
 * Mechanical Interlock Rejection / Error Solenoid Buzz
 */
export function playVaultError() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Dual dissonant square wave pulse
    [0, 0.07, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now + offset); // Low warning buzz

      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.06);
    });
  } catch {}
}

/**
 * Tactile Micro-Switch Click (fired for persona card clicks & toggles)
 */
export function playSwitchClick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.02);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch {}
}
