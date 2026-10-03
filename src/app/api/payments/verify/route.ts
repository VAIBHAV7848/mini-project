import { NextResponse } from 'next/server';
import { SessionService } from '@/core/engine-04-web/session';
import { RbacEnforcer } from '@/core/engine-04-web/rbac';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { CashfreeGateway } from '@/lib/cashfree';
import { PaymentService } from '@/lib/payments';
import {
  formatSuccessResponse,
  formatErrorResponse,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors';
import { verifyOrderSchema } from '@/lib/validation/payments';

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

    const body = await request.json();
    const validated = verifyOrderSchema.parse(body);

    // 2. Query local Payment record
    const payment = await PaymentService.getPaymentByOrderId(validated.orderId);
    if (!payment) {
      throw new NotFoundError('Payment', validated.orderId);
    }

    if (session.role === 'CLIENT' && payment.clientId !== session.userId) {
      throw new AuthorizationError('You are not authorized to verify this payment.');
    }

    // 3. If already SUCCESS, return idempotent confirmation
    if (payment.status === 'SUCCESS') {
      return NextResponse.json(
        formatSuccessResponse({
          orderId: payment.orderId,
          status: 'SUCCESS',
          milestoneId: payment.milestoneId,
          contractId: payment.contractId,
          amount: payment.amount,
          verified: true,
        })
      );
    }

    // 4. Direct Cashfree status inquiry
    const cfStatus = await CashfreeGateway.getOrderStatus(validated.orderId);

    // 5. Verification check
    const isSuccess = cfStatus.orderStatus === 'PAID' || cfStatus.paymentStatus === 'SUCCESS';
    if (!isSuccess) {
      await PaymentService.updatePaymentStatus(validated.orderId, cfStatus.paymentStatus);
      return NextResponse.json(
        formatSuccessResponse({
          orderId: validated.orderId,
          status: cfStatus.paymentStatus || cfStatus.orderStatus,
          verified: false,
          message: cfStatus.paymentMessage || 'Payment is not completed yet.',
        })
      );
    }

    // 6. Mutex critical section: prevent concurrent verify/webhook execution
    const releaseLock = await globalKeyedMutex.acquire(payment.milestoneId);
    try {
      const fundResult = await PaymentService.fundMilestoneViaGateway({
        orderId: validated.orderId,
        cfPaymentId: cfStatus.cfPaymentId,
        actorId: session.userId,
      });

      return NextResponse.json(
        formatSuccessResponse({
          orderId: validated.orderId,
          status: 'SUCCESS',
          milestoneId: fundResult.milestoneId,
          contractId: 'contractId' in fundResult ? fundResult.contractId : payment.contractId,
          amount: 'amount' in fundResult ? fundResult.amount : payment.amount,
          verified: true,
        })
      );
    } finally {
      releaseLock();
    }
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: { message: 'orderId parameter is required' } },
        { status: 400 }
      );
    }

    const payment = await PaymentService.getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: { message: 'Payment record not found' } },
        { status: 404 }
      );
    }

    const cfStatus = await CashfreeGateway.getOrderStatus(orderId);
    const isPaid = cfStatus.orderStatus === 'PAID' || cfStatus.paymentStatus === 'SUCCESS';

    if (isPaid && payment.status !== 'SUCCESS') {
      const releaseLock = await globalKeyedMutex.acquire(payment.milestoneId);
      try {
        await PaymentService.fundMilestoneViaGateway({
          orderId,
          cfPaymentId: cfStatus.cfPaymentId,
          actorId: 'GET_VERIFY_POLL',
        });
      } finally {
        releaseLock();
      }
    }

    return NextResponse.json(
      formatSuccessResponse({
        orderId,
        status: isPaid ? 'SUCCESS' : cfStatus.paymentStatus || cfStatus.orderStatus,
        orderAmount: payment.amount,
        orderCurrency: payment.currency,
        cfPaymentId: cfStatus.cfPaymentId,
      })
    );
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
