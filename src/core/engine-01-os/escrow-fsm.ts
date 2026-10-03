import { EscrowStatus, ContractAction, UserRole } from '@/types';
import { InvalidStateTransitionError } from '@/lib/errors';

export interface TransitionValidationResult {
  allowed: boolean;
  nextState?: EscrowStatus;
  errorCode?: string;
  reason?: string;
}

interface TransitionRule {
  from: EscrowStatus;
  action: ContractAction;
  allowedRoles: (UserRole | 'SYSTEM')[];
  to: EscrowStatus;
}

export class EscrowFsmValidator {
  private static readonly TERMINAL_STATES: ReadonlySet<EscrowStatus> = new Set(['RELEASED', 'REFUNDED']);

  private static readonly RULES: TransitionRule[] = [
    {
      from: 'AWAITING_DEPOSIT',
      action: 'DEPOSIT',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'FUNDED',
    },
    {
      from: 'FUNDED',
      action: 'START_WORK',
      allowedRoles: ['FREELANCER'],
      to: 'IN_PROGRESS',
    },
    {
      from: 'IN_PROGRESS',
      action: 'SUBMIT_DELIVERABLE',
      allowedRoles: ['FREELANCER'],
      to: 'SUBMITTED',
    },
    {
      from: 'IN_PROGRESS',
      action: 'RAISE_DISPUTE',
      allowedRoles: ['CLIENT'],
      to: 'DISPUTED',
    },
    {
      from: 'SUBMITTED',
      action: 'APPROVE_MILESTONE',
      allowedRoles: ['CLIENT'],
      to: 'APPROVED',
    },
    {
      from: 'SUBMITTED',
      action: 'TIMEOUT_WATCHDOG',
      allowedRoles: ['SYSTEM'],
      to: 'REVIEW_TIMEOUT',
    },
    {
      from: 'SUBMITTED',
      action: 'RAISE_DISPUTE',
      allowedRoles: ['CLIENT'],
      to: 'DISPUTED',
    },
    {
      from: 'UNDER_REVIEW',
      action: 'APPROVE_MILESTONE',
      allowedRoles: ['CLIENT'],
      to: 'APPROVED',
    },
    {
      from: 'UNDER_REVIEW',
      action: 'TIMEOUT_WATCHDOG',
      allowedRoles: ['SYSTEM'],
      to: 'REVIEW_TIMEOUT',
    },
    {
      from: 'UNDER_REVIEW',
      action: 'RAISE_DISPUTE',
      allowedRoles: ['CLIENT', 'FREELANCER'],
      to: 'DISPUTED',
    },
    {
      from: 'REVIEW_TIMEOUT',
      action: 'RELEASE_ESCROW',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'RELEASED',
    },
    {
      from: 'REVIEW_TIMEOUT',
      action: 'RAISE_DISPUTE',
      allowedRoles: ['CLIENT', 'FREELANCER'],
      to: 'DISPUTED',
    },
    {
      from: 'REVIEW_TIMEOUT',
      action: 'APPROVE_MILESTONE',
      allowedRoles: ['CLIENT'],
      to: 'APPROVED',
    },
    {
      from: 'APPROVED',
      action: 'RELEASE_ESCROW',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'RELEASED',
    },
    {
      from: 'APPROVED',
      action: 'INITIATE_SETTLEMENT',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'SETTLING',
    },
    {
      from: 'REVIEW_TIMEOUT',
      action: 'INITIATE_SETTLEMENT',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'SETTLING',
    },
    {
      from: 'SUBMITTED',
      action: 'INITIATE_SETTLEMENT',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'SETTLING',
    },
    {
      from: 'UNDER_REVIEW',
      action: 'INITIATE_SETTLEMENT',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'SETTLING',
    },
    {
      from: 'SETTLING',
      action: 'RELEASE_ESCROW',
      allowedRoles: ['CLIENT', 'SYSTEM'],
      to: 'RELEASED',
    },
    {
      from: 'SETTLING',
      action: 'SETTLEMENT_FAILED',
      allowedRoles: ['SYSTEM'],
      to: 'APPROVED',
    },
    {
      from: 'DISPUTED',
      action: 'RESOLVE_RELEASE',
      allowedRoles: ['REVIEWER', 'SYSTEM'],
      to: 'RELEASED',
    },
    {
      from: 'DISPUTED',
      action: 'RESOLVE_REFUND',
      allowedRoles: ['REVIEWER', 'SYSTEM'],
      to: 'REFUNDED',
    },
    {
      from: 'DISPUTED',
      action: 'INITIATE_REFUND',
      allowedRoles: ['REVIEWER', 'SYSTEM'],
      to: 'REFUND_PENDING',
    },
    {
      from: 'REFUND_PENDING',
      action: 'RESOLVE_REFUND',
      allowedRoles: ['REVIEWER', 'SYSTEM'],
      to: 'REFUNDED',
    },
  ];

  isTerminalState(state: EscrowStatus): boolean {
    return EscrowFsmValidator.TERMINAL_STATES.has(state);
  }

  validateTransition(
    currentState: EscrowStatus,
    action: ContractAction,
    actorRole: UserRole | 'SYSTEM'
  ): TransitionValidationResult {
    const effectiveState =
      (currentState as string) === 'PENDING' ? 'AWAITING_DEPOSIT' : currentState;

    if (this.isTerminalState(effectiveState)) {
      return {
        allowed: false,
        errorCode: 'TERMINAL_STATE_IMMUTABLE',
        reason: `Cannot transition from terminal state '${effectiveState}'.`,
      };
    }

    const matchingRule = EscrowFsmValidator.RULES.find(
      (r) => r.from === effectiveState && r.action === action
    );

    if (!matchingRule) {
      return {
        allowed: false,
        errorCode: 'FORBIDDEN_TRANSITION_PATH',
        reason: `Action '${action}' is not permitted from state '${currentState}'.`,
      };
    }

    if (!matchingRule.allowedRoles.includes(actorRole)) {
      return {
        allowed: false,
        errorCode: 'UNAUTHORIZED_FSM_ACTOR',
        reason: `Role '${actorRole}' is not authorized to execute action '${action}'.`,
      };
    }

    return {
      allowed: true,
      nextState: matchingRule.to,
    };
  }

  assertValidTransition(
    currentState: EscrowStatus,
    action: ContractAction,
    actorRole: UserRole | 'SYSTEM'
  ): EscrowStatus {
    const verdict = this.validateTransition(currentState, action, actorRole);
    if (!verdict.allowed || !verdict.nextState) {
      throw new InvalidStateTransitionError(currentState, action, verdict.reason);
    }
    return verdict.nextState;
  }
}

export const globalEscrowFsm = new EscrowFsmValidator();
