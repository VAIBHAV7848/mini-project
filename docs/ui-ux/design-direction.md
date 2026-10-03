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
