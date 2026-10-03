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
