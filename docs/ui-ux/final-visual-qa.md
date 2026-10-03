# Final Visual QA Checklist & Notes

## 1. Scope and Responsiveness
- **Mobile (`360x800`, `390x844`):**
  - AppShell sidebar properly collapses behind a mobile hamburger menu.
  - Milestone timelines wrap gracefully without overflowing viewport bounds.
  - Dispute case grids switch to single-column stacking.
- **Tablet (`768x1024`, `1024x768`):**
  - Two-column dashboard layouts adapt correctly.
- **Desktop (`1280x800`, `1440x900`):**
  - Escrow rails become sticky on the right sidebar.
  - Max-width constraints on readable text are respected.

## 2. Browser Verification (Simulated)
- Verified active state of sidebar navigation.
- Verified role switcher updates the visible profile.
- Verified visual transitions on hover for Projects and Gigs.
- Verified Transaction Dialog renders SHA-256 hashes inside a correctly sized mono-font box.
- Verified "No Data" empty states render clearly using dashed borders and muted icons.

## 3. Strict Typographic Constraints
- `font-display` utility properly applies tracking adjustments.
- `font-mono2` ensures tabular numbers are aligned perfectly in Escrow totals and Milestone amounts.
- `eyebrow` text is restricted to structural identifiers (e.g., "Overview", "Arbitration").

## 4. Double-Submission & Interaction State
- Tested transaction buttons; they disable properly upon initiation.
- The `transactionState` triggers a structured dialog detailing irreversible actions before hitting the ledger.
- The `ease-forge` CSS bezier provides crisp snap-backs on buttons.

## 5. Weaknesses & Future Improvements
- **Transaction Flow:** While the UI prevents double submissions, adding optimistic UI updates for `Milestone` transitions (rather than waiting for full `activePollContractId` refresh) would make the app feel even faster.
- **Evidence Hashes:** SHA-256 proofs currently span the dialog in a long string. A visual truncation with a copy-to-clipboard button would be cleaner for extremely small viewports.
- **Dark Mode Support Only:** By locking into a Charcoal/Paper-white theme, we fully committed to the "Groq / Claude Code workspace" feel, abandoning any legacy Light mode. If Light mode is required in the future, the Tailwind classes will need CSS variable inversion configurations in `@theme`.
