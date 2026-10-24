import React from 'react';

export function ThemeScript() {
  const code = `
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        var isLight = stored === 'light';
        var root = document.documentElement;
        if (isLight) {
          root.classList.add('light');
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        } else {
          root.classList.add('dark');
          root.classList.remove('light');
          root.style.colorScheme = 'dark';
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
