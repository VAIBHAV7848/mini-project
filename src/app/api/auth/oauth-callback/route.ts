import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { SessionService } from '@/core/engine-04-web/session';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken, code } = body;

    let supabaseUser: { id: string; email: string; user_metadata?: Record<string, unknown> } | null = null;

    if (accessToken) {
      supabaseUser = await AuthService.getSupabaseUserFromToken(accessToken);
    } else if (code) {
      const tokenRes = await fetch(`${AuthService.SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
          apikey: AuthService.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_code: code }),
        signal: AbortSignal.timeout(5000),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        supabaseUser = tokenData.user;
      }
    }

    if (!supabaseUser || !supabaseUser.email) {
      return NextResponse.json(
        { error: 'Failed to verify user credentials with Supabase Google OAuth' },
        { status: 401 }
      );
    }

    // Synchronize to Prisma database with role allowlist and unmatchable password hash
    const user = await AuthService.syncSupabaseUser(supabaseUser);

    // Issue HMAC-SHA256 session token
    const token = SessionService.createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      formatSuccessResponse({
        token,
        user,
        authProvider: 'supabase_google',
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
