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
