import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { CashfreeGateway } from '@/lib/cashfree';
import { PaymentService } from '@/lib/payments';
import {
  formatSuccessResponse,
  formatErrorResponse,
  NotFoundError,
  ValidationError,
  AuthorizationError,
  InvalidStateTransitionError,
} from '@/lib/errors';
import { createOrderSchema } from '@/lib/validation/payments';

export async function POST(request: Request) {
  try {
    // 1. Session verification
    const session = await SessionService.getSessionFromHeaders(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    RbacEnforcer.enforceRole(session, ['CLIENT', 'ADMIN']);

    // 2. Validate input schema
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // 3. Database query for contract & milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: validated.milestoneId },
      include: {
        contract: {
          include: {
            client: { select: { id: true, name: true, email: true } },
            milestones: { orderBy: { sequenceOrder: 'asc' } },
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone', validated.milestoneId);
    }

    // 4. Authorization check: caller must be the contract client
    if (session.role === 'CLIENT' && milestone.contract.clientId !== session.userId) {
      throw new AuthorizationError('Only the contracted client can fund this milestone.');
    }

    // 5. Milestone status check (must be AWAITING_DEPOSIT or PENDING)
    if (milestone.status !== 'AWAITING_DEPOSIT' && milestone.status !== 'PENDING') {
      throw new InvalidStateTransitionError(
        milestone.status,
        'DEPOSIT',
        `Milestone is in status '${milestone.status}'. Only milestones in AWAITING_DEPOSIT or PENDING can be funded.`
      );
    }

    // 6. Sequential dependency check (FR-12): Preceding milestones must be funded or resolved
    const precedingIncomplete = milestone.contract.milestones.find(
      (m) => m.sequenceOrder < milestone.sequenceOrder && m.status === 'PENDING'
    );
    if (precedingIncomplete) {
      throw new InvalidStateTransitionError(
        milestone.status,
        'DEPOSIT',
        `Preceding milestone #${precedingIncomplete.sequenceOrder} must be funded before milestone #${milestone.sequenceOrder}.`
      );
    }

    // 7. Server-side amount retrieval: NEVER trust client-supplied amount
    const orderAmount = Number(milestone.amount.toFixed(2));
    const amountPaise = milestone.amountPaise > 0 ? milestone.amountPaise : Math.round(orderAmount * 100);
    if (orderAmount <= 0) {
      throw new ValidationError('Milestone amount must be greater than zero.');
    }

    // 8. Idempotency Check: check for active unpaid Cashfree order
    const existingPayment = await PaymentService.findActivePendingPayment(milestone.id);
    if (existingPayment) {
      try {
        const cfStatus = await CashfreeGateway.getOrderStatus(existingPayment.orderId);
        if (cfStatus.orderStatus === 'ACTIVE' && existingPayment.paymentSessionId) {
          return NextResponse.json(
            formatSuccessResponse({
              paymentSessionId: existingPayment.paymentSessionId,
              orderId: existingPayment.orderId,
              amount: existingPayment.amount,
              currency: existingPayment.currency,
              reused: true,
            })
          );
        } else if (cfStatus.orderStatus === 'PAID') {
          // If already paid at gateway, trigger atomic funding
          await PaymentService.fundMilestoneViaGateway({
            orderId: existingPayment.orderId,
            cfPaymentId: cfStatus.cfPaymentId,
            actorId: session.userId,
          });
          return NextResponse.json(
            formatSuccessResponse({
              paymentSessionId: existingPayment.paymentSessionId,
              orderId: existingPayment.orderId,
              amount: existingPayment.amount,
              currency: existingPayment.currency,
              status: 'FUNDED',
            })
          );
        } else {
          // Expired or failed; mark and allow creation of a fresh order
          await PaymentService.updatePaymentStatus(existingPayment.orderId, cfStatus.orderStatus);
        }
      } catch {
        // If checking status fails, proceed with new order creation
      }
    }

    // 9. Generate unique Cashfree order ID
    const sanitizedMilestoneId = milestone.id.replace(/-/g, '').slice(0, 12);
    const orderId = `cf_${sanitizedMilestoneId}_${Date.now()}`;

    // Default return URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl =
      validated.returnUrl ||
      `${appUrl}/contracts/${milestone.contractId}?order_id={order_id}&milestone_id=${milestone.id}`;

    // 10. Call Cashfree gateway to create order
    const cfOrder = await CashfreeGateway.createOrder({
      orderId,
      orderAmount,
      orderCurrency: 'INR',
      customerDetails: {
        customerId: milestone.contract.client.id,
        customerEmail: validated.customerEmail || milestone.contract.client.email,
        customerPhone: validated.customerPhone || '9999999999',
        customerName: validated.customerName || milestone.contract.client.name,
      },
      orderNote: `Milestone Deposit: ${milestone.title}`,
      returnUrl,
    });

    // 11. Persist Payment record with status PENDING
    await PaymentService.createPaymentRecord({
      orderId: cfOrder.orderId,
      milestoneId: milestone.id,
      contractId: milestone.contractId,
      clientId: milestone.contract.clientId,
      amount: orderAmount,
      amountPaise,
      currency: 'INR',
      paymentSessionId: cfOrder.paymentSessionId,
    });

    // 12. Return required response payload
    return NextResponse.json(
      formatSuccessResponse({
        paymentSessionId: cfOrder.paymentSessionId,
        orderId: cfOrder.orderId,
        amount: orderAmount,
        currency: 'INR',
      }),
      { status: 201 }
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
