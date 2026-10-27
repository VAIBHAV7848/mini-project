/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import gsap from 'gsap';
import { InteractiveMonkeyAvatar } from '@/components/auth/InteractiveMonkeyAvatar';

// Mock GSAP to isolate coordinate mathematics, timeline orchestration, and state transitions in jsdom
const { mockTimeline, gsapMock } = vi.hoisted(() => {
  const toMock = vi.fn((_target?: any, _vars?: any, _position?: any) => ({ kill: vi.fn() }));
  const setMock = vi.fn((_target?: any, _vars?: any, _position?: any) => {});
  const killTweensOfMock = vi.fn((_targets?: any) => {});

  const mockTimeline = {
    to: vi.fn(),
    set: vi.fn(),
    kill: vi.fn(),
  };

  const gsapMock = {
    set: setMock,
    to: toMock,
    killTweensOf: killTweensOfMock,
    timeline: vi.fn(() => mockTimeline),
  };

  mockTimeline.to.mockImplementation((target: any, vars: any, position?: any) => {
    toMock(target, vars, position);
    return mockTimeline;
  });
  mockTimeline.set.mockImplementation((target: any, vars: any, position?: any) => {
    setMock(target, vars, position);
    return mockTimeline;
  });
  mockTimeline.kill.mockImplementation(() => mockTimeline);

  return { mockTimeline, gsapMock };
});

vi.mock('gsap', () => {
  return {
    default: gsapMock,
    ...gsapMock,
  };
});

describe('Engine 04 (Web) — InteractiveMonkeyAvatar Motion Suite', () => {
  const mockedGsap = vi.mocked(gsap);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const getAvatarElements = (container: HTMLElement) => ({
    svg: container.querySelector('svg'),
    armL: container.querySelector('.armL') as SVGGElement,
    armR: container.querySelector('.armR') as SVGGElement,
    twoFingers: container.querySelector('.twoFingers') as SVGGElement,
    eyeL: container.querySelector('.eyeL') as SVGGElement,
    eyeR: container.querySelector('.eyeR') as SVGGElement,
    pupilL: container.querySelector('.eyeballL') as SVGGElement,
    pupilR: container.querySelector('.eyeballR') as SVGGElement,
    closedEyeL: container.querySelector('.closedEyeL') as SVGGElement,
    closedEyeR: container.querySelector('.closedEyeR') as SVGGElement,
    nose: container.querySelector('.nose') as SVGPathElement,
    mouth: container.querySelector('.mouth') as SVGGElement,
    chin: container.querySelector('.chin') as SVGPathElement,
    face: container.querySelector('.face') as SVGPathElement,
    eyebrow: container.querySelector('.eyebrow') as SVGGElement,
    tooth: container.querySelector('.tooth') as SVGPathElement,
    tongue: container.querySelector('.tongue') as SVGGElement,
    bodyNormal: container.querySelector('.body > path:nth-of-type(2)') as SVGPathElement,
    bodyChanged: container.querySelector('.body > path:nth-of-type(1)') as SVGPathElement,
    outerEarL: container.querySelector('.earL .outerEar') as SVGGElement,
    outerEarR: container.querySelector('.earR .outerEar') as SVGGElement,
    earHairL: container.querySelector('.earL .earHair') as SVGGElement,
    earHairR: container.querySelector('.earR .earHair') as SVGGElement,
    hair: container.querySelector('.hair') as SVGPathElement,
  });

  describe('1. Idle State & Initial Resting Pose', () => {
    it('renders in idle state with arms hidden and resting below circular boundary', () => {
      const { container } = render(<InteractiveMonkeyAvatar />);
      const { armL, armR, twoFingers, mouth } = getAvatarElements(container);

      expect(armL).not.toBeNull();
      expect(armR).not.toBeNull();
      expect(twoFingers).not.toBeNull();

      expect(mockedGsap.set).toHaveBeenCalledWith(
        armL,
        expect.objectContaining({
          x: -93,
          y: 220,
          rotation: 105,
          transformOrigin: 'top left',
        })
      );

      expect(mockedGsap.set).toHaveBeenCalledWith(
        armR,
        expect.objectContaining({
          x: -93,
          y: 220,
          rotation: -105,
          transformOrigin: 'top right',
        })
      );

      expect(mockedGsap.set).toHaveBeenCalledWith(
        mouth,
        expect.objectContaining({ transformOrigin: 'center center' })
      );

      expect(mockedGsap.set).toHaveBeenCalledWith(
        twoFingers,
        expect.objectContaining({ transformOrigin: 'bottom left', rotation: 0, x: 0, y: 0 })
      );
    });

    it('positions eyes and facial features in neutral coordinates when idle', () => {
      const { container } = render(<InteractiveMonkeyAvatar emailValue="" isEmailFocused={false} />);
      const { eyeL, eyeR, nose, mouth, chin } = getAvatarElements(container);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        eyeL,
        expect.objectContaining({ x: 0, y: 0, duration: 0.85, ease: 'expo.out' })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        eyeR,
        expect.objectContaining({ x: 0, y: 0, duration: 0.85, ease: 'expo.out' })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        nose,
        expect.objectContaining({ x: 0, y: 0, rotation: 0, duration: 0.85 })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        mouth,
        expect.objectContaining({ x: 0, y: 0, rotation: 0, scale: 1, duration: 0.85 })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        chin,
        expect.objectContaining({ x: 0, y: 0, scaleY: 1, duration: 0.85 })
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toContain('⚡ Mascot Sentinel: Ready for input');
    });
  });

  describe('2. Email Focus & Caret Tracking', () => {
    it('triggers face tracking when email input is focused and typed', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar emailValue="" isEmailFocused={false} />
      );
      const { eyeL, eyeR, nose, mouth, chin, face, eyebrow } = getAvatarElements(container);

      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar emailValue="client@escrow.local" isEmailFocused={true} />);

      const eyeLCall = mockedGsap.to.mock.calls.find((call) => call[0] === eyeL);
      const eyeRCall = mockedGsap.to.mock.calls.find((call) => call[0] === eyeR);
      const noseCall = mockedGsap.to.mock.calls.find((call) => call[0] === nose);
      const mouthCall = mockedGsap.to.mock.calls.find((call) => call[0] === mouth);
      const chinCall = mockedGsap.to.mock.calls.find((call) => call[0] === chin);
      const faceCall = mockedGsap.to.mock.calls.find((call) => call[0] === face);
      const eyebrowCall = mockedGsap.to.mock.calls.find((call) => call[0] === eyebrow);

      expect(eyeLCall).toBeDefined();
      expect(eyeRCall).toBeDefined();
      expect(noseCall).toBeDefined();
      expect(mouthCall).toBeDefined();
      expect(chinCall).toBeDefined();
      expect(faceCall).toBeDefined();
      expect(eyebrowCall).toBeDefined();

      const eyeVars = eyeLCall![1] as Record<string, unknown>;
      expect(Number.isNaN(eyeVars.x)).toBe(false);
      expect(Number.isNaN(eyeVars.y)).toBe(false);
      expect(Number.isFinite(eyeVars.x)).toBe(true);
      expect(Number.isFinite(eyeVars.y)).toBe(true);
    });

    it('triggers mouth excitement scaling when @ symbol is typed', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar emailValue="client" isEmailFocused={true} />
      );
      const { mouth, tooth, tongue } = getAvatarElements(container);

      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar emailValue="client@" isEmailFocused={true} />);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        mouth,
        expect.objectContaining({
          scale: 1.15,
          duration: 0.4,
          ease: 'back.out(2)',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        tooth,
        expect.objectContaining({ y: -2, duration: 0.3 })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        tongue,
        expect.objectContaining({ y: 2, duration: 0.3 })
      );
    });
  });

  describe('3. Password Focus & Arm Shielding', () => {
    it('orchestrates Stage 1 orienting anticipation (looking up) before arm sweep', () => {
      const { container, rerender } = render(<InteractiveMonkeyAvatar isPasswordFocused={false} />);
      const { eyeL, eyeR, eyebrow, face, nose, mouth, chin, hair, outerEarL, earHairL, armL, armR } =
        getAvatarElements(container);

      mockTimeline.to.mockClear();
      mockTimeline.set.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} />);

      expect(mockedGsap.timeline).toHaveBeenCalled();

      // Saccadic eye movement looking up normally at t = 0
      expect(mockTimeline.to).toHaveBeenCalledWith(
        [eyeL, eyeR],
        expect.objectContaining({
          x: 0,
          y: -7.5,
          duration: 0.16,
          ease: 'power3.out',
        }),
        0
      );

      // Cranial pitch upward at t = 0.02
      expect(mockTimeline.to).toHaveBeenCalledWith(
        eyebrow,
        expect.objectContaining({ x: 0, y: -4.5, skewX: 0, duration: 0.2 }),
        0.02
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        face,
        expect.objectContaining({ x: 0, y: -4.0, skewX: 0, duration: 0.22 }),
        0.02
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        nose,
        expect.objectContaining({ x: 0, y: -5.5, rotation: 0, duration: 0.22 }),
        0.02
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        mouth,
        expect.objectContaining({ x: 0, y: -3.5, scale: 0.94, duration: 0.22 }),
        0.02
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        chin,
        expect.objectContaining({ x: 0, y: -2.5, scaleY: 0.92, duration: 0.22 }),
        0.02
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        hair,
        expect.objectContaining({ x: 0, y: -2.5, scaleY: 1.05, duration: 0.22 }),
        0.02
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        [outerEarL, earHairL],
        expect.objectContaining({ x: 0, y: 3.0, duration: 0.22 }),
        0.02
      );

      // Arms autoAlpha prepared at t = 0.12
      expect(mockTimeline.set).toHaveBeenCalledWith(
        [armL, armR],
        expect.objectContaining({ autoAlpha: 1 }),
        0.12
      );
    });

    it('slides arms up to occlude eyes at canonical y: 10 with natural human delay and shoulder contraction', () => {
      const { container, rerender } = render(<InteractiveMonkeyAvatar isPasswordFocused={false} />);
      const { armL, armR, bodyNormal, bodyChanged } = getAvatarElements(container);

      mockTimeline.to.mockClear();
      mockTimeline.set.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} />);

      // Left arm rises at t = 0.16s to occlude eyes at canonical y: 10
      expect(mockTimeline.to).toHaveBeenCalledWith(
        armL,
        expect.objectContaining({
          x: -93,
          y: 10,
          rotation: 0,
          duration: 0.44,
          transformOrigin: 'top left',
          ease: 'cubic-bezier(0.28, 0, 0.18, 1)',
        }),
        0.16
      );

      // Right arm rises at t = 0.22s with organic primate delay to canonical y: 10
      expect(mockTimeline.to).toHaveBeenCalledWith(
        armR,
        expect.objectContaining({
          x: -93,
          y: 10,
          rotation: 0,
          duration: 0.46,
          transformOrigin: 'top right',
          ease: 'cubic-bezier(0.28, 0, 0.18, 1)',
        }),
        0.22
      );

      // Verify that arms do NOT stop at forehead y: 0
      expect(mockTimeline.to).not.toHaveBeenCalledWith(
        armL,
        expect.objectContaining({ y: 0 }),
        expect.anything()
      );
      expect(mockTimeline.to).not.toHaveBeenCalledWith(
        armR,
        expect.objectContaining({ y: 0 }),
        expect.anything()
      );

      // Shoulder muscular contraction at t = 0.2s
      expect(mockTimeline.to).toHaveBeenCalledWith(
        bodyNormal,
        expect.objectContaining({ opacity: 0, duration: 0.32 }),
        0.2
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        bodyChanged,
        expect.objectContaining({ opacity: 1, duration: 0.32 }),
        0.2
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toContain('🙈 Arms covering eyes (privacy mode)');
    });

    it('closes pupils smoothly (scaleY: 0) and reveals closed eyelid arcs during password focus', () => {
      const { container, rerender } = render(<InteractiveMonkeyAvatar isPasswordFocused={false} />);
      const { pupilL, pupilR, closedEyeL, closedEyeR } = getAvatarElements(container);

      mockTimeline.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} />);

      expect(mockTimeline.to).toHaveBeenCalledWith(
        [pupilL, pupilR],
        expect.objectContaining({
          scaleY: 0,
          y: -4.0,
          duration: 0.14,
          transformOrigin: 'center center',
          ease: 'power2.inOut',
        }),
        0.24
      );

      expect(mockTimeline.to).toHaveBeenCalledWith(
        [closedEyeL, closedEyeR],
        expect.objectContaining({
          opacity: 1,
          y: 0,
          duration: 0.14,
          ease: 'power2.out',
        }),
        0.24
      );
    });
  });

  describe('4. Peeking Mechanism via TwoFingers', () => {
    it('rotates twoFingers to 30deg and opens left pupil aperture (scaleY: 1) when showPassword is true', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={false} />
      );
      const { twoFingers, pupilL } = getAvatarElements(container);

      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={true} />);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        twoFingers,
        expect.objectContaining({
          rotation: 30,
          x: -9,
          y: -2,
          duration: 0.32,
          transformOrigin: 'bottom left',
          ease: 'power2.inOut',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        pupilL,
        expect.objectContaining({
          scaleY: 1,
          opacity: 1,
          y: 0,
          duration: 0.25,
          transformOrigin: 'center center',
          ease: 'power2.out',
        })
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toContain('👀 Peeking through fingers...');
    });

    it('snaps fingers closed and re-closes pupil (scaleY: 0) when showPassword is turned off', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={true} />
      );
      const { twoFingers, pupilL } = getAvatarElements(container);

      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={false} />);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        twoFingers,
        expect.objectContaining({
          rotation: 0,
          x: 0,
          y: 0,
          duration: 0.28,
          transformOrigin: 'bottom left',
          ease: 'power2.inOut',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        pupilL,
        expect.objectContaining({
          scaleY: 0,
          y: -4.0,
          duration: 0.2,
          transformOrigin: 'center center',
          ease: 'power2.in',
        })
      );
    });
  });

  describe('5. Password Blur & Biomechanical Decoupled Arc Uncover', () => {
    it('drops arms with gravity acceleration, relaxes shoulders, and snaps peek shut', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={true} />
      );
      const { armL, armR, twoFingers, bodyNormal, bodyChanged } = getAvatarElements(container);

      mockTimeline.to.mockClear();
      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={false} />);

      // Peek fingers reset immediately on blur
      expect(mockedGsap.to).toHaveBeenCalledWith(
        twoFingers,
        expect.objectContaining({
          rotation: 0,
          x: 0,
          y: 0,
          duration: 0.25,
          transformOrigin: 'bottom left',
          ease: 'power2.out',
        })
      );

      // Left arm drops at t = 0
      expect(mockTimeline.to).toHaveBeenCalledWith(
        armL,
        expect.objectContaining({
          x: -93,
          y: 220,
          rotation: 105,
          duration: 0.55,
          transformOrigin: 'top left',
          ease: 'power2.in',
        }),
        0
      );

      // Right arm drops at t = 0.04s with onComplete hiding callback
      expect(mockTimeline.to).toHaveBeenCalledWith(
        armR,
        expect.objectContaining({
          x: -93,
          y: 220,
          rotation: -105,
          duration: 0.55,
          transformOrigin: 'top right',
          ease: 'power2.in',
          onComplete: expect.any(Function),
        }),
        0.04
      );

      // Shoulders relax at t = 0.1s
      expect(mockTimeline.to).toHaveBeenCalledWith(
        bodyNormal,
        expect.objectContaining({ opacity: 1, duration: 0.35, ease: 'power2.out' }),
        0.1
      );
      expect(mockTimeline.to).toHaveBeenCalledWith(
        bodyChanged,
        expect.objectContaining({ opacity: 0, duration: 0.35, ease: 'power2.out' }),
        0.1
      );
    });

    it('smoothly reopens pupils to scaleY: 1 and lifts closed eyelids on password blur', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} />
      );
      const { pupilL, pupilR, closedEyeL, closedEyeR } = getAvatarElements(container);

      mockTimeline.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={false} />);

      expect(mockTimeline.to).toHaveBeenCalledWith(
        [closedEyeL, closedEyeR],
        expect.objectContaining({
          opacity: 0,
          y: -2,
          duration: 0.14,
          ease: 'power2.in',
        }),
        0.14
      );

      expect(mockTimeline.to).toHaveBeenCalledWith(
        [pupilL, pupilR],
        expect.objectContaining({
          scaleY: 1,
          y: 0,
          x: 0,
          duration: 0.2,
          transformOrigin: 'center center',
          ease: 'power2.out',
        }),
        0.18
      );
    });
  });

  describe('6. Reduced Motion Fallback Behavior (prefers-reduced-motion: reduce)', () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('applies immediate instant-cut pose with canonical y: 10 and scaleY: 0 without running timeline on password focus', () => {
      const { container, rerender } = render(<InteractiveMonkeyAvatar isPasswordFocused={false} />);
      const { armL, armR, pupilL, pupilR, bodyNormal, bodyChanged } = getAvatarElements(container);

      mockedGsap.set.mockClear();
      mockedGsap.timeline.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} />);

      // Timeline orchestration must be completely bypassed in reduced motion
      expect(mockedGsap.timeline).not.toHaveBeenCalled();

      // Arms positioned instantly at occluding coordinates y: 10
      expect(mockedGsap.set).toHaveBeenCalledWith(
        [armL, armR],
        expect.objectContaining({ autoAlpha: 1, x: -93, y: 10, rotation: 0 })
      );
      expect(mockedGsap.set).not.toHaveBeenCalledWith(
        [armL, armR],
        expect.objectContaining({ y: 0 })
      );

      // Pupils closed instantly
      expect(mockedGsap.set).toHaveBeenCalledWith(
        [pupilL, pupilR],
        expect.objectContaining({ scaleY: 0, y: -4 })
      );

      // Shoulders contracted instantly
      expect(mockedGsap.set).toHaveBeenCalledWith(bodyNormal, { opacity: 0 });
      expect(mockedGsap.set).toHaveBeenCalledWith(bodyChanged, { opacity: 1 });
    });

    it('applies immediate instant-reset pose with y: 220 and scaleY: 1 on password blur', () => {
      const { container, rerender } = render(<InteractiveMonkeyAvatar isPasswordFocused={true} />);
      const { armL, armR, pupilL, pupilR, bodyNormal, bodyChanged } = getAvatarElements(container);

      mockedGsap.set.mockClear();
      mockedGsap.timeline.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={false} />);

      // Timeline must not be used on uncover in reduced motion
      expect(mockedGsap.timeline).not.toHaveBeenCalled();

      // Arms reset instantly below circular boundary
      expect(mockedGsap.set).toHaveBeenCalledWith(
        [armL, armR],
        expect.objectContaining({
          autoAlpha: 0,
          x: -93,
          y: 220,
        })
      );

      // Pupils reopened instantly
      expect(mockedGsap.set).toHaveBeenCalledWith(
        [pupilL, pupilR],
        expect.objectContaining({ scaleY: 1, y: 0, x: 0 })
      );

      // Shoulders relaxed instantly
      expect(mockedGsap.set).toHaveBeenCalledWith(bodyNormal, { opacity: 1 });
      expect(mockedGsap.set).toHaveBeenCalledWith(bodyChanged, { opacity: 0 });
    });
  });

  describe('7. Customization, Blinking & Unmount Cleanup', () => {
    it('cleans up all GSAP tweens and timers on unmount', () => {
      const { container, unmount } = render(<InteractiveMonkeyAvatar />);
      const { armL, armR, twoFingers, mouth } = getAvatarElements(container);

      unmount();

      expect(mockedGsap.killTweensOf).toHaveBeenCalledWith(
        expect.arrayContaining([armL, armR, twoFingers, mouth])
      );
    });
  });
});
