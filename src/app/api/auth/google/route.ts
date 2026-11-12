import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const rawRedirect = searchParams.get('redirect') || '/dashboard';

  // Open-redirect defense: strictly enforce relative local path
  const safeRedirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';

  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`;
  const supabaseAuthorizeUrl = `${AuthService.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;

  return NextResponse.redirect(supabaseAuthorizeUrl);
}
