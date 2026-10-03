# Video Integration Strategy: GigaFlow

Based on the visual content analysis and GigaFlow's brand constraints, here is the design strategy for integrating the reference video.

## 1. Which video is most suitable
The provided `desktop-header.webm` is suitable as the primary video asset, paired with `hero-poster.jpg` as its fallback poster image.

## 2. Why
The video's inclusion of an orange/red beanie subtly complements GigaFlow's "Orange + White" brand identity. While the video is moody, dynamic, and cinematic, it can be adapted to fit a "technical, restrained, professional" vibe (similar to Claude Code or GroqCloud) if its implementation is strictly controlled. The theme of focused work aligns well with a productivity and workflow application.

## 3. Where it should appear in GigaFlow
Per the strict constraint against "giant autoplay backgrounds," this video must **not** be used as a full-viewport background. Instead, it should be contained within a tightly bound structural element:
*   **Hero Feature Card:** A constrained hero block or promotional card with a strict maximum height (e.g., 240px - 320px).
*   **Split-pane Layout:** As a visual anchor on a login/onboarding screen, taking up a constrained portion of the screen, preferably with a dark overlay to maintain a subdued, technical aesthetic.

## 4. How it should behave
To avoid distracting motion and ensure a professional experience, the video component must be implemented with the following attributes:
*   **Muted Autoplay:** Must use `muted`, `autoplay`, and `playsinline` attributes. It is critical that no sound plays.
*   **Correct Looping:** Must use the `loop` attribute for a seamless experience.
*   **Poster Fallback:** The `<video>` tag must explicitly set `poster="hero-poster.jpg"` to ensure a smooth loading experience and a fallback for environments that block autoplay.
*   **Responsive Sizing:** Use CSS `object-fit: cover` within its constrained container to maintain aspect ratio without stretching, paired with a dark overlay (e.g., a semi-transparent black gradient or solid overlay at 30-50% opacity) to restrain the cinematic brightness and keep the UI feeling like a developer tool.

## 5. Whether it should be copied into GigaFlow's public/assets
**Yes.** Both `desktop-header.webm` and `hero-poster.jpg` should be copied into the GigaFlow repository under `/public/assets/` (or equivalent static assets directory). Serving them locally ensures fast, reliable access and eliminates third-party hosting dependencies.

## 6. Any performance concerns
*   **Resolution and File Size:** The native resolution of 1440x680 is relatively large for a constrained card layout. If it is only used in a small card, we should eventually downscale a variant for smaller viewports.
*   **Audio Track:** The technical metadata indicates an audio track (Vorbis) is present. Since the video must be muted in the UI, this audio track is dead weight. For optimal performance, the video should be processed (e.g., via FFmpeg) to strip the audio track entirely, which will reduce the file size.
*   **Loading:** Implement standard preloading practices (`preload="metadata"`) so the browser doesn't block critical rendering path on large media files.
