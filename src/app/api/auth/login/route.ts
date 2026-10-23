import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { AuthService } from '@/lib/auth-service';
import { SessionService } from '@/core/engine-04-web/session';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Execute 3-Tier Dual Authentication Pipeline
    const authResult = await AuthService.authenticate({
      email: validated.email,
      password: validated.password,
    });

    const user = authResult.user;

    // Issue tamper-resistant HMAC session token
    const token = SessionService.createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      formatSuccessResponse({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          balance: user.balance,
          devScore: user.devScore,
          githubProfile: user.githubProfile,
        },
        authProvider: authResult.provider,
      })
    );

    // Set secure HTTP-only session cookie
    const cookieOptions = SessionService.getSessionCookieOptions();
    response.cookies.set(SessionService.COOKIE_NAME, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    const err = formatErrorResponse(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
