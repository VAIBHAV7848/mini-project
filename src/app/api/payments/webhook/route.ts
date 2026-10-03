import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { CashfreeGateway } from '@/lib/cashfree';
import { PaymentService } from '@/lib/payments';
import { globalKeyedMutex } from '@/core/engine-01-os/mutex';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  let rawBody = '';
  try {
    // 1. Read raw text body BEFORE json parsing for signature integrity
    rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: 'Empty webhook payload' },
        { status: 400 }
      );
    }

    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    // 2. Verify Cashfree HMAC-SHA256 signature with 300s replay window
    const isValid = CashfreeGateway.verifyWebhookSignature(rawBody, signature, timestamp, 300);
    if (!isValid) {
      logger.warn('Unauthorized Cashfree webhook: signature mismatch or replay expired', {
        timestamp,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // 3. Parse JSON body
    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event || 'UNKNOWN';
    const orderData = event.data?.order || event.order;
    const paymentData = event.data?.payment || event.payment;
    const orderId = orderData?.order_id || event.order_id;
    const cfPaymentId = paymentData?.cf_payment_id ? String(paymentData.cf_payment_id) : undefined;

    // 4. Compute unique eventId for deduplication
    const eventId =
      event.event_id ||
      (cfPaymentId ? `evt_${eventType}_${cfPaymentId}` : null) ||
      crypto.createHash('sha256').update(rawBody).digest('hex');

    // 5. Deduplicate event
    const alreadyProcessed = await PaymentService.isWebhookProcessed(eventId);
    if (alreadyProcessed) {
      logger.info('Duplicate webhook skipped', { eventId, orderId, eventType });
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    await PaymentService.recordWebhookLog({
      eventId,
      eventType,
      orderId,
      payload: rawBody,
      status: 'RECEIVED',
    });

    // 6. Handle event types
    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
      case 'PAYMENT_SUCCESS': {
        if (!orderId) {
          throw new Error('Order ID missing in PAYMENT_SUCCESS_WEBHOOK');
        }

        const payment = await PaymentService.getPaymentByOrderId(orderId);
        if (!payment) {
          logger.warn('Payment record not found for webhook order', { orderId });
          await PaymentService.recordWebhookLog({
            eventId,
            eventType,
            orderId,
            payload: rawBody,
            status: 'IGNORED',
            errorMessage: 'Payment record not found',
          });
          return NextResponse.json({ success: true, message: 'Payment record not found' });
        }

        // Concurrency lock on milestone
        const releaseLock = await globalKeyedMutex.acquire(payment.milestoneId);
        try {
          await PaymentService.fundMilestoneViaGateway({
            orderId,
            cfPaymentId,
            actorId: 'SYSTEM_WEBHOOK',
          });

          await PaymentService.recordWebhookLog({
            eventId,
            eventType,
            orderId,
            payload: rawBody,
            status: 'PROCESSED',
          });
        } finally {
          releaseLock();
        }
        break;
      }

      case 'PAYMENT_FAILED_WEBHOOK':
      case 'PAYMENT_FAILED': {
        if (orderId) {
          await PaymentService.updatePaymentStatus(orderId, 'FAILED', cfPaymentId, rawBody);
        }
        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId,
          payload: rawBody,
          status: 'PROCESSED',
        });
        break;
      }

      case 'USER_DROPPED_WEBHOOK': {
        if (orderId) {
          await PaymentService.updatePaymentStatus(orderId, 'USER_DROPPED', cfPaymentId, rawBody);
        }
        await PaymentService.recordWebhookLog({
          eventId,
          eventType,
          orderId,
          payload: rawBody,
          status: 'PROCESSED',
        });
        break;
      }

      default: {
        logger.info('Unhandled Cashfree webhook event type', { eventType });
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
    logger.error('Cashfree webhook processing error', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
