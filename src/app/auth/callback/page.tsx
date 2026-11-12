'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function processOAuthCallback() {
      try {
        // Parse search params and hash fragment
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);

        // Check for error parameters
        const error = searchParams.get('error') || hashParams.get('error');
        const errorDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description') ||
          searchParams.get('message');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDesc || error || 'Google Authentication was cancelled or failed.');
          return;
        }

        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const code = searchParams.get('code') || hashParams.get('code');
        const rawRedirect = searchParams.get('redirect') || hashParams.get('redirect') || '/dashboard';

        const safeRedirect =
          rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
            ? rawRedirect
            : '/dashboard';

        if (!accessToken && !code) {
          setStatus('error');
          setErrorMessage('No authentication credentials returned from Google OAuth provider.');
          return;
        }

        // Send tokens/code to internal session minter
        const response = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken, code }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to establish local session from Google credentials.');
        }

        const result = await response.json();
        const user = result.data?.user || result.user;

        if (user?.role) {
          try {
            localStorage.setItem('activeRole', user.role);
          } catch {
            // Ignore storage restrictions
          }
        }

        setStatus('success');
        // Forward to authorized destination
        window.location.href = safeRedirect;
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Authentication processing failed.';
        setErrorMessage(message);
      }
    }

    processOAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-charcoal text-paper flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-line shadow-2xl flex flex-col items-center text-center">
        {status === 'verifying' && (
          <>
            <div className="p-4 rounded-full bg-brand-base/10 border border-brand-base/30 text-brand-base mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-base" />
            </div>
            <h2 className="text-lg font-mono font-bold text-paper mb-2">
              Verifying Google Credentials
            </h2>
            <p className="text-xs font-mono text-paper-muted">
              Exchanging cryptographically signed OAuth tokens with Supabase and establishing your tamper-resistant escrow session...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-mono font-bold text-paper mb-2">
              Authentication Verified
            </h2>
            <p className="text-xs font-mono text-paper-muted">
              Session authorized with RBAC gate. Redirecting to workspace dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-lg font-mono font-bold text-rose-300 mb-2">
              Authentication Error
            </h2>
            <p className="text-xs font-mono text-rose-200/80 mb-6 bg-rose-950/40 p-3 rounded-lg border border-rose-900/40">
              {errorMessage}
            </p>
            <Link
              href="/login"
              className="py-2.5 px-6 rounded-xl font-mono text-xs font-bold bg-brand-base text-charcoal hover:bg-brand-light transition-all shadow-md"
            >
              Return to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
