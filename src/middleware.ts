import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return 'gigaflow_production_escrow_session_secret_key_32_chars_fallback';
  }
  if (secret.length < 32) {
    return secret.padEnd(32, '0');
  }
  return secret;
}

const SESSION_SECRET = resolveSessionSecret();

/**
 * Routes requiring active authentication.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/projects',
  '/gigs',
  '/disputes',
  '/contracts',
  '/audit',
  '/settings',
] as const;

/**
 * Public routes that must remain accessible without authentication.
 */
const PUBLIC_EXACT_ROUTES = new Set([
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/session',
  '/api/auth/logout',
]);

interface SessionPayload {
  userId: string;
  email: string;
  role: 'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN';
  name: string;
  exp: number;
}

/**
 * Constant-time string equality check to mitigate timing attacks.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Decodes base64url string to utf-8 text using Web Standards.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Edge-compatible HMAC-SHA256 signature generator using Web Crypto API.
 */
async function computeHmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Verifies the HMAC-SHA256 signature and expiration of the escrow_session cookie.
 * Operates purely with Web Crypto API and zero Node.js native dependencies.
 */
async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return null;

    // Recalculate HMAC signature using Web Crypto API
    const expectedSignature = await computeHmacSha256(SESSION_SECRET, encodedPayload);

    // Constant-time comparison
    if (!constantTimeEqual(signature, expectedSignature)) {
      return null;
    }

    // Decode and validate payload
    const decodedStr = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(decodedStr);

    // Validate expiration (seconds since epoch)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowInSeconds) {
      return null;
    }

    // Validate core payload attributes
    if (!payload.userId || !payload.role || !payload.email) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Determines whether a requested pathname falls under protected routes.
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Next.js Route Protection Middleware
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass static assets and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Bypass explicit public routes
  if (PUBLIC_EXACT_ROUTES.has(pathname)) {
    // If authenticated user visits /login, redirect to /dashboard
    if (pathname === '/login') {
      const existingToken = request.cookies.get('escrow_session')?.value;
      if (existingToken) {
        const session = await verifySessionToken(existingToken);
        if (session) {
          const dashboardUrl = new URL('/dashboard', request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      }
    }
    return NextResponse.next();
  }

  // 3. Check protected route access
  if (isProtectedRoute(pathname)) {
    const sessionCookie = request.cookies.get('escrow_session')?.value;
    const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

    if (!session) {
      // Build safe redirect URI with original path & query parameters
      const loginUrl = new URL('/login', request.url);
      const originalPath = `${pathname}${search}`;
      loginUrl.searchParams.set('redirect', originalPath);

      const response = NextResponse.redirect(loginUrl);

      // If an invalid or expired cookie was present, clear it
      if (sessionCookie) {
        response.cookies.set('escrow_session', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        });
      }

      return response;
    }

    // 4. Enrich downstream request headers with validated session claims
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
    requestHeaders.set('x-user-email', session.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

/**
 * Middleware Matcher Configuration
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
