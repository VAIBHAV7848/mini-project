import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UpiPaymentService } from '@/core/engine-03-dbms/payments/upi-payment-service';
import { globalAuditLogger } from '@/core/engine-03-dbms/audit-logger';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get('x-gateway-signature') ||
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-signature') ||
      '';
    const timestamp =
      request.headers.get('x-gateway-timestamp') ||
      request.headers.get('x-webhook-timestamp') ||
      request.headers.get('x-timestamp') ||
      Math.floor(Date.now() / 1000).toString();

    const secret = UpiPaymentService.getWebhookSecret();

    // 1. Validate signature
    const isValid = UpiPaymentService.verifyWebhookSignature(rawBody, timestamp, signature, secret);

    if (!isValid) {
      logger.warn('Rejected UPI webhook: invalid or missing signature', {
        hasSignature: !!signature,
        timestamp,
      });

      await prisma.webhookLog.create({
        data: {
          id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          provider: 'UPI_OBSERVER',
          eventType: 'UNKNOWN',
          payload: rawBody.slice(0, 1000),
          signature: signature || null,
          isValid: false,
          processed: false,
          error: 'INVALID_SIGNATURE',
        },
      });

      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or forged webhook signature.' } },
        { status: 401 }
      );
    }

    // 2. Parse payload
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Malformed JSON payload.' } },
        { status: 400 }
      );
    }

    const orderId = payload.orderId || payload.paymentId || payload.tr;
    const utr = payload.utr || payload.bankRef || payload.rrn;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing orderId in payload.' } },
        { status: 400 }
      );
    }

    // 3. Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { upiOrderId: orderId },
          { providerOrderId: orderId },
          { id: orderId },
        ],
      },
    });

    if (!payment) {
      logger.warn('UPI webhook referenced non-existent order', { orderId });
      return NextResponse.json({ success: true, message: 'Order not found, webhook acknowledged.' });
    }

    // 4. Record webhook log
    await prisma.webhookLog.create({
      data: {
        id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        provider: 'UPI_OBSERVER',
        eventType: payload.event || 'PAYMENT_DETECTED',
        payload: rawBody.slice(0, 2000),
        signature,
        isValid: true,
        processed: true,
      },
    });

    // 5. Treat as detection signal: Move to PENDING_REVIEW (NEVER autonomous wallet credit!)
    if (payment.status === 'PENDING') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PENDING_REVIEW',
          ...(utr ? { upiUtr: utr, providerPaymentId: utr } : {}),
        },
      });

      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: 'OBSERVER_DETECTION_SIGNAL',
          providerEventId: utr || null,
          rawPayload: rawBody,
          status: 'PENDING_REVIEW',
        },
      });

      await globalAuditLogger.logAction({
        actorId: 'UPI_OBSERVER_WEBHOOK',
        entityName: 'Payment',
        entityId: payment.id,
        action: 'OBSERVER_PAYMENT_DETECTED_SIGNAL',
        previousState: 'PENDING',
        newState: 'PENDING_REVIEW',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Detection signal logged. Order placed in PENDING_REVIEW for admin bank confirmation.',
      orderId,
    });
  } catch (error: any) {
    logger.error('Error processing UPI webhook', { error: error.message });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process webhook.' } },
      { status: 500 }
    );
  }
}
