import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { SessionService } from '@/core/engine-04-web/session';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as sessionHandler } from '@/app/api/auth/session/route';
import { middleware } from '@/middleware';

describe('Engine 04 (Web) — Dual Auth, Session Gate & Middleware Suite', () => {
  let testUser: any;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const passwordHash = bcrypt.hashSync(testPassword, 8);
    testUser = await prisma.user.create({
      data: {
        email: `auth-test-${Date.now()}@test.local`,
        passwordHash,
        name: 'Auth Test User',
        role: 'CLIENT',
        balance: 1000.0,
        devScore: 75,
      },
    });
  });

  describe('AuthService & Dual Authentication', () => {
    it('authenticates valid local credentials against database with bcrypt', async () => {
      const result = await AuthService.authenticate({
        email: testUser.email,
        password: testPassword,
      });

      expect(result.user.id).toBe(testUser.id);
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.role).toBe('CLIENT');
      expect(result.provider).toBe('local');
    });

    it('authenticates pinned demo personas using master password VAIBHAV2667', async () => {
      const result = await AuthService.authenticate({
        email: 'client1@escrow.local',
        password: 'VAIBHAV2667',
      });

      expect(result.user.email).toBe('client1@escrow.local');
      expect(result.user.role).toBe('CLIENT');
      expect(result.provider).toBe('demo_fallback');
    });

    it('authenticates pinned demo personas using master password Password123!', async () => {
      const result = await AuthService.authenticate({
        email: 'dev1@escrow.local',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('dev1@escrow.local');
      expect(result.user.role).toBe('FREELANCER');
    });

    it('rejects invalid password for non-demo accounts with AuthenticationError', async () => {
      await expect(
        AuthService.authenticate({
          email: testUser.email,
          password: 'WrongPassword999!',
        })
      ).rejects.toThrow();
    });
  });

  describe('API Route Handlers: /api/auth/login, logout, session', () => {
    it('POST /api/auth/login sets escrow_session cookie on success', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testPassword,
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.id).toBe(testUser.id);
      expect(json.data.token).toBeDefined();

      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('escrow_session=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Path=/');
    });

    it('POST /api/auth/logout invalidates session cookie by setting epoch date', async () => {
      const req = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain('escrow_session=');
      expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    });

    it('GET /api/auth/session returns user identity for valid session cookie', async () => {
      const token = SessionService.createToken({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      });

      const req = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Cookie: `escrow_session=${token}`,
        },
      });

      const res = await sessionHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(testUser.id);
      expect(json.data.email).toBe(testUser.email);
    });
  });

  describe('SessionService Cryptographic Invariants', () => {
    it('creates and verifies HMAC-SHA256 tokens', () => {
      const token = SessionService.createToken({
        id: 'usr-123',
        email: 'test@domain.com',
        role: 'CLIENT',
        name: 'Test Name',
      });

      const verified = SessionService.verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('usr-123');
      expect(verified?.role).toBe('CLIENT');
    });

    it('rejects tampered tokens with invalid signature', () => {
      const token = SessionService.createToken({
        id: 'usr-123',
        email: 'test@domain.com',
        role: 'CLIENT',
        name: 'Test Name',
      });

      const [payload] = token.split('.');
      const tampered = `${payload}.tampered_signature_bytes`;
      expect(SessionService.verifyToken(tampered)).toBeNull();
    });

    it('rejects expired tokens', () => {
      const expiredToken = SessionService.createToken(
        {
          id: 'usr-123',
          email: 'test@domain.com',
          role: 'CLIENT',
          name: 'Test Name',
        },
        -10 // Expired 10 seconds ago
      );

      expect(SessionService.verifyToken(expiredToken)).toBeNull();
    });
  });

  describe('Middleware Gate Enforcement', () => {
    it('redirects unauthenticated requests from /dashboard to /login with redirect query', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const res = await middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fdashboard');
    });

    it('redirects unauthenticated requests from /projects to /login', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/projects'));
      const res = await middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fprojects');
    });

    it('allows authenticated requests to access /dashboard', async () => {
      const token = SessionService.createToken({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      });

      const req = new NextRequest(new URL('http://localhost:3000/dashboard'), {
        headers: {
          Cookie: `escrow_session=${token}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('redirects authenticated user away from /login to /dashboard', async () => {
      const token = SessionService.createToken({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      });

      const req = new NextRequest(new URL('http://localhost:3000/login'), {
        headers: {
          Cookie: `escrow_session=${token}`,
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/dashboard');
    });

    it('allows unauthenticated access to public routes such as / and /login', async () => {
      const req = new NextRequest(new URL('http://localhost:3000/'));
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });
});
