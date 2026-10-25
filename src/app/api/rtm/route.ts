import { NextResponse } from 'next/server';
import { RequirementsTraceabilityMatrix } from '@/core/engine-02-dsa-se/rtm';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

/**
 * Engine 02 (DSA & SE Engine) — Requirements Traceability Matrix (RTM) API Route
 * Exposes live verification status, acceptance criteria, test suite mapping,
 * and engine ownership breakdown for formal verification & validation audits.
 */
export async function GET() {
  try {
    const matrixReport = RequirementsTraceabilityMatrix.generateMatrixReport();
    return NextResponse.json(formatSuccessResponse(matrixReport));
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
