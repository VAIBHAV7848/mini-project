#!/bin/bash

cat << 'INNER_EOF' > docs/ui-ux/design-system.md
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
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/motion-system.md
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
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/user-flow-matrix.md
# User Flow Matrix

| Role | Action | Trigger | API Call | Domain State Change | UI Response | Error Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Client** | Deposit Escrow | Button (Contract) | `POST /contracts/:id/milestones` | `AWAITING_DEPOSIT` -> `FUNDED` | Processing Modal -> Success Toast, Status Update | Toast Error, Retry |
| **Freelancer** | Start Work | Button (Milestone) | `POST /contracts/:id/milestones` | `FUNDED` -> `IN_PROGRESS` | Loading state on button -> Status Update | Toast Error |
| **Freelancer** | Submit Deliverable | Button -> Drawer | `POST /contracts/:id/milestones` | `IN_PROGRESS` -> `SUBMITTED` | Drawer closes, Success Toast, Status Update | Keep Drawer open, show field error |
| **Client** | Approve Deliverable | Button (Review) | `POST /contracts/:id/milestones` | `SUBMITTED` -> `APPROVED` | Confirmation Modal -> Success Toast, Status Update | Toast Error |
| **Client** | Raise Dispute | Button (Review) | `POST /contracts/:id/milestones` | `SUBMITTED` -> `DISPUTED` | Form Modal -> Success Toast, Status Update | Keep Modal open, validation errors |
| **Client** | Release Funds | Button (Approved) | `POST /contracts/:id/milestones` | `APPROVED` -> `RELEASED` | Confirmation Modal -> Success Toast, Status Update | Toast Error |
| **Reviewer** | Submit Ruling | Button (Dispute) | `POST /disputes/:id` | `DISPUTED` -> `RELEASED`/`REFUNDED` | Confirmation Modal -> Success Toast, Status Update | Toast Error |
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/visual-qa-report.md
# Visual QA Report

*This document will be updated iteratively during the implementation phase.*

## Round 1 (Pending)
- **Date**: TBD
- **Scope**: Core Primitives & App Shell
- **Findings**:
  - *To be populated*

## Round 2 (Pending)
- **Date**: TBD
- **Scope**: Contract & Milestone Views, Transaction Workflows
- **Findings**:
  - *To be populated*

## Round 3 (Pending)
- **Date**: TBD
- **Scope**: Dispute Interface & Audit Logs
- **Findings**:
  - *To be populated*
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/ui-quality-gate.md
# UI Quality Gate

*Use this checklist to verify the completion of the UI/UX transformation.*

- [x] Visual direction established
- [ ] Design tokens implemented
- [ ] Component system coherent
- [ ] Navigation coherent
- [ ] All major screens redesigned
- [ ] All important buttons tested
- [ ] All important transactions tested
- [ ] Loading states tested
- [ ] Error states tested
- [ ] Empty states tested
- [ ] Success states tested
- [ ] Confirmation states tested
- [ ] RBAC states tested
- [ ] Mobile layouts tested
- [ ] Desktop layouts tested
- [ ] Keyboard navigation tested
- [ ] Focus states tested
- [ ] Reduced motion tested
- [ ] Accessibility reviewed
- [ ] Browser flows tested
- [ ] Visual QA performed
- [ ] Visual QA defects fixed
- [ ] Performance checked
- [ ] No fake UI behavior
- [ ] No broken API contracts
- [ ] No broken business logic
INNER_EOF

