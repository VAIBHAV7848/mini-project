#!/bin/bash
mkdir -p docs/ui-ux/screens

cat << 'INNER_EOF' > docs/ui-ux/ux-audit.md
# UX Audit

## Overview
This audit evaluates the current user experience of the Milestone-Based Escrow & Evidence-Based Dispute Resolution system.

## Findings

### 1. Navigation & Orientation
- **Current State**: The single page dashboard handles all roles and contract states simultaneously. No clear persistent navigation architecture.
- **Issues**: Users cannot navigate between discrete sections (Projects, Gigs, Disputes). The "Where am I?" and "What can I do?" heuristics are failing due to information overload.
- **Recommendation**: Implement a consistent App Shell with role-specific primary navigation (e.g., Client: Dashboard, Projects, Active Contracts, Proposals, Disputes).

### 2. Transaction UX & Feedback
- **Current State**: State changes (funding, submitting) use basic buttons. Action feedback is a single text string at the top of the dashboard.
- **Issues**: No pre-flight confirmation for critical actions like `RELEASE_ESCROW` or `RAISE_DISPUTE`. Status updates rely on a generic 5s polling toggle which exposes system mechanics to the user.
- **Recommendation**: Introduce explicit transaction workflows (Dialogs or side panels) with confirmation states, intermediate loading feedback, and robust error handling without exposing polling logic.

### 3. State Comprehension
- **Current State**: Escrow states are displayed as small colored badges inside contract cards.
- **Issues**: The flow of the escrow FSM (`AWAITING_DEPOSIT` -> `FUNDED` -> `IN_PROGRESS` -> `SUBMITTED` -> `APPROVED` / `DISPUTED` -> `RELEASED`) is not visually represented as a timeline, making the next required action ambiguous.
- **Recommendation**: Use a visual timeline or stepper for milestones to clearly indicate current state, blocked states, and next actions.

### 4. Information Density
- **Current State**: All information (contract details, escrow balance, sequential milestones, actions) is crammed into a single card per contract.
- **Issues**: High cognitive load. Difficulty distinguishing between primary contract data and individual milestone actions.
- **Recommendation**: Move to a master-detail view or dedicated detail pages for Contracts/Milestones, reserving cards for high-level summaries.

### 5. Role Confusion (RBAC Presentation)
- **Current State**: Role switcher exposes all roles on a single dashboard for demo purposes.
- **Issues**: While useful for a demo, a real user will only have one role context at a time, requiring specialized views.
- **Recommendation**: Design distinct default views tailored to the active role's primary goals (Client -> What needs review/funding? Freelancer -> What is active/funded?).
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/visual-audit.md
# Visual Audit

## Overview
Evaluation of the visual design language in the current prototype.

## Findings

### 1. Typography & Hierarchy
- **Current State**: Heavy reliance on monospace fonts (`font-mono`) and utility text classes without a cohesive type scale.
- **Issues**: Lacks a distinct visual hierarchy. Everything feels like technical data rather than a polished consumer/enterprise product.
- **Recommendation**: Establish a formal typography system with a clean sans-serif for UI/copy and reserve monospace strictly for hashes, amounts, or technical IDs.

### 2. Color System
- **Current State**: Uses default Tailwind colors (slate, indigo, emerald, rose, amber, purple).
- **Issues**: Lacks semantic consistency. Too many accent colors create a chaotic visual experience. Dark mode is the default, but contrast varies.
- **Recommendation**: Define a strict semantic color palette: Primary (Brand), Success (Funded/Approved), Warning (Disputed/Awaiting), Danger (Error), and Neutral (Surfaces/Borders).

### 3. Components & Surfaces
- **Current State**: Uses nested `bg-slate-900/60` and `border-slate-800` to create cards.
- **Issues**: Lacks elevation and depth. Interactive elements (buttons) blend with non-interactive elements (badges).
- **Recommendation**: Create a design token system for surfaces (Background, Surface 1, Surface 2, Surface 3) and borders to create depth and group related content.

### 4. Iconography
- **Current State**: `lucide-react` icons are used inconsistently alongside text.
- **Issues**: Icon weights and sizes are not standardized.
- **Recommendation**: Standardize icon sizes (e.g., 16px for inline, 20px for actions, 24px for navigation) and stroke widths.

### 5. Density & Spacing
- **Current State**: Spacing feels cramped within cards and arbitrary between sections.
- **Issues**: The lack of a strict spatial system makes the UI feel unrefined.
- **Recommendation**: Implement a 4pt/8pt grid system. Standardize padding (`p-4`, `p-6`) and gap (`gap-2`, `gap-4`) tokens.
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/information-architecture.md
# Information Architecture

## 1. Global Navigation (App Shell)
- **Top Bar**: Branding, Global Context, Notifications, User Profile.
- **Sidebar (Role-based)**:
  - **Client**: Dashboard, Projects, Gigs, Active Contracts, Disputes, Audit Log.
  - **Freelancer**: Dashboard, My Proposals, Active Contracts, Disputes, Earnings.
  - **Reviewer**: Dashboard, Pending Cases, Resolved Cases, Audit Log.
  - **Admin**: System Overview, Users, Contracts, Transactions, Audit Logs, Security Events.

## 2. Core Entities

### Project / Gig
- Overview
- Requirements
- Budget & Milestones
- Proposals / Bids

### Proposal
- Freelancer Profile
- Bid Amount
- Estimated Timeline
- Status (Pending, Accepted, Rejected)

### Contract & Escrow
- Overview (Parties, Total Value)
- Escrow Status (Balance, FSM State)
- Milestone Pipeline (List of Sequential Milestones)
- Legal/Terms (References)

### Milestone
- Status Timeline (AWAITING_DEPOSIT -> FUNDED -> IN_PROGRESS -> ...)
- Deliverables (SHA-256 Hashes, File References)
- Action Center (Deposit, Start Work, Submit, Approve, Dispute)
- Transaction History

### Dispute Case
- Case Details (Contract, Milestone, Parties)
- Dispute Timeline
- Evidence Center (Original Deliverable vs Counter-Evidence)
- Reviewer Actions (Ruling, Release, Refund)
- Audit Trail

## 3. Data Relationships
- **User (1:N) Roles**: A user acts in a specific role.
- **Project (1:N) Gigs**: A project can be split into gigs.
- **Gig (1:1) Contract**: An accepted proposal turns a gig into a contract.
- **Contract (1:N) Milestones**: Contracts are executed via sequential milestones.
- **Milestone (1:1) Dispute**: A milestone can have at most one active dispute.
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/screen-inventory.md
# Screen Inventory

## 1. Authentication & Onboarding
- `[ ]` Login / Registration
- `[ ]` Role Selection / Profile Setup

## 2. Dashboards (Role-Specific)
- `[ ]` Client Dashboard
- `[ ]` Freelancer Dashboard
- `[ ]` Reviewer Dashboard
- `[ ]` Admin Dashboard

## 3. Gigs & Proposals
- `[ ]` Gig Marketplace / Listing
- `[ ]` Gig Detail View
- `[ ]` Proposal Submission Form
- `[ ]` Proposal Review View (Client)

## 4. Contracts & Milestones
- `[ ]` Contract List View
- `[ ]` Contract Detail View
- `[ ]` Milestone Detail View
- `[ ]` Evidence / Deliverable Submission Form
- `[ ]` Deliverable Review View

## 5. Disputes
- `[ ]` Dispute Center (List)
- `[ ]` Dispute Case Detail
- `[ ]` Counter-Evidence Submission Form
- `[ ]` Ruling Interface (Reviewer)

## 6. System & Audit
- `[ ]` Global Audit Log View
- `[ ]` Transaction History
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/interaction-inventory.md
# Interaction Inventory

## 1. Navigation & Context
- **Sidebar Links**: Default, Hover, Active, Focus.
- **Breadcrumbs**: Link Hover, Focus.
- **Role Switcher**: Dropdown/Select interaction, visual feedback on change.

## 2. Transactions & FSM Actions
- **Deposit Escrow**: Button -> Modal/Dialog -> Pre-flight Validation -> Processing -> Success/Error Toast.
- **Start Work**: Button -> Confirmation Dialog -> Processing -> State Update.
- **Submit Deliverable**: Button -> Drawer/Modal -> File Upload (Simulated) + Hash Generation -> Processing -> Success State.
- **Approve Milestone**: Button -> Confirmation Modal (Warning: Irreversible) -> Processing -> State Update.
- **Raise Dispute**: Button -> Form Modal (Reason, Evidence) -> Processing -> State Update.
- **Submit Ruling**: Button (Reviewer) -> Confirmation Modal (Release vs Refund) -> Processing -> State Update.

## 3. Data Interactions
- **Hash Copy**: Click to copy SHA-256 hash -> Tooltip/Toast "Copied!".
- **Evidence Verification**: Click "Verify" -> Loading spinner -> Success/Mismatch visual state.
- **Table Row Click**: Highlight on hover -> Navigate to detail page.
- **Pagination**: Next/Prev disabled states, active page indicator.
- **Filters/Search**: Input focus, clear button, immediate local filtering or loading state for server-side.

## 4. Forms
- **Input Fields**: Default, Focus (Ring), Filled, Error (Red border + text), Disabled.
- **Textareas**: Resizable, Focus, Error.
- **File Upload**: Drag & Drop zone (Idle, Dragging over, Uploading, Complete).
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/state-inventory.md
# State Inventory

## 1. Escrow FSM States (Domain States)
- `AWAITING_DEPOSIT`: Pending client action. Visual: Warning/Amber.
- `FUNDED`: Escrow locked, pending freelancer action. Visual: Info/Blue.
- `IN_PROGRESS`: Freelancer working. Visual: Active/Indigo.
- `SUBMITTED`: Deliverable ready for review. Visual: Notice/Purple.
- `APPROVED`: Client accepted. Visual: Success/Teal.
- `RELEASED`: Funds transferred (Terminal). Visual: Settled/Emerald.
- `DISPUTED`: Escrow frozen, reviewer intervention needed. Visual: Danger/Rose.
- `REFUNDED`: Funds returned to client (Terminal). Visual: Muted/Gray.

## 2. UI Component States
- **Buttons**: `default`, `hover`, `focus`, `pressed`, `disabled`, `loading`.
- **Inputs**: `empty`, `focused`, `filled`, `invalid`, `disabled`, `readonly`.
- **Cards/Rows**: `default`, `hover`, `selected`, `disabled`.

## 3. View States (Pages & Panels)
- **Initial Loading**: Skeleton screens or full-page spinners.
- **Loaded (Populated)**: Normal content display.
- **Empty State**: No data found (e.g., "No active disputes"). Must include an illustration or clear icon + next action.
- **Error State**: API failure or unauthorized access. Must include recovery action ("Retry", "Go Back").
- **Partial State**: Main data loaded, but secondary data (e.g., audit logs) still loading.
- **Transaction Pending**: Overlay or disabled UI during state mutations to prevent double-submission.
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/responsive-strategy.md
# Responsive Strategy

## 1. Breakpoints
- **Mobile (`sm` / < 640px)**: 360x800 to 430x932
- **Tablet (`md` / 768px)**: 768x1024
- **Desktop (`lg` / 1024px)**: 1024x768 to 1440x900
- **Large Desktop (`xl` / 1280px+)**: 1920x1080

## 2. Layout Transformations
- **Navigation**:
  - Desktop: Persistent left sidebar + top bar.
  - Mobile: Bottom tab bar for primary routes, hamburger menu for secondary items.
- **Data Tables**:
  - Desktop: Standard multi-column tables.
  - Mobile: Transform into stacked cards (List views) hiding non-essential columns.
- **Dialogs & Drawers**:
  - Desktop: Centered modals or side drawers.
  - Mobile: Bottom sheets or full-screen modals.
- **Forms**:
  - Desktop: Multi-column layouts where logical (e.g., Grid).
  - Mobile: Single column, 100% width inputs.

## 3. Touch & Ergonomics
- Minimum touch target size: `44px x 44px`.
- Primary actions on mobile should be easily reachable by thumb (e.g., sticky bottom action bars).
- Ensure hover states have corresponding active/pressed states for touch devices.
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/accessibility-audit.md
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
INNER_EOF

cat << 'INNER_EOF' > docs/ui-ux/design-direction.md
# Design Direction

## 1. Product Personality
**Professional, Trustworthy, Transparent, Precise.**
The interface must feel like a high-end financial tool or legal case management system, not a casual social app or a generic SaaS template. It requires high information density, clear typography, and unmistakable feedback.

## 2. Visual Language
- **Colors**: Deep, serious backgrounds with crisp, high-contrast semantic accents. Dark mode optimized (slate/zinc tones) for reduced eye strain during long review sessions.
- **Typography**: Clean, geometric sans-serif for UI (e.g., Inter or Geist). Strict monospace for hashes, IDs, and financial amounts to convey precision and align tabular data.
- **Shapes**: Sharp or slightly rounded corners (`rounded-md`, `rounded-lg`). Avoid excessive pill shapes or friendly/bubbly radii.
- **Borders & Dividers**: Thin, subtle borders to establish structure without heavy visual weight.
- **Depth**: Flat hierarchy for data, relying on borders and slight background shifts. Elevation (shadows) reserved strictly for overlapping contexts (Modals, Dropdowns, Tooltips, Toasts).

## 3. UI Philosophy
- **Function Over Decoration**: Every visual element must serve a purpose. No decorative blobs, unnecessary gradients, or artificial 3D effects.
- **Status is Paramount**: The state of an escrow contract or dispute is the most critical information. Status indicators must be highly visible and instantly recognizable.
- **Evidence Integrity**: Cryptographic data (SHA-256 hashes) must look verifiable. Use monospace fonts, copy-to-clipboard actions, and distinct visual framing for evidence.
- **Clarity in Action**: Destructive or high-stakes actions (Release Funds, Dispute) must stand out and enforce intentionality (confirmation).

## 4. Motion Philosophy
- Fast, subtle, and purposeful.
- Use motion for state transitions (e.g., expanding a detail panel), feedback (button press, success toast), and loading (skeletons).
- Max duration: 150-200ms for microinteractions, 300ms for layout changes.
INNER_EOF

