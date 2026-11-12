'use client';

import React, { useEffect, useRef, useCallback, useId } from 'react';
import gsap from 'gsap';
import { getCaretCoordinates } from '@/lib/caret-coords';

export interface InteractiveMonkeyAvatarProps {
  emailValue?: string;
  emailInputRef?: React.RefObject<HTMLInputElement | null>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isEmailFocused?: boolean;
  isPasswordFocused?: boolean;
  isShowPassword?: boolean;
  size?: number;
  className?: string;
  caption?: string;
  skinTone?: 'warm' | 'cool';
  glowColor?: string;
}

export function InteractiveMonkeyAvatar({
  emailValue = '',
  emailInputRef,
  inputRef,
  isEmailFocused = false,
  isPasswordFocused = false,
  isShowPassword = false,
  size = 220,
  className = '',
  caption,
  skinTone = 'warm',
  glowColor = '#fc6c00',
}: InteractiveMonkeyAvatarProps) {
  const uid = useId().replace(/:/g, '');
  const armMaskId = `monkeyArmMask_${uid}`;
  const mouthMaskId = `monkeyMouthMask_${uid}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG element references
  const armLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const twoFingersRef = useRef<SVGGElement>(null);

  // Separate tracking groups from blinking pupils to prevent matrix collisions
  const eyeLRef = useRef<SVGGElement>(null);
  const eyeRRef = useRef<SVGGElement>(null);
  const pupilLRef = useRef<SVGGElement>(null);
  const pupilRRef = useRef<SVGGElement>(null);
  const closedEyeLRef = useRef<SVGGElement>(null);
  const closedEyeRRef = useRef<SVGGElement>(null);
  const peekOpenedRef = useRef(false);

  const noseRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGGElement>(null);
  const toothRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGGElement>(null);
  const chinRef = useRef<SVGPathElement>(null);
  const faceRef = useRef<SVGPathElement>(null);
  const eyebrowRef = useRef<SVGGElement>(null);

  const outerEarLRef = useRef<SVGGElement>(null);
  const outerEarRRef = useRef<SVGGElement>(null);
  const earHairLRef = useRef<SVGGElement>(null);
  const earHairRRef = useRef<SVGGElement>(null);
  const hairRef = useRef<SVGPathElement>(null);

  const bodyNormalRef = useRef<SVGPathElement>(null);
  const bodyChangedRef = useRef<SVGPathElement>(null);

  const eyesCoveredRef = useRef(false);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const coverTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const effectiveInputRef = emailInputRef || inputRef;
  const skinColor =
    skinTone === 'cool' ? 'var(--monkey-skin-cool)' : 'var(--monkey-skin-warm)';
  const nailColor = skinTone === 'cool' ? '#a9ddf3' : '#fc6c00';

  // 1. Initial GSAP Rigging & Resting Poses
  useEffect(() => {
    const armL = armLRef.current;
    const armR = armRRef.current;
    const twoFingers = twoFingersRef.current;
    const mouth = mouthRef.current;
    const pupilL = pupilLRef.current;
    const pupilR = pupilRRef.current;

    if (!armL || !armR || !twoFingers || !mouth) return;

    // Resting arms hidden below circular clip boundary
    gsap.set(armL, {
      x: -93,
      y: 220,
      rotation: 105,
      transformOrigin: 'top left',
      autoAlpha: 0,
    });

    gsap.set(armR, {
      x: -93,
      y: 220,
      rotation: -105,
      transformOrigin: 'top right',
      autoAlpha: 0,
    });

    gsap.set(twoFingers, {
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: 'bottom left',
    });

    gsap.set(mouth, { transformOrigin: 'center center' });
    if (pupilL && pupilR) {
      gsap.set([pupilL, pupilR], { transformOrigin: 'center center', scaleX: 1, scaleY: 1, opacity: 1 });
    }
    if (closedEyeLRef.current && closedEyeRRef.current) {
      gsap.set([closedEyeLRef.current, closedEyeRRef.current], { opacity: 0, y: -2 });
    }

    // Natural blinking loop (random schedule 2.5s - 5s)
    const scheduleBlink = () => {
      const delay = Math.random() * 2500 + 2500;
      blinkTimerRef.current = setTimeout(() => {
        if (!eyesCoveredRef.current && pupilLRef.current && pupilRRef.current) {
          gsap.to([pupilLRef.current, pupilRRef.current], {
            duration: 0.08,
            scaleY: 0,
            yoyo: true,
            repeat: 1,
            transformOrigin: '50% 85%',
            ease: 'power1.inOut',
          });
          if (closedEyeLRef.current && closedEyeRRef.current) {
            gsap.to([closedEyeLRef.current, closedEyeRRef.current], {
              duration: 0.08,
              opacity: 1,
              y: 0,
              yoyo: true,
              repeat: 1,
              ease: 'power1.inOut',
            });
          }
        }
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      gsap.killTweensOf([
        armL,
        armR,
        twoFingers,
        mouth,
        eyeLRef.current,
        eyeRRef.current,
        pupilLRef.current,
        pupilRRef.current,
        closedEyeLRef.current,
        closedEyeRRef.current,
        noseRef.current,
        chinRef.current,
        faceRef.current,
        eyebrowRef.current,
        outerEarLRef.current,
        outerEarRRef.current,
        earHairLRef.current,
        earHairRRef.current,
        hairRef.current,
        toothRef.current,
        tongueRef.current,
        bodyNormalRef.current,
        bodyChangedRef.current,
      ]);
    };
  }, []);

  // 2. High-Precision Look-At Calculation
  const lookAtPoint = useCallback((targetX: number, targetY: number, hasAt: boolean) => {
    if (eyesCoveredRef.current || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = svgRect.width / 200;

    // Feature centers in viewport coordinates
    const eyeLCoords = { x: svgRect.left + 85.5 * scale, y: svgRect.top + 78.5 * scale };
    const eyeRCoords = { x: svgRect.left + 114.5 * scale, y: svgRect.top + 78.5 * scale };
    const noseCoords = { x: svgRect.left + 97.7 * scale, y: svgRect.top + 81 * scale };
    const mouthCoords = { x: svgRect.left + 100 * scale, y: svgRect.top + 101 * scale };
    const screenCenter = svgRect.left + svgRect.width / 2;

    // Inverted vectors matching original trigonometry
    const eyeLAngle = Math.atan2(eyeLCoords.y - targetY, eyeLCoords.x - targetX);
    const eyeRAngle = Math.atan2(eyeRCoords.y - targetY, eyeRCoords.x - targetX);
    const noseAngle = Math.atan2(noseCoords.y - targetY, noseCoords.x - targetX);
    const mouthAngle = Math.atan2(mouthCoords.y - targetY, mouthCoords.x - targetX);

    const eyeLX = Math.cos(eyeLAngle) * 20;
    const eyeLY = Math.sin(eyeLAngle) * 10;
    const eyeRX = Math.cos(eyeRAngle) * 20;
    const eyeRY = Math.sin(eyeRAngle) * 10;

    const noseX = Math.cos(noseAngle) * 23;
    const noseY = Math.sin(noseAngle) * 10;
    const mouthX = Math.cos(mouthAngle) * 23;
    const mouthY = Math.sin(mouthAngle) * 10;
    const mouthR = Math.cos(mouthAngle) * 6;

    const chinX = mouthX * 0.8;
    const chinY = mouthY * 0.5;
    const dFromC = screenCenter - targetX;
    const chinS = Math.max(0.5, 1 - (Math.abs(dFromC) * 0.15) / 100);

    const faceX = mouthX * 0.3;
    const faceY = mouthY * 0.4;
    const faceSkew = Math.cos(mouthAngle) * 5;
    const eyebrowSkew = Math.cos(mouthAngle) * 25;

    const outerEarX = Math.cos(mouthAngle) * 4;
    const outerEarY = Math.cos(mouthAngle) * 5;
    const hairX = Math.cos(mouthAngle) * 6;
    const hairS = 1.2;

    const duration = 0.65;
    const ease = 'expo.out';

    if (eyeLRef.current) gsap.to(eyeLRef.current, { x: -eyeLX, y: -eyeLY, duration, ease });
    if (eyeRRef.current) gsap.to(eyeRRef.current, { x: -eyeRX, y: -eyeRY, duration, ease });
    if (noseRef.current) gsap.to(noseRef.current, { x: -noseX, y: -noseY, rotation: mouthR, transformOrigin: 'center center', duration, ease });
    if (mouthRef.current) gsap.to(mouthRef.current, { x: -mouthX, y: -mouthY, rotation: mouthR, transformOrigin: 'center center', duration, ease });
    if (chinRef.current) gsap.to(chinRef.current, { x: -chinX, y: -chinY, scaleY: chinS, duration, ease });
    if (faceRef.current) gsap.to(faceRef.current, { x: -faceX, y: -faceY, skewX: -faceSkew, transformOrigin: 'center top', duration, ease });
    if (eyebrowRef.current) gsap.to(eyebrowRef.current, { x: -faceX, y: -faceY, skewX: -eyebrowSkew, transformOrigin: 'center top', duration, ease });

    // 3D Cranial and Ear Parallax
    if (outerEarLRef.current) gsap.to(outerEarLRef.current, { x: outerEarX, y: -outerEarY, duration, ease });
    if (outerEarRRef.current) gsap.to(outerEarRRef.current, { x: outerEarX, y: outerEarY, duration, ease });
    if (earHairLRef.current) gsap.to(earHairLRef.current, { x: -outerEarX, y: -outerEarY, duration, ease });
    if (earHairRRef.current) gsap.to(earHairRRef.current, { x: -outerEarX, y: outerEarY, duration, ease });
    if (hairRef.current) gsap.to(hairRef.current, { x: hairX, scaleY: hairS, transformOrigin: 'center bottom', duration, ease });

    // Dynamic mouth reaction on '@'
    if (mouthRef.current) {
      if (hasAt) {
        gsap.to(mouthRef.current, { scale: 1.15, transformOrigin: 'center center', duration: 0.4, ease: 'back.out(2)' });
        if (toothRef.current) gsap.to(toothRef.current, { y: -2, duration: 0.3 });
        if (tongueRef.current) gsap.to(tongueRef.current, { y: 2, duration: 0.3 });
      } else {
        gsap.to(mouthRef.current, { scale: 1, duration: 0.4, ease: 'power2.out' });
        if (toothRef.current) gsap.to(toothRef.current, { y: 0, duration: 0.3 });
        if (tongueRef.current) gsap.to(tongueRef.current, { y: 0, duration: 0.3 });
      }
    }
  }, []);

  // 3. Reset Face to Neutral Pose
  const resetFace = useCallback(() => {
    if (eyesCoveredRef.current) return;
    const duration = 0.85;
    const ease = 'expo.out';

    if (eyeLRef.current) gsap.to(eyeLRef.current, { x: 0, y: 0, duration, ease });
    if (eyeRRef.current) gsap.to(eyeRRef.current, { x: 0, y: 0, duration, ease });
    if (pupilLRef.current) gsap.to(pupilLRef.current, { x: 0, y: 0, scaleY: 1, scaleX: 1, opacity: 1, duration, ease });
    if (pupilRRef.current) gsap.to(pupilRRef.current, { x: 0, y: 0, scaleY: 1, scaleX: 1, opacity: 1, duration, ease });
    if (closedEyeLRef.current) gsap.to(closedEyeLRef.current, { opacity: 0, y: -2, duration: 0.3 });
    if (closedEyeRRef.current) gsap.to(closedEyeRRef.current, { opacity: 0, y: -2, duration: 0.3 });
    if (noseRef.current) gsap.to(noseRef.current, { x: 0, y: 0, rotation: 0, duration, ease });
    if (mouthRef.current) gsap.to(mouthRef.current, { x: 0, y: 0, rotation: 0, scale: 1, duration, ease });
    if (chinRef.current) gsap.to(chinRef.current, { x: 0, y: 0, scaleY: 1, duration, ease });
    if (faceRef.current) gsap.to(faceRef.current, { x: 0, y: 0, skewX: 0, duration, ease });
    if (eyebrowRef.current) gsap.to(eyebrowRef.current, { x: 0, y: 0, skewX: 0, duration, ease });

    if (outerEarLRef.current) gsap.to(outerEarLRef.current, { x: 0, y: 0, duration, ease });
    if (outerEarRRef.current) gsap.to(outerEarRRef.current, { x: 0, y: 0, duration, ease });
    if (earHairLRef.current) gsap.to(earHairLRef.current, { x: 0, y: 0, duration, ease });
    if (earHairRRef.current) gsap.to(earHairRRef.current, { x: 0, y: 0, duration, ease });
    if (hairRef.current) gsap.to(hairRef.current, { x: 0, scaleY: 1, duration, ease });

    if (toothRef.current) gsap.to(toothRef.current, { y: 0, duration: 0.3 });
    if (tongueRef.current) gsap.to(tongueRef.current, { y: 0, duration: 0.3 });
  }, []);

  // 4. Caret Tracking Loop based on email input focus and typing
  useEffect(() => {
    if (isPasswordFocused) return;

    if (isEmailFocused || emailValue.length > 0) {
      if (effectiveInputRef?.current) {
        const input = effectiveInputRef.current;
        const coords = getCaretCoordinates(input);
        const targetY = coords.y + input.offsetHeight / 2;
        lookAtPoint(coords.x, targetY, emailValue.includes('@'));
      } else if (svgRef.current) {
        // Fallback target directly below center
        const svgRect = svgRef.current.getBoundingClientRect();
        const len = emailValue.length;
        const normalized = Math.min(len / 28, 1.0);
        const targetX = svgRect.left + (normalized * svgRect.width);
        const targetY = svgRect.bottom + 80;
        lookAtPoint(targetX, targetY, emailValue.includes('@'));
      }
    } else {
      resetFace();
    }
  }, [emailValue, isEmailFocused, isPasswordFocused, effectiveInputRef, lookAtPoint, resetFace]);

  // 5. Mouse Hover Tracking when Idle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only track mouse when not focused on password or actively typing email
      if (isPasswordFocused || isEmailFocused) return;
      lookAtPoint(e.clientX, e.clientY, false);
    };

    const handleMouseLeave = () => {
      if (!isPasswordFocused && !isEmailFocused) {
        resetFace();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPasswordFocused, isEmailFocused, lookAtPoint, resetFace]);

  const isInitialMountRef = useRef(true);

  // 6. Two-Stage Organic Monkey Covering Kinematics on Password Focus / Blur
  useEffect(() => {
    const armL = armLRef.current;
    const armR = armRRef.current;
    const pupilL = pupilLRef.current;
    const pupilR = pupilRRef.current;
    const eyeL = eyeLRef.current;
    const eyeR = eyeRRef.current;
    const face = faceRef.current;
    const eyebrow = eyebrowRef.current;
    const nose = noseRef.current;
    const mouth = mouthRef.current;
    const chin = chinRef.current;
    const outerEarL = outerEarLRef.current;
    const outerEarR = outerEarRRef.current;
    const earHairL = earHairLRef.current;
    const earHairR = earHairRRef.current;
    const hair = hairRef.current;
    const bodyNormal = bodyNormalRef.current;
    const bodyChanged = bodyChangedRef.current;

    if (!armL || !armR) return;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (!isPasswordFocused) {
        return; // Guard: suppress redundant uncover tween on initial mount
      }
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Interrupt & cancel any active timeline to guarantee clean transition
    if (coverTimelineRef.current) {
      coverTimelineRef.current.kill();
      coverTimelineRef.current = null;
    }

    gsap.killTweensOf([
      armL,
      armR,
      twoFingersRef.current,
      pupilL,
      pupilR,
      eyeL,
      eyeR,
      eyebrow,
      face,
      nose,
      mouth,
      chin,
      hair,
      outerEarL,
      outerEarR,
      earHairL,
      earHairR,
      bodyNormal,
      bodyChanged,
    ]);

    if (isPasswordFocused) {
      eyesCoveredRef.current = true;

      if (prefersReducedMotion) {
        gsap.set([armL, armR], { autoAlpha: 1, x: -93, y: 10, rotation: 0 });
        if (pupilL && pupilR) gsap.set([pupilL, pupilR], { scaleY: 0, opacity: 0, y: -4 });
        if (closedEyeLRef.current && closedEyeRRef.current) {
          gsap.set([closedEyeLRef.current, closedEyeRRef.current], { opacity: 1, y: 0 });
        }
        if (bodyNormal && bodyChanged) {
          gsap.set(bodyNormal, { opacity: 0 });
          gsap.set(bodyChanged, { opacity: 1 });
        }
        resetFace();
        return;
      }

      const tl = gsap.timeline();
      coverTimelineRef.current = tl;

      // --- STAGE 1: Look Up Normally (Anticipation / Inquisitive Orienting Reflex ~0.22s) ---
      // 1. Saccadic eye movement looking up normally
      tl.to(
        [eyeL, eyeR],
        {
          x: 0,
          y: -7.5,
          duration: 0.16,
          ease: 'power3.out',
        },
        0
      );

      // 2. Cranial tilt upward (eyebrow arch, snout & head pitch, ear reverse-parallax)
      tl.to(eyebrow, { x: 0, y: -4.5, skewX: 0, duration: 0.2, ease: 'back.out(1.1)' }, 0.02);
      tl.to(face, { x: 0, y: -4.0, skewX: 0, duration: 0.22, ease: 'back.out(1.1)' }, 0.02);
      tl.to(nose, { x: 0, y: -5.5, rotation: 0, duration: 0.22, ease: 'back.out(1.1)' }, 0.02);
      tl.to(mouth, { x: 0, y: -3.5, rotation: 0, scale: 0.94, duration: 0.22, ease: 'power2.out' }, 0.02);
      tl.to(chin, { x: 0, y: -2.5, scaleY: 0.92, duration: 0.22, ease: 'power2.out' }, 0.02);
      tl.to(hair, { x: 0, y: -2.5, scaleY: 1.05, duration: 0.22, ease: 'back.out(1.1)' }, 0.02);
      tl.to([outerEarL, earHairL], { x: 0, y: 3.0, duration: 0.22, ease: 'power2.out' }, 0.02);
      tl.to([outerEarR, earHairR], { x: 0, y: 3.0, duration: 0.22, ease: 'power2.out' }, 0.02);

      // Prepare arms in viewport
      tl.set([armL, armR], { autoAlpha: 1 }, 0.12);

      // --- STAGE 2: Smooth Biological Eye Closure & Bilateral Arm Covering ---
      // 3. Bilateral arm sweep upward landing directly over eyes at canonical y: 10 (NOT on forehead y: 0)
      const armCurve = 'cubic-bezier(0.28, 0, 0.18, 1)';
      tl.to(
        armL,
        {
          x: -93,
          y: 10,
          rotation: 0,
          duration: 0.44,
          transformOrigin: 'top left',
          ease: armCurve,
        },
        0.16
      );

      tl.to(
        armR,
        {
          x: -93,
          y: 10,
          rotation: 0,
          duration: 0.46,
          transformOrigin: 'top right',
          ease: armCurve,
        },
        0.22
      );

      // 4. Shoulder muscular contraction
      if (bodyNormal && bodyChanged) {
        tl.to(bodyNormal, { opacity: 0, duration: 0.32, ease: 'power2.out' }, 0.2);
        tl.to(bodyChanged, { opacity: 1, duration: 0.32, ease: 'power2.out' }, 0.2);
      }

      // Smooth gaze return to orbital datum before eyelid closes so pupils do not disappear into eyebrows
      tl.to(
        [eyeL, eyeR],
        {
          x: 0,
          y: 0,
          duration: 0.16,
          ease: 'power2.out',
        },
        0.16
      );

      // 5. Smooth biological eyelid closure (eyes close smoothly like a real monkey)
      tl.to(
        [pupilL, pupilR],
        {
          scaleY: 0,
          y: -4.0,
          duration: 0.14,
          transformOrigin: 'center center',
          ease: 'power2.inOut',
        },
        0.24
      );

      // Closed eyelid arcs sweep down and appear directly over eyes (not an empty face!)
      if (closedEyeLRef.current && closedEyeRRef.current) {
        tl.to(
          [closedEyeLRef.current, closedEyeRRef.current],
          {
            opacity: 1,
            y: 0,
            duration: 0.14,
            ease: 'power2.out',
          },
          0.24
        );
      }

      // 6. Eyebrows settle into relaxed closed-eye posture
      tl.to(eyebrow, { y: 1.5, duration: 0.22, ease: 'power1.inOut' }, 0.26);

      // 7. Cranium and facial features settle to resting neutral as hands arrive over eyes
      tl.to(
        [face, chin, nose, mouth, hair, outerEarL, outerEarR, earHairL, earHairR],
        {
          y: 0,
          scaleY: 1,
          scale: 1,
          duration: 0.35,
          ease: 'power1.out',
        },
        0.26
      );
    } else {
      // --- RESTORE ON BLUR: Graceful, gravity-assisted descent & smooth eye re-opening ---
      eyesCoveredRef.current = false;
      peekOpenedRef.current = false;

      // Snap twoFingers peek closed if it was active
      if (twoFingersRef.current) {
        gsap.to(twoFingersRef.current, {
          rotation: 0,
          x: 0,
          y: 0,
          duration: 0.25,
          transformOrigin: 'bottom left',
          ease: 'power2.out',
        });
      }

      if (prefersReducedMotion) {
        gsap.set([armL, armR], {
          autoAlpha: 0,
          x: -93,
          y: 220,
          rotation: (i) => (i === 0 ? 105 : -105),
        });
        if (pupilL && pupilR) gsap.set([pupilL, pupilR], { scaleY: 1, y: 0, x: 0, opacity: 1 });
        if (closedEyeLRef.current && closedEyeRRef.current) {
          gsap.set([closedEyeLRef.current, closedEyeRRef.current], { opacity: 0, y: -2 });
        }
        if (bodyNormal && bodyChanged) {
          gsap.set(bodyNormal, { opacity: 1 });
          gsap.set(bodyChanged, { opacity: 0 });
        }
        resetFace();
        return;
      }

      const tl = gsap.timeline();
      coverTimelineRef.current = tl;

      // Arms drop naturally with gravity acceleration
      tl.to(
        armL,
        {
          x: -93,
          y: 220,
          rotation: 105,
          duration: 0.55,
          transformOrigin: 'top left',
          ease: 'power2.in',
        },
        0
      );

      tl.to(
        armR,
        {
          x: -93,
          y: 220,
          rotation: -105,
          duration: 0.55,
          transformOrigin: 'top right',
          ease: 'power2.in',
          onComplete: () => {
            gsap.set([armL, armR], { autoAlpha: 0 });
          },
        },
        0.04
      );

      // Shoulders relax
      if (bodyNormal && bodyChanged) {
        tl.to(bodyNormal, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.1);
        tl.to(bodyChanged, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.1);
      }

      // Closed eyelids lift and fade as hands fall
      if (closedEyeLRef.current && closedEyeRRef.current) {
        tl.to(
          [closedEyeLRef.current, closedEyeRRef.current],
          {
            opacity: 0,
            y: -2,
            duration: 0.14,
            ease: 'power2.in',
          },
          0.14
        );
      }

      // Eyes smoothly reopen as hands fall below eye level
      tl.to(
        [pupilL, pupilR],
        {
          scaleY: 1,
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.2,
          transformOrigin: 'center center',
          ease: 'power2.out',
        },
        0.18
      );

      // Return facial features to neutral
      resetFace();
    }
  }, [isPasswordFocused, resetFace]);

  // 7. Peeking Action via TwoFingers Aperture Spread & Monocular Peek
  useEffect(() => {
    const twoFingers = twoFingersRef.current;
    const pupilL = pupilLRef.current;
    if (!twoFingers) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isPasswordFocused && isShowPassword) {
      peekOpenedRef.current = true;

      // Stop timeline and previous animations from conflicting with peek
      gsap.killTweensOf([twoFingers, pupilL, closedEyeLRef.current]);

      if (prefersReducedMotion) {
        gsap.set(twoFingers, { rotation: 30, x: -9, y: -2, transformOrigin: 'bottom left' });
        if (closedEyeLRef.current) gsap.set(closedEyeLRef.current, { opacity: 0 });
        if (pupilL) gsap.set(pupilL, { scaleY: 1, opacity: 1, y: 0, x: 0 });
        return;
      }

      // Spread two fingers to reveal pupil aperture while pointer finger stays anchored to palm
      gsap.to(twoFingers, {
        rotation: 30,
        x: -9,
        y: -2,
        duration: 0.32,
        transformOrigin: 'bottom left',
        ease: 'power2.inOut',
      });

      // Left eye: hide closed eyelid and open pupil to peek through aperture
      if (closedEyeLRef.current) {
        gsap.to(closedEyeLRef.current, { opacity: 0, duration: 0.16 });
      }

      if (pupilL) {
        gsap.to(pupilL, {
          scaleY: 1,
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.25,
          transformOrigin: 'center center',
          ease: 'power2.out',
        });
      }
    } else if (isPasswordFocused && !isShowPassword) {
      gsap.killTweensOf([twoFingers, pupilL, closedEyeLRef.current]);

      if (prefersReducedMotion) {
        gsap.set(twoFingers, { rotation: 0, x: 0, y: 0, transformOrigin: 'bottom left' });
        if (closedEyeLRef.current) gsap.set(closedEyeLRef.current, { opacity: 1, y: 0 });
        if (pupilL) gsap.set(pupilL, { scaleY: 0, opacity: 0, y: -4.0 });
        return;
      }

      // Snap fingers tightly closed
      gsap.to(twoFingers, {
        rotation: 0,
        x: 0,
        y: 0,
        duration: 0.28,
        transformOrigin: 'bottom left',
        ease: 'power2.inOut',
      });

      // Only re-close the peeked eye if the aperture was actually opened. On initial
      // focus the cover timeline owns the closure, so animating it here as well races
      // the timeline and desynchronises the left eye from the right.
      if (!peekOpenedRef.current) return;
      peekOpenedRef.current = false;

      // Re-close left eye tightly
      if (pupilL) {
        gsap.to(pupilL, {
          scaleY: 0,
          opacity: 0,
          y: -4.0,
          duration: 0.2,
          transformOrigin: 'center center',
          ease: 'power2.in',
        });
      }

      // Restore closed eyelid arc
      if (closedEyeLRef.current) {
        gsap.to(closedEyeLRef.current, { opacity: 1, y: 0, duration: 0.18, delay: 0.05 });
      }
    }
  }, [isPasswordFocused, isShowPassword]);

  const avatarState = isPasswordFocused
    ? (isShowPassword ? 'peeking' : 'covering')
    : (isEmailFocused || emailValue.length > 0 ? 'tracking' : 'idle');

  return (
    <div
      ref={containerRef}
      data-avatar-state={avatarState}
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Outer Housing Container with Laser Orange Standby Glow */}
      <div className="relative p-2.5 rounded-full bg-gradient-to-b from-[var(--monkey-housing-top)] via-[var(--monkey-housing-mid)] to-[var(--monkey-housing-base)] border-2 border-[var(--monkey-housing-border)] shadow-[0_16px_50px_var(--monkey-housing-shadow)]">
        {/* Ambient Pulse Ring */}
        <div
          className={`absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-500 ${
            isPasswordFocused
              ? 'bg-[#fc6c00]/30 scale-105 animate-pulse'
              : 'bg-[#fc6c00]/15'
          }`}
          style={{
            backgroundColor: isPasswordFocused ? `${glowColor}4d` : `${glowColor}26`,
          }}
        />

        {/* Master SVG Canvas */}
        <div
          style={{ width: size, height: size }}
          className="relative rounded-full overflow-hidden border border-[#fc6c00]/40 shadow-inner bg-[var(--monkey-housing-base)]"
        >
          <svg
            ref={svgRef}
            viewBox="0 0 200 200"
            width={size}
            height={size}
            className="monkey-themed overflow-visible select-none pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={armMaskId}>
                <circle cx="100" cy="100" r="101" />
              </clipPath>
              <clipPath id={mouthMaskId}>
                <path
                  d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"
                />
              </clipPath>
            </defs>

            {/* Circular Backdrop */}
            <circle cx="100" cy="100" r="100" fill="#141722" />

            {/* Body Group */}
            <g className="body">
              <path
                ref={bodyChangedRef}
                className="opacity-0"
                fill="var(--monkey-fur)"
                stroke="#fc6c00"
                strokeWidth="2.5"
                d="M200,122h-35h-14.9V72c0-27.6-22.4-50-50-50s-50,22.4-50,50v50H35.8H0l0,91h200L200,122z"
              />
              <path
                ref={bodyNormalRef}
                fill="var(--monkey-fur)"
                stroke="#fc6c00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M200,158.5c0-20.2-14.8-36.5-35-36.5h-14.9V72.8c0-27.4-21.7-50.4-49.1-50.8c-28-0.5-50.9,22.1-50.9,50v50 H35.8C16,122,0,138,0,157.8L0,213h200L200,158.5z"
              />
              <path
                fill="var(--monkey-fur-shade)"
                d="M100,156.4c-22.9,0-43,11.1-54.1,27.7c15.6,10,34.2,15.9,54.1,15.9s38.5-5.8,54.1-15.9 C143,167.5,122.9,156.4,100,156.4z"
              />
            </g>

            {/* Left Ear */}
            <g className="earL">
              <g
                ref={outerEarLRef}
                className="outerEar"
                fill={skinColor}
                stroke="#fc6c00"
                strokeWidth="2.5"
              >
                <circle cx="47" cy="83" r="11.5" />
                <path
                  d="M46.3 78.9c-2.3 0-4.1 1.9-4.1 4.1 0 2.3 1.9 4.1 4.1 4.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <g ref={earHairLRef} className="earHair">
                <rect x="51" y="64" fill="var(--monkey-fur)" width="15" height="35" />
                <path
                  d="M53.4 62.8C48.5 67.4 45 72.2 42.8 77c3.4-.1 6.8-.1 10.1.1-4 3.7-6.8 7.6-8.2 11.6 2.1 0 4.2 0 6.3.2-2.6 4.1-3.8 8.3-3.7 12.5 1.2-.7 3.4-1.4 5.2-1.9"
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>

            {/* Right Ear */}
            <g className="earR">
              <g
                ref={outerEarRRef}
                className="outerEar"
                fill={skinColor}
                stroke="#fc6c00"
                strokeWidth="2.5"
              >
                <circle cx="153" cy="83" r="11.5" />
                <path
                  d="M153.7,78.9 c2.3,0,4.1,1.9,4.1,4.1c0,2.3-1.9,4.1-4.1,4.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <g ref={earHairRRef} className="earHair">
                <rect x="134" y="64" fill="var(--monkey-fur)" width="15" height="35" />
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M146.6,62.8 c4.9,4.6,8.4,9.4,10.6,14.2c-3.4-0.1-6.8-0.1-10.1,0.1c4,3.7,6.8,7.6,8.2,11.6c-2.1,0-4.2,0-6.3,0.2c2.6,4.1,3.8,8.3,3.7,12.5 c-1.2-0.7-3.4-1.4-5.2-1.9"
                />
              </g>
            </g>

            {/* Chin */}
            <path
              ref={chinRef}
              className="chin"
              d="M84.1 121.6c2.7 2.9 6.1 5.4 9.8 7.5l.9-4.5c2.9 2.5 6.3 4.8 10.2 6.5 0-1.9-.1-3.9-.2-5.8 3 1.2 6.2 2 9.7 2.5-.3-2.1-.7-4.1-1.2-6.1"
              fill="none"
              stroke="#fc6c00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Face Contour */}
            <path
              ref={faceRef}
              className="face"
              fill={skinColor}
              d="M134.5,46v35.5c0,21.815-15.446,39.5-34.5,39.5s-34.5-17.685-34.5-39.5V46"
            />

            {/* Hair */}
            <path
              ref={hairRef}
              className="hair"
              fill="var(--monkey-fur)"
              stroke="#fc6c00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M81.457,27.929 c1.755-4.084,5.51-8.262,11.253-11.77c0.979,2.565,1.883,5.14,2.712,7.723c3.162-4.265,8.626-8.27,16.272-11.235 c-0.737,3.293-1.588,6.573-2.554,9.837c4.857-2.116,11.049-3.64,18.428-4.156c-2.403,3.23-5.021,6.391-7.852,9.474"
            />

            {/* Eyebrows */}
            <g ref={eyebrowRef} className="eyebrow">
              <path
                fill="var(--monkey-fur)"
                d="M138.142,55.064c-4.93,1.259-9.874,2.118-14.787,2.599c-0.336,3.341-0.776,6.689-1.322,10.037 c-4.569-1.465-8.909-3.222-12.996-5.226c-0.98,3.075-2.07,6.137-3.267,9.179c-5.514-3.067-10.559-6.545-15.097-10.329 c-1.806,2.889-3.745,5.73-5.816,8.515c-7.916-4.124-15.053-9.114-21.296-14.738l1.107-11.768h73.475V55.064z"
              />
              <path
                fill="none"
                stroke="#fc6c00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M63.56,55.102 c6.243,5.624,13.38,10.614,21.296,14.738c2.071-2.785,4.01-5.626,5.816-8.515c4.537,3.785,9.583,7.263,15.097,10.329 c1.197-3.043,2.287-6.104,3.267-9.179c4.087,2.004,8.427,3.761,12.996,5.226c0.545-3.348,0.986-6.696,1.322-10.037 c4.913-0.481,9.857-1.34,14.787-2.599"
              />
            </g>

            {/* Left Eye (Gaze Translation Group) */}
            <g ref={eyeLRef} className="eyeL">
              {/* Open Eyeball Group */}
              <g
                ref={pupilLRef}
                className="eyeballL"
                style={{ transformOrigin: 'center center' }}
              >
                <circle cx="85.5" cy="78.5" r="3.6" fill="#07080a" />
                <circle cx="84" cy="76" r="1.1" fill="#ffffff" />
                <circle cx="86.2" cy="79.2" r="0.6" fill="#fc6c00" opacity={0.8} />
              </g>

              {/* Closed Eyelid & Lash Crease (Biological Primate Closed Eye) */}
              <g
                ref={closedEyeLRef}
                className="closedEyeL"
                style={{ opacity: 0, pointerEvents: 'none', transformOrigin: '85.5px 78.5px' }}
              >
                {/* Upper Lid Supraciliary Crease Fold */}
                <path
                  d="M 82.2,74.8 Q 85.5,73.4 88.8,74.8"
                  fill="none"
                  stroke="#fc6c00"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity={0.55}
                />
                {/* Main Closed Eyelash / Eyelid Arc */}
                <path
                  d="M 81.2,78.2 Q 85.5,82.4 89.8,78.2"
                  fill="none"
                  stroke="#07080a"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </g>
            </g>

            {/* Right Eye (Gaze Translation Group) */}
            <g ref={eyeRRef} className="eyeR">
              {/* Open Eyeball Group */}
              <g
                ref={pupilRRef}
                className="eyeballR"
                style={{ transformOrigin: 'center center' }}
              >
                <circle cx="114.5" cy="78.5" r="3.6" fill="#07080a" />
                <circle cx="113" cy="76" r="1.1" fill="#ffffff" />
                <circle cx="115.2" cy="79.2" r="0.6" fill="#fc6c00" opacity={0.8} />
              </g>

              {/* Closed Eyelid & Lash Crease (Biological Primate Closed Eye) */}
              <g
                ref={closedEyeRRef}
                className="closedEyeR"
                style={{ opacity: 0, pointerEvents: 'none', transformOrigin: '114.5px 78.5px' }}
              >
                {/* Upper Lid Supraciliary Crease Fold */}
                <path
                  d="M 111.2,74.8 Q 114.5,73.4 117.8,74.8"
                  fill="none"
                  stroke="#fc6c00"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity={0.55}
                />
                {/* Main Closed Eyelash / Eyelid Arc */}
                <path
                  d="M 110.2,78.2 Q 114.5,82.4 118.8,78.2"
                  fill="none"
                  stroke="#07080a"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </g>
            </g>

            {/* Mouth */}
            <g ref={mouthRef} className="mouth">
              <path
                className="mouthBG"
                fill="#201008"
                d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"
              />
              <g clipPath={`url(#${mouthMaskId})`}>
                <g ref={tongueRef} className="tongue">
                  <circle cx="100" cy="107" r="8" fill="#fc6c00" />
                  <ellipse cx="100" cy="100.5" rx="3" ry="1.5" opacity=".4" fill="#ff9d47" />
                </g>
              </g>
              <path
                ref={toothRef}
                clipPath={`url(#${mouthMaskId})`}
                className="tooth"
                style={{ fill: '#ffffff' }}
                d="M106,97h-4c-1.1,0-2-0.9-2-2v-2h8v2C108,96.1,107.1,97,106,97z"
              />
              <path
                className="mouthOutline"
                fill="none"
                stroke="#fc6c00"
                strokeWidth="2.5"
                strokeLinejoin="round"
                d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"
              />
            </g>

            {/* Nose */}
            <path
              ref={noseRef}
              className="nose"
              d="M97.7 79.9h4.7c1.9 0 3 2.2 1.9 3.7l-2.3 3.3c-.9 1.3-2.9 1.3-3.8 0l-2.3-3.3c-1.3-1.6-.2-3.7 1.8-3.7z"
              fill="#fc6c00"
            />

            {/* Arms Assembly (Inside Master Circular Clip Boundary) */}
            <g className="arms" clipPath={`url(#${armMaskId})`}>
              {/* Left Arm */}
              <g ref={armLRef} className="armL">
                <polygon
                  fill={skinColor}
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  points="121.3,98.4 111,59.7 149.8,49.3 169.8,85.4"
                />
                <path
                  fill={skinColor}
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  d="M134.4,53.5l19.3-5.2c2.7-0.7,5.4,0.9,6.1,3.5v0c0.7,2.7-0.9,5.4-3.5,6.1l-10.3,2.8"
                />
                <path
                  fill={skinColor}
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  d="M150.9,59.4l26-7c2.7-0.7,5.4,0.9,6.1,3.5v0c0.7,2.7-0.9,5.4-3.5,6.1l-21.3,5.7"
                />

                {/* Two Fingers (The Peek Aperture) */}
                <g ref={twoFingersRef} className="twoFingers fingerB">
                  <path
                    fill={skinColor}
                    stroke="#fc6c00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    d="M158.3,67.8l23.1-6.2c2.7-0.7,5.4,0.9,6.1,3.5v0c0.7,2.7-0.9,5.4-3.5,6.1l-23.1,6.2"
                  />
                  <path
                    fill={nailColor}
                    d="M180.1,65l2.2-0.6c1.1-0.3,2.2,0.3,2.4,1.4v0c0.3,1.1-0.3,2.2-1.4,2.4l-2.2,0.6L180.1,65z"
                  />
                  <path
                    fill={skinColor}
                    stroke="#fc6c00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    d="M160.8,77.5l19.4-5.2c2.7-0.7,5.4,0.9,6.1,3.5v0c0.7,2.7-0.9,5.4-3.5,6.1l-18.3,4.9"
                  />
                  <path
                    fill={nailColor}
                    d="M178.8,75.7l2.2-0.6c1.1-0.3,2.2,0.3,2.4,1.4v0c0.3,1.1-0.3,2.2-1.4,2.4l-2.2,0.6L178.8,75.7z"
                  />
                </g>

                {/* Left Arm Fingernails */}
                <path
                  fill={nailColor}
                  d="M175.5,55.9l2.2-0.6c1.1-0.3,2.2,0.3,2.4,1.4v0c0.3,1.1-0.3,2.2-1.4,2.4l-2.2,0.6L175.5,55.9z"
                />
                <path
                  fill={nailColor}
                  d="M152.1,50.4l2.2-0.6c1.1-0.3,2.2,0.3,2.4,1.4v0c0.3,1.1-0.3,2.2-1.4,2.4l-2.2,0.6L152.1,50.4z"
                />

                {/* Complete Forearm Fur Tufts (All 4 paths from original specification) */}
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M123.5,97.8 c-41.4,14.9-84.1,30.7-108.2,35.5L1.2,81c33.5-9.9,71.9-16.5,111.9-21.8"
                />
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M108.5,60.4 c7.7-5.3,14.3-8.4,22.8-13.2c-2.4,5.3-4.7,10.3-6.7,15.1c4.3,0.3,8.4,0.7,12.3,1.3c-4.2,5-8.1,9.6-11.5,13.9 c3.1,1.1,6,2.4,8.7,3.8c-1.4,2.9-2.7,5.8-3.9,8.5c2.5,3.5,4.6,7.2,6.3,11c-4.9-0.8-9-0.7-16.2-2.7"
                />
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M94.5,103.8 c-0.6,4-3.8,8.9-9.4,14.7c-2.6-1.8-5-3.7-7.2-5.7c-2.5,4.1-6.6,8.8-12.2,14c-1.9-2.2-3.4-4.5-4.5-6.9c-4.4,3.3-9.5,6.9-15.4,10.8 c-0.2-3.4,0.1-7.1,1.1-10.9"
                />
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M97.5,63.9 c-1.7-2.4-5.9-4.1-12.4-5.2c-0.9,2.2-1.8,4.3-2.5,6.5c-3.8-1.8-9.4-3.1-17-3.8c0.5,2.3,1.2,4.5,1.9,6.8c-5-0.6-11.2-0.9-18.4-1 c2,2.9,0.9,3.5,3.9,6.2"
                />
              </g>

              {/* Right Arm */}
              <g ref={armRRef} className="armR">
                <path
                  fill={skinColor}
                  stroke="#fc6c00"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="2.5"
                  d="M265.4 97.3l10.4-38.6-38.9-10.5-20 36.1z"
                />
                <path
                  fill={skinColor}
                  stroke="#fc6c00"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="2.5"
                  d="M252.4 52.4L233 47.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l10.3 2.8M226 76.4l-19.4-5.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l18.3 4.9M228.4 66.7l-23.1-6.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l23.1 6.2M235.8 58.3l-26-7c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l21.3 5.7"
                />
                <path
                  fill={nailColor}
                  d="M207.9 74.7l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM206.7 64l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM211.2 54.8l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM234.6 49.4l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8z"
                />
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M263.3 96.7c41.4 14.9 84.1 30.7 108.2 35.5l14-52.3C352 70 313.6 63.5 273.6 58.1"
                />
                <path
                  fill="var(--monkey-fur)"
                  stroke="#fc6c00"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M278.2 59.3l-18.6-10 2.5 11.9-10.7 6.5 9.9 8.7-13.9 6.4 9.1 5.9-13.2 9.2 23.1-.9M284.5 100.1c-.4 4 1.8 8.9 6.7 14.8 3.5-1.8 6.7-3.6 9.7-5.5 1.8 4.2 5.1 8.9 10.1 14.1 2.7-2.1 5.1-4.4 7.1-6.8 4.1 3.4 9 7 14.7 11 1.2-3.4 1.8-7 1.7-10.9M314 66.7s5.4-5.7 12.6-7.4c1.7 2.9 3.3 5.7 4.9 8.6 3.8-2.5 9.8-4.4 18.2-5.7.1 3.1.1 6.1 0 9.2 5.5-1 12.5-1.6 20.8-1.9-1.4 3.9-2.5 8.4-2.5 8.4"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Dynamic Status Caption & Screen Reader Region */}
      <div
        role="status"
        aria-live="polite"
        className="mt-4 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-line text-xs font-mono text-brand-base dark:text-[#ff9d47] flex items-center gap-2 shadow-sm whitespace-nowrap min-h-[34px] transition-colors"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isPasswordFocused && isShowPassword
              ? 'bg-emerald-500 animate-pulse'
              : isPasswordFocused
              ? 'bg-brand-base animate-ping'
              : emailValue.length > 0 || isEmailFocused
              ? 'bg-brand-light'
              : 'bg-brand-base'
          }`}
        />
        <span>
          {caption ||
            (isPasswordFocused && isShowPassword
              ? '👀 Peeking through fingers...'
              : isPasswordFocused
              ? '🙈 Arms covering eyes (privacy mode)'
              : emailValue.length > 0 || isEmailFocused
              ? '👀 Eyes tracking email typing...'
              : '⚡ Mascot Sentinel: Ready for input')}
        </span>
      </div>
    </div>
  );
}
