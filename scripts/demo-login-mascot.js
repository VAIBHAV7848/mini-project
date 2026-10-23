'use strict';
/**
 * Interactive Mascot Login Demo Recorder
 * KLE Technological University - Team 07
 * Compliant with ui-demo specification
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const VIDEO_DIR = path.join(__dirname, '..', 'assets', 'videos');
const OUTPUT_WEBM = path.join(VIDEO_DIR, 'escrow-mascot-login-demo.webm');
const FINAL_MP4 = path.join(__dirname, '..', 'assets', 'login_screen_demo.mp4');
const FINAL_GIF = path.join(__dirname, '..', 'assets', 'login_screen_demo.gif');
const REHEARSAL = process.argv.includes('--rehearse');

// 1. Injected SVG Cursor Overlay
async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#fc6c00" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`;
    cursor.style.cssText = `
      position: fixed; z-index: 999999; pointer-events: none;
      width: 26px; height: 26px;
      transition: left 0.08s ease-out, top 0.08s ease-out;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
    `;
    cursor.style.left = '640px';
    cursor.style.top = '360px';
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
  });
}

// 2. Subtitle HUD Bar
async function injectSubtitleBar(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-subtitle')) return;
    const bar = document.createElement('div');
    bar.id = 'demo-subtitle';
    bar.style.cssText = `
      position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
      z-index: 999998; text-align: center; padding: 9px 24px;
      background: rgba(10, 12, 16, 0.88); border: 1px solid rgba(252, 108, 0, 0.35);
      border-radius: 9999px; box-shadow: 0 8px 30px rgba(0,0,0,0.8);
      color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px; font-weight: 600; letter-spacing: 0.4px;
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none; opacity: 0;
    `;
    document.body.appendChild(bar);
  });
}

async function showSubtitle(page, text) {
  await page.evaluate((t) => {
    const bar = document.getElementById('demo-subtitle');
    if (!bar) return;
    if (t) {
      bar.textContent = t;
      bar.style.opacity = '1';
    } else {
      bar.style.opacity = '0';
    }
  }, text);
  if (text) await page.waitForTimeout(400);
}

// 3. Smooth Humanized Movement and Click
async function moveAndClick(page, locator, label, opts = {}) {
  const { postClickDelay = 600 } = opts;
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.error(`[WARN] Element not visible: ${label}`);
    return false;
  }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
    await page.waitForTimeout(250);
  }
  await el.click();
  await page.waitForTimeout(postClickDelay);
  return true;
}

// 4. Per-Character Typing with Reactive Hold
async function typeWithMascotReaction(page, locator, text, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  await moveAndClick(page, el, label, { postClickDelay: 250 });
  await el.fill('');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    await el.pressSequentially(char, { delay: 60 });
    // When typing '@', pause to feature the mascot jaw-drop surprise animation
    if (char === '@') {
      await page.waitForTimeout(600);
    } else {
      await page.waitForTimeout(40);
    }
  }
  await page.waitForTimeout(500);
}

// 5. Rehearsal Visibility Check
async function ensureVisible(page, locator, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.error(`[REHEARSAL FAIL] "${label}" not found (selector: ${locator})`);
    return false;
  }
  console.log(`[REHEARSAL OK] "${label}"`);
  return true;
}

// Master Execution Flow
(async () => {
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  if (REHEARSAL) {
    console.log('==> Running Pre-Flight Rehearsal Check...');
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    const checks = [
      { label: 'Email Input', selector: '#login-email' },
      { label: 'Password Input', selector: '#login-password' },
      { label: 'Show Password Toggle', selector: 'button[aria-label="Show password"]' },
      { label: 'Submit Button', selector: 'button[type="submit"]' },
    ];

    let passed = true;
    for (const c of checks) {
      const ok = await ensureVisible(page, c.selector, c.label);
      if (!ok) passed = false;
    }

    await browser.close();
    if (!passed) {
      console.error('==> Rehearsal failed. Fix selectors before recording.');
      process.exit(1);
    }
    console.log('==> Rehearsal passed! Ready for recording.');
    return;
  }

  // Record Mode
  console.log('==> Starting Video Recording...');
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);

    // Initial Pan & Intro
    await showSubtitle(page, 'Escrow Gateway • Interactive Mascot Auth');
    await page.mouse.move(640, 240, { steps: 12 });
    await page.waitForTimeout(900);

    // Step 1: Email & Caret Tracking with '@' reaction
    await showSubtitle(page, 'Step 1 - Caret Tracking & Input Reaction');
    await typeWithMascotReaction(page, '#login-email', 'client1@escrow.local', 'Email Input');

    // Step 2: Password Focus & Arms Cover
    await showSubtitle(page, 'Step 2 - Arm Kinematics: Covering Eyes');
    await moveAndClick(page, '#login-password', 'Password Input', { postClickDelay: 700 });
    await page.locator('#login-password').pressSequentially('Password123!', { delay: 65 });
    await page.waitForTimeout(800);

    // Step 3: Show Password Toggle (Two fingers spread to peek)
    await showSubtitle(page, 'Step 3 - Password Peek: Two Fingers Spread');
    await moveAndClick(page, 'button[aria-label="Show password"]', 'Show Password Button', { postClickDelay: 1400 });

    // Step 4: Toggle Peek Back Off
    await showSubtitle(page, 'Step 4 - Fingers Snap Closed');
    await moveAndClick(page, 'button[aria-label="Hide password"]', 'Hide Password Button', { postClickDelay: 800 });

    // Step 5: Submit & Gateway Verification
    await showSubtitle(page, 'Step 5 - Gateway Verification & Role Transition');
    await moveAndClick(page, 'button[type="submit"]', 'Gateway Submit Button', { postClickDelay: 2500 });

    // Wait for Dashboard Transition
    await page.waitForURL('**/dashboard**', { timeout: 8000 }).catch(() => {});
    await injectCursor(page);
    await injectSubtitleBar(page);

    // Step 6: Dashboard Arrival
    await showSubtitle(page, 'Step 6 - Welcome to Escrow Dashboard');
    await page.mouse.move(300, 260, { steps: 15 });
    await page.waitForTimeout(1500);
    await showSubtitle(page, '');

    console.log('==> Demo flow completed successfully.');
  } catch (err) {
    console.error('[DEMO ERROR]', err.message);
  } finally {
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const src = await video.path();
      try {
        fs.copyFileSync(src, OUTPUT_WEBM);
        console.log(`==> Demo recording successfully generated: ${OUTPUT_WEBM}`);

        // Convert to high-compatibility MP4
        console.log('==> Encoding high-definition MP4...');
        execSync(`ffmpeg -y -i "${OUTPUT_WEBM}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${FINAL_MP4}"`, {
          stdio: 'inherit',
        });
        console.log(`==> MP4 successfully generated: ${FINAL_MP4}`);

        // Convert to high-quality animated GIF (palettegen with bayer dither)
        console.log('==> Generating high-quality animated GIF...');
        execSync(
          `ffmpeg -y -i "${OUTPUT_WEBM}" -vf "fps=16,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "${FINAL_GIF}"`,
          { stdio: 'inherit' }
        );
        console.log(`==> Animated GIF successfully generated: ${FINAL_GIF}`);
      } catch (e) {
        console.error('[ERROR] Failed during conversion:', e.message);
      }
    }
  }
})();
