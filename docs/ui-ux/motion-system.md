# Motion System

## 1. Principles
- **Fast**: UI animations should not block the user.
- **Purposeful**: Motion must explain changes, not just look pretty.
- **Accessible**: Respect `prefers-reduced-motion`.

## 2. Duration Tokens
- `duration-75`: Extremely fast (Button clicks, checkbox toggles).
- `duration-150`: Fast (Hover states, color transitions, tooltips).
- `duration-200`: Standard (Dropdowns, simple state changes).
- `duration-300`: Moderate (Modals, Drawers, Layout shifts).

## 3. Easing
- `ease-in-out`: Default for most state changes.
- `ease-out`: Elements entering the screen (Decelerating).
- `ease-in`: Elements leaving the screen (Accelerating).

## 4. Patterns
- **Entrance**: Fade in + slight slide up (`opacity-0 translate-y-2` -> `opacity-100 translate-y-0`).
- **Exit**: Fade out + slight slide down (`opacity-100 translate-y-0` -> `opacity-0 translate-y-2`).
- **Feedback**: Scale down on click (`active:scale-95`).
- **Loading**: Skeleton pulse (`animate-pulse`) or smooth spin (`animate-spin`).
