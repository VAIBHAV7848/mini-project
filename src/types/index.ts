export type UserRole = 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';

export type EscrowStatus =
  | 'AWAITING_DEPOSIT'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVIEW_TIMEOUT'
  | 'APPROVED'
  | 'SETTLING'
  | 'RELEASED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'DISPUTED';

export type ContractAction =
  | 'DEPOSIT'
  | 'START_WORK'
  | 'SUBMIT_DELIVERABLE'
  | 'APPROVE_MILESTONE'
  | 'RELEASE_ESCROW'
  | 'INITIATE_SETTLEMENT'
  | 'SETTLEMENT_FAILED'
  | 'RAISE_DISPUTE'
  | 'TIMEOUT_WATCHDOG'
  | 'RESOLVE_RELEASE'
  | 'RESOLVE_REFUND'
  | 'INITIATE_REFUND'
  | 'START_REVIEW';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  balance: number;
  githubProfile?: string | null;
  devScore: number;
  createdAt: Date;
}

export interface ProjectDTO {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budget: number;
  skillTags: string[];
  status: string;
  createdAt: Date;
}

export interface ProposalDTO {
  id: string;
  projectId: string;
  freelancerId: string;
  bidAmount: number;
  coverLetter: string;
  aiMatchScore: number;
  status: string;
  createdAt: Date;
}

export interface MilestoneDTO {
  id: string;
  contractId: string;
  title: string;
  description: string;
  amount: number;
  sequenceOrder: number;
  status: EscrowStatus;
  dueDate: Date;
  reviewDeadline?: Date | null;
  deliverable?: DeliverableDTO | null;
}

export interface DeliverableDTO {
  id: string;
  milestoneId: string;
  fileName: string;
  fileUrl: string;
  sha256Checksum: string;
  submissionNotes?: string | null;
  submittedAt: Date;
}

export interface ContractDTO {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  totalAmount: number;
  escrowBalance: number;
  status: EscrowStatus;
  milestones: MilestoneDTO[];
  createdAt: Date;
}

export interface DisputeDTO {
  id: string;
  milestoneId: string;
  raisedById: string;
  reviewerId?: string | null;
  reason: string;
  status: string;
  ruling?: string | null;
  rulingNotes?: string | null;
  createdAt: Date;
  resolvedAt?: Date | null;
}

export interface DisputeEvidenceDTO {
  id: string;
  disputeId: string;
  submittedById: string;
  fileUrl: string;
  sha256Checksum: string;
  description: string;
  submittedAt: Date;
}

export interface AuditLogDTO {
  id: string;
  actorId: string;
  entityName: string;
  entityId: string;
  action: string;
  previousState?: string | null;
  newState: string;
  prevHash: string;
  verificationHash: string;
  timestamp: Date;
}

export interface SessionContext {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
