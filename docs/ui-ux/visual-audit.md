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
