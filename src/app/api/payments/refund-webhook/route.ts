import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { CashfreeGateway } from '@/lib/cashfree';
import { PaymentService } from '@/lib/payments';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Empty payload' }, { status: 400 });
    }

    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    // 1. Verify HMAC-SHA256 signature
    const isValid = CashfreeGateway.verifyWebhookSignature(rawBody, signature, timestamp, 300);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event || 'REFUND_STATUS';
    const refundData = event.data?.refund || event.refund || event;
    const refundId = String(refundData.refund_id || refundData.refundId || '');
    const orderId = String(refundData.order_id || refundData.orderId || '');

    const eventId =
      event.event_id ||
      (refundId ? `refund_${eventType}_${refundId}` : null) ||
      crypto.createHash('sha256').update(rawBody).digest('hex');

    // 2. Deduplication check
    const alreadyProcessed = await PaymentService.isWebhookProcessed(eventId);
    if (alreadyProcessed) {
      return NextResponse.json({ success: true, message: 'Refund event already processed' });
    }

    await PaymentService.recordWebhookLog({
      eventId,
      eventType,
      orderId: orderId || undefined,
      payload: rawBody,
      status: 'RECEIVED',
    });

    // 3. Process events
    switch (eventType) {
      case 'REFUND_SUCCESS_WEBHOOK':
      case 'REFUND_SUCCESS': {
        logger.info('Cashfree Refund Successful', { refundId, orderId });

        if (orderId) {
          await PaymentService.updatePaymentStatus(orderId, 'REFUNDED', undefined, rawBody);
        }

        await globalAuditLogger.logAction({
          actorId: 'CASHFREE_REFUNDS',
          entityName: 'PaymentRefund',
          entityId: refundId || orderId || 'GENERIC_REFUND',
          action: 'CASHFREE_REFUND_SUCCESS',
          previousState: 'REFUND_PENDING',
          newState: 'REFUNDED',
        });

        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId,
          payload: rawBody,
          status: 'PROCESSED',
        });
        break;
      }

      case 'REFUND_FAILED_WEBHOOK':
      case 'REFUND_FAILED': {
        logger.warn('Cashfree Refund Failed', { refundId, orderId });

        await globalAuditLogger.logAction({
          actorId: 'CASHFREE_REFUNDS',
          entityName: 'PaymentRefund',
          entityId: refundId || orderId || 'GENERIC_REFUND',
          action: 'CASHFREE_REFUND_FAILED',
          previousState: 'REFUND_PENDING',
          newState: 'FAILED',
        });

        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId,
          payload: rawBody,
          status: 'PROCESSED',
          errorMessage: refundData.status_description || 'Refund failed at gateway',
        });
        break;
      }

      default: {
        logger.info('Unhandled refund webhook event', { eventType });
        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId,
          payload: rawBody,
          status: 'IGNORED',
        });
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    logger.error('Error processing refund webhook', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Internal server error processing refund webhook' },
      { status: 500 }
    );
  }
}
