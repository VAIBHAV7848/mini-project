import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { SessionService } from '@/core/engine-04-web/session';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next');

  // Open-redirect defense
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
  }

  try {
    const tokenResponse = await fetch(
      `${AuthService.SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
      {
        method: 'POST',
        headers: {
          apikey: AuthService.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_code: code }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const user = await AuthService.syncSupabaseUser(tokenData.user);

    const sessionToken = SessionService.createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.redirect(`${origin}${redirectTarget}`);
    const cookieOpts = SessionService.getSessionCookieOptions();

    response.cookies.set(SessionService.COOKIE_NAME, sessionToken, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=oauth_internal_failure`);
  }
}
