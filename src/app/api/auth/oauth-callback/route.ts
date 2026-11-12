import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { SessionService } from '@/core/engine-04-web/session';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/errors';
import { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken, code, role, checkOnly } = body;

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

    const email = supabaseUser.email.trim().toLowerCase();
    const isAdminEmail =
      email === 'chavanpatilvaibhav395@gmail.com' ||
      email.includes('vaibhav') ||
      email.includes('admin') ||
      email === '02fe24bcs013@kletech.ac.in';

    // If checkOnly is requested, determine if user needs to select a role
    if (checkOnly) {
      if (isAdminEmail) {
        // Admin proceeds directly without asking
        const user = await AuthService.syncSupabaseUser(supabaseUser, 'ADMIN');
        const token = SessionService.createToken({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        });

        const response = NextResponse.json(
          formatSuccessResponse({
            needsRoleSelection: false,
            token,
            user,
            authProvider: 'supabase_google',
          })
        );

        const cookieOptions = SessionService.getSessionCookieOptions();
        response.cookies.set(SessionService.COOKIE_NAME, token, {
          httpOnly: cookieOptions.httpOnly,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
          path: cookieOptions.path,
          maxAge: cookieOptions.maxAge,
        });

        return response;
      }

      // Non-admin: check if role was already selected or needs prompt
      if (!role) {
        const name =
          (supabaseUser.user_metadata?.name as string) ||
          (supabaseUser.user_metadata?.full_name as string) ||
          supabaseUser.email.split('@')[0];

        return NextResponse.json(
          formatSuccessResponse({
            needsRoleSelection: true,
            email: supabaseUser.email,
            name,
          })
        );
      }
    }

    // Role selection: non-admin can specify CLIENT, FREELANCER, or REVIEWER
    const validRequestedRole: UserRole | undefined =
      !isAdminEmail && (role === 'FREELANCER' || role === 'CLIENT' || role === 'REVIEWER')
        ? role
        : undefined;

    // Synchronize to Prisma database with role allowlist and unmatchable password hash
    const user = await AuthService.syncSupabaseUser(supabaseUser, isAdminEmail ? 'ADMIN' : validRequestedRole);

    // Issue HMAC-SHA256 session token
    const token = SessionService.createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      formatSuccessResponse({
        needsRoleSelection: false,
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
