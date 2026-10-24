import crypto from 'node:crypto';
import prisma from '@/lib/db';
import { SessionContext, UserRole } from '@/types';

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

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  exp: number;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge?: number;
  expires?: Date;
}

export class SessionService {
  public static readonly COOKIE_NAME = 'escrow_session';
  public static readonly DEFAULT_MAX_AGE_SECONDS = 86400; // 24 hours

  /**
   * Returns canonical cookie options for setting the session cookie.
   */
  public static getSessionCookieOptions(expiresInSeconds = SessionService.DEFAULT_MAX_AGE_SECONDS): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInSeconds,
    };
  }

  /**
   * Returns canonical cookie options for clearing/invalidating the session cookie.
   */
  public static getClearCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    };
  }

  /**
   * Generates a tamper-resistant signed HMAC session token.
   */
  static createToken(user: { id: string; email: string; role: UserRole; name: string }, expiresInSeconds = SessionService.DEFAULT_MAX_AGE_SECONDS): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };

    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encoded)
      .digest('base64url');

    return `${encoded}.${signature}`;
  }

  /**
   * Verifies an HMAC signature and decodes the session context.
   */
  static verifyToken(token: string): SessionContext | null {
    try {
      if (!token || typeof token !== 'string') return null;

      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const [encoded, signature] = parts;
      if (!encoded || !signature) return null;

      const expectedSignature = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(encoded)
        .digest('base64url');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);

      // Constant-time comparison with explicit length guard to prevent RangeError timing side-channels
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null;
      }

      const decodedStr = Buffer.from(encoded, 'base64url').toString('utf-8');
      const payload: TokenPayload = JSON.parse(decodedStr);

      if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }

      if (!payload.userId || !payload.email || !payload.role || !payload.name) {
        return null; // Malformed payload
      }

      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    } catch {
      return null;
    }
  }

  /**
   * Resolves SessionContext from standard HTTP headers or development simulation headers.
   */
  static async getSessionFromHeaders(headers: Headers): Promise<SessionContext | null> {
    // 1. Check Bearer Authorization Header
    const authHeader = headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const session = SessionService.verifyToken(token);
      if (session) return session;
    }

    // 2. Check Cookie Header
    const cookieHeader = headers.get('cookie');
    if (cookieHeader) {
      const regex = new RegExp(`(?:^|;\\s*)${SessionService.COOKIE_NAME}=([^;]+)`);
      const match = cookieHeader.match(regex);
      if (match && match[1]) {
        const session = SessionService.verifyToken(decodeURIComponent(match[1].trim()));
        if (session) return session;
      }
    }

    // 3. Simulated direct test headers (Restricted strictly to non-production environments)
    if (process.env.NODE_ENV !== 'production') {
      const simulatedUserId = headers.get('x-user-id');
      if (simulatedUserId) {
        const user = await prisma.user.findUnique({
          where: { id: simulatedUserId },
        });
        if (user) {
          return {
            userId: user.id,
            email: user.email,
            role: user.role as UserRole,
            name: user.name,
          };
        }
      }
    }

    return null;
  }
}
