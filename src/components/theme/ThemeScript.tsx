import React from 'react';

/**
 * Blocking inline script in <head> to prevent Flash of Unstyled Content (FOUC).
 * 1. Checks localStorage for explicitly saved 'dark' | 'light'.
 * 2. Fallbacks to window.matchMedia('(prefers-color-scheme: light)').
 * 3. Immediately toggles .dark / .light class on <html> and sets style.colorScheme.
 * 4. Adds .theme-preload to prevent CSS transition animation on initial page paint.
 */
export function ThemeScript() {
  const code = `
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        var isLight = stored === 'light' || (!stored && prefersLight);
        var root = document.documentElement;

        root.classList.add('theme-preload');
        if (isLight) {
          root.classList.add('light');
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        } else {
          root.classList.add('dark');
          root.classList.remove('light');
          root.style.colorScheme = 'dark';
        }

        window.addEventListener('DOMContentLoaded', function() {
          requestAnimationFrame(function() {
            root.classList.remove('theme-preload');
          });
        });
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
