# Design System Tokens & Primitives

## 1. Color System (Tailwind based)

### Backgrounds & Surfaces
- `bg-base`: `slate-950` (App background)
- `bg-surface-1`: `slate-900` (Cards, sidebars)
- `bg-surface-2`: `slate-800` (Elevated elements, hovers)
- `bg-surface-3`: `slate-700` (Selected states, active elements)

### Borders
- `border-subtle`: `slate-800/50`
- `border-default`: `slate-800`
- `border-strong`: `slate-700`

### Text
- `text-primary`: `white`
- `text-secondary`: `slate-300`
- `text-muted`: `slate-500`

### Semantic Colors
- **Brand / Primary**: `indigo-500` (Actions, active navigation)
- **Success / Settled**: `emerald-500` (Released, Verified)
- **Info / Processing**: `blue-500` (Funded, processing)
- **Notice / Action Required**: `purple-500` (Submitted, Requires review)
- **Warning**: `amber-500` (Awaiting Deposit, pending)
- **Danger / Dispute**: `rose-500` (Disputed, Error, Destructive actions)

## 2. Typography

- **Sans Serif (UI)**: System sans or `Inter`.
- **Monospace (Data)**: System mono or `JetBrains Mono`.
- **Scale**:
  - `xs`: 12px / 16px (Metadata, badges)
  - `sm`: 14px / 20px (Body text, standard buttons)
  - `base`: 16px / 24px (Large body, form inputs)
  - `lg`: 18px / 28px (Subheadings)
  - `xl`: 20px / 28px (Headings)
  - `2xl`: 24px / 32px (Page Titles)

## 3. Spacing & Sizing

- **Grid**: 4px base (`1` in Tailwind = 4px).
- **Padding/Margins**: `p-4` (16px) standard container, `p-6` (24px) loose container.
- **Radii**:
  - `rounded`: 4px (Checkboxes, small tags)
  - `rounded-md`: 6px (Inputs, buttons)
  - `rounded-lg`: 8px (Cards, dialogs)
  - `rounded-xl`: 12px (Large structural containers)

## 4. Elevation (Shadows & Z-Index)

- `shadow-sm`: Buttons, inputs.
- `shadow-md`: Dropdowns, tooltips.
- `shadow-lg`: Modals, Drawers.
- `z-10`: Sticky headers.
- `z-40`: Overlays/Backdrops.
- `z-50`: Modals/Dialogs.
- `z-60`: Toasts.
