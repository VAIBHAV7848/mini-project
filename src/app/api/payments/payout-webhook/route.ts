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
    const eventType = event.event || event.type || 'TRANSFER_STATUS';
    const transferData = event.data?.transfer || event.transfer || event;
    const transferId = String(transferData.transferId || transferData.transfer_id || '');
    const referenceId = String(transferData.referenceId || transferData.reference_id || '');

    const eventId =
      event.event_id ||
      (transferId ? `payout_${eventType}_${transferId}` : null) ||
      crypto.createHash('sha256').update(rawBody).digest('hex');

    // 2. Deduplication check
    const alreadyProcessed = await PaymentService.isWebhookProcessed(eventId);
    if (alreadyProcessed) {
      return NextResponse.json({ success: true, message: 'Payout event already processed' });
    }

    await PaymentService.recordWebhookLog({
      eventId,
      eventType,
      orderId: referenceId || undefined,
      payload: rawBody,
      status: 'RECEIVED',
    });

    // 3. Process events
    switch (eventType) {
      case 'TRANSFER_SUCCESS': {
        logger.info('Cashfree Payout Transfer Successful', { transferId, referenceId });

        await globalAuditLogger.logAction({
          actorId: 'CASHFREE_PAYOUTS',
          entityName: 'PayoutTransfer',
          entityId: transferId || referenceId || 'GENERIC_PAYOUT',
          action: 'PAYOUT_TRANSFER_SUCCESS',
          previousState: 'PENDING',
          newState: 'TRANSFERRED',
        });

        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId: referenceId,
          payload: rawBody,
          status: 'PROCESSED',
        });
        break;
      }

      case 'TRANSFER_FAILED':
      case 'TRANSFER_REVERSED': {
        logger.warn('Cashfree Payout Transfer Failed or Reversed', {
          transferId,
          referenceId,
          status: eventType,
        });

        await globalAuditLogger.logAction({
          actorId: 'CASHFREE_PAYOUTS',
          entityName: 'PayoutTransfer',
          entityId: transferId || referenceId || 'GENERIC_PAYOUT',
          action: 'PAYOUT_TRANSFER_FAILED',
          previousState: 'PENDING',
          newState: eventType,
        });

        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId: referenceId,
          payload: rawBody,
          status: 'PROCESSED',
          errorMessage: transferData.statusDescription || 'Transfer rejected by bank or VPA',
        });
        break;
      }

      default: {
        logger.info('Unhandled payout event type', { eventType });
        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId: referenceId,
          payload: rawBody,
          status: 'IGNORED',
        });
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    logger.error('Error processing payout webhook', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Internal server error processing payout webhook' },
      { status: 500 }
    );
  }
}
