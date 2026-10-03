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
