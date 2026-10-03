# Reference Project Analysis (Mini-Project)

## 1. Core Visual Principles
The reference project establishes a highly polished, professional visual language by relying on precision rather than decoration. Its success comes from constraint:

*   **Typography over decoration**: Relies heavily on a strict typographic scale. It uses three fonts intentionally:
    *   `font-sans` (Inter) for standard UI text, ensuring high legibility.
    *   `font-display` (Space Grotesk) for headings and stats, bringing a modern, engineered feel with tight tracking (`-0.03em`).
    *   `font-mono2` (JetBrains Mono) for eyebrows, metadata, and structural labels (`text-[11px] uppercase tracking-[0.16em]`).
*   **Component Geometry**: Radii are intentional and substantial (`--radius-card: 20px`, `--radius-panel: 24px`), moving away from standard 4px/8px Tailwind defaults to give surfaces a distinctive shape.
*   **Restrained Borders & Backgrounds**: Elements don't float aimlessly; they are grounded with delicate hairline borders (`border-line`) and subtle backgrounds (`bg-paper`, `bg-soft`, `bg-sunk`).
*   **Subtle Elevation**: Shadows are not used for layout, but for interaction (`hover:-translate-y-0.5 hover:shadow-md`). The base state is flat and border-defined.
*   **Motion**: Uses a single unified easing curve (`--ease-forge: cubic-bezier(0.2, 0.8, 0.2, 1)`) and duration (`160ms`) for a snappy, predictable mechanical feel.

## 2. Information Composition & Hierarchy
The reference project avoids the "generic dashboard" look by treating data objects with specific typographic treatments rather than just throwing them in cards.

*   **The "Section Heading" Pattern**: Grouping an eyebrow, a bold display title, a muted description, and an action slot. This anchors content blocks cleanly.
*   **Stat Tiles**: Data points use tabular figures (`font-variant-numeric: tabular-nums`) with clear label hierarchy (11px faint label, xl bold display value).
*   **Empty States & Errors**: They aren't just blank screens. They use a centered dashed-border panel (`py-16 px-6`), a soft-background icon, and clear concise copy. Errors get a semantic danger tint rather than looking broken.

## 3. Interaction Design
*   **Buttons**: Have strict sizes (`h-11 px-5`, `h-9 px-3.5`). They use an `active:scale-[0.975]` utility to feel physical and responsive, avoiding the standard web "click" feel.
*   **Feedback**: Interactions provide immediate visual feedback. Copy buttons (`hash-proof.tsx`) change state with inline confirmation (`Copied` + checkmark + semantic green).
*   **Focus States**: Removes default UA focus rings and applies custom `outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 8px;`.

## 4. Reinterpreting for GigaFlow
To apply this to GigaFlow while maintaining its "Orange + White" and "Workspace/Console" identity (referencing Claude Code/Groq):

*   **Palette Strategy**: We will adopt a "Dark Workspace" model (strong dark surfaces) to match the Groq/Claude Code vibe, using Charcoal (`#0a0a0a`) and Surface Elevated (`#1a1a1a`), but we will map the reference project's precise geometry, typography scale, and interaction models.
*   **GigaFlow Orange (`#fc6c00`)**: Will be used as a *signal* (primary actions, active nav states, current milestones), not as a background decoration.
*   **Typography**: Implement the exact font pairing (Inter, Space Grotesk, JetBrains Mono) with the same strict tracking and sizing rules (e.g., Mono eyebrows).
*   **Surface Hierarchy**: Use explicit borders (`rgba(255, 255, 255, 0.12)`) instead of drop shadows to define space, achieving that dense, developer-grade workspace feel.
*   **Object-Specific Layouts**: 
    *   *Contracts* will feel like documents (dense metadata, clear participants).
    *   *Milestones* will use a linear timeline component, not a grid of cards.
    *   *Escrow* will use heavy, tabular display fonts to emphasize financial security.
    *   *Evidence* will use the `hash-proof` presentation from the reference project.
