# Accessibility Audit & Guidelines

## 1. Semantic HTML
- Ensure proper use of `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`.
- Logical heading structure (`h1` through `h6`) without skipping levels.

## 2. Keyboard Navigation
- All interactive elements (buttons, links, form fields) must be reachable via `Tab`.
- Logical tab order matching visual layout.
- Dialogs/Modals must trap focus while open.
- Clear, highly visible focus rings (`focus-visible` styling).

## 3. Screen Readers & ARIA
- Use native HTML elements (`<button>`, `<a>`) over `<div>` + ARIA where possible.
- Provide `aria-label` or `sr-only` text for icon-only buttons.
- Use `aria-live` regions for critical dynamic updates (e.g., transaction success).
- Properly associate form labels with inputs using `htmlFor` and `id`.

## 4. Visual Accessibility
- Ensure sufficient color contrast (WCAG AA - 4.5:1 for text, 3.1 for large text).
- Do not rely on color alone to convey meaning (e.g., use icons + text for status badges).
- Support `prefers-reduced-motion` to disable non-essential animations.
