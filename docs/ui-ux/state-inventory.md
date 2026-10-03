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
