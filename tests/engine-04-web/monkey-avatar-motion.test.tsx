/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import gsap from 'gsap';
import { InteractiveMonkeyAvatar } from '@/components/auth/InteractiveMonkeyAvatar';

// Mock GSAP to isolate coordinate mathematics and state transitions in jsdom
vi.mock('gsap', () => {
  const gsapMock = {
    set: vi.fn(),
    to: vi.fn(() => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
  };
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
    nose: container.querySelector('.nose') as SVGPathElement,
    mouth: container.querySelector('.mouth') as SVGGElement,
    chin: container.querySelector('.chin') as SVGPathElement,
    face: container.querySelector('.face') as SVGPathElement,
    eyebrow: container.querySelector('.eyebrow') as SVGGElement,
    tooth: container.querySelector('.tooth') as SVGPathElement,
    tongue: container.querySelector('.tongue') as SVGGElement,
    bodyNormal: container.querySelector('.body > path:nth-of-type(2)') as SVGPathElement,
    bodyChanged: container.querySelector('.body > path:nth-of-type(1)') as SVGPathElement,
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

      // Focus email and type
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
    it('slides arms up to cover eyes with natural human delay and shoulder contraction', () => {
      const { container, rerender } = render(<InteractiveMonkeyAvatar isPasswordFocused={false} />);
      const { armL, armR, bodyNormal, bodyChanged } = getAvatarElements(container);

      mockedGsap.set.mockClear();
      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} />);

      expect(mockedGsap.set).toHaveBeenCalledWith(
        [armL, armR],
        expect.objectContaining({ autoAlpha: 1 })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        armL,
        expect.objectContaining({
          x: -93,
          y: 0,
          rotation: 0,
          duration: 0.45,
          ease: 'power1.out',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        armR,
        expect.objectContaining({
          x: -93,
          y: 0,
          rotation: 0,
          duration: 0.45,
          delay: 0.1,
          ease: 'power1.out',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        bodyNormal,
        expect.objectContaining({ opacity: 0, duration: 0.4 })
      );
      expect(mockedGsap.to).toHaveBeenCalledWith(
        bodyChanged,
        expect.objectContaining({ opacity: 1, duration: 0.4 })
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toContain('🙈 Arms covering eyes (privacy mode)');
    });
  });

  describe('4. Peeking Mechanism via TwoFingers', () => {
    it('rotates twoFingers to 30 to reveal eye aperture when showPassword is true during password focus', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={false} />
      );
      const { twoFingers } = getAvatarElements(container);

      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={true} />);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        twoFingers,
        expect.objectContaining({
          rotation: 30,
          x: -9,
          y: -2,
          duration: 0.35,
          transformOrigin: 'bottom left',
          ease: 'power2.inOut',
        })
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toContain('👀 Peeking through fingers...');
    });

    it('snaps fingers closed when showPassword is turned off', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={true} />
      );
      const { twoFingers } = getAvatarElements(container);

      mockedGsap.to.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={true} isShowPassword={false} />);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        twoFingers,
        expect.objectContaining({
          rotation: 0,
          x: 0,
          y: 0,
          duration: 0.35,
          transformOrigin: 'bottom left',
          ease: 'power2.inOut',
        })
      );
    });
  });

  describe('5. Password Blur & Biomechanical Decoupled Arc Uncover', () => {
    it('drops arms with vertical translation starting at t=0 and rotation delayed to t=0.1s', () => {
      const { container, rerender } = render(
        <InteractiveMonkeyAvatar isPasswordFocused={true} />
      );
      const { armL, armR, bodyNormal, bodyChanged } = getAvatarElements(container);

      mockedGsap.to.mockClear();
      mockedGsap.set.mockClear();

      rerender(<InteractiveMonkeyAvatar isPasswordFocused={false} />);

      expect(mockedGsap.to).toHaveBeenCalledWith(
        armL,
        expect.objectContaining({
          x: -93,
          y: 220,
          duration: 1.35,
          ease: 'power1.out',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        armL,
        expect.objectContaining({
          rotation: 105,
          duration: 1.35,
          delay: 0.1,
          ease: 'power1.out',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        armR,
        expect.objectContaining({
          x: -93,
          y: 220,
          duration: 1.35,
          ease: 'power1.out',
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        armR,
        expect.objectContaining({
          rotation: -105,
          duration: 1.35,
          delay: 0.1,
          ease: 'power1.out',
          onComplete: expect.any(Function),
        })
      );

      expect(mockedGsap.to).toHaveBeenCalledWith(
        bodyNormal,
        expect.objectContaining({ opacity: 1, duration: 0.45 })
      );
      expect(mockedGsap.to).toHaveBeenCalledWith(
        bodyChanged,
        expect.objectContaining({ opacity: 0, duration: 0.45 })
      );
    });
  });

  describe('6. Customization, Blinking & Unmount Cleanup', () => {
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
