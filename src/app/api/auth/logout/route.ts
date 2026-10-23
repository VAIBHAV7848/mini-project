import { NextResponse } from 'next/server';
import { SessionService } from '@/core/engine-04-web/session';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const response = NextResponse.json(
      formatSuccessResponse({
        message: 'Successfully logged out.',
      })
    );

    const clearOptions = SessionService.getClearCookieOptions();

    // Explicitly expire the cookie with Max-Age 0 and epoch date
    response.cookies.set(SessionService.COOKIE_NAME, '', {
      httpOnly: clearOptions.httpOnly,
      secure: clearOptions.secure,
      sameSite: clearOptions.sameSite,
      path: clearOptions.path,
      maxAge: clearOptions.maxAge,
      expires: clearOptions.expires,
    });

    // Also call Next.js cookies.delete
    response.cookies.delete(SessionService.COOKIE_NAME);

    return response;
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
