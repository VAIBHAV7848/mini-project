'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, Loader2, Briefcase, Code2, Scale, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'select_role' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userProfile, setUserProfile] = useState<{ email: string; name: string } | null>(null);
  const [tokens, setTokens] = useState<{ accessToken: string | null; code: string | null; redirectUrl: string }>({
    accessToken: null,
    code: null,
    redirectUrl: '/dashboard',
  });
  const [submittingRole, setSubmittingRole] = useState<UserRole | null>(null);

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

        setTokens({ accessToken, code, redirectUrl: safeRedirect });

        // Step 1: Pre-flight check - does user need role selection or is admin?
        const checkResponse = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken, code, checkOnly: true }),
        });

        if (!checkResponse.ok) {
          const errData = await checkResponse.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to establish local session from Google credentials.');
        }

        const checkResult = await checkResponse.json();

        if (checkResult.data?.needsRoleSelection) {
          setUserProfile({
            email: checkResult.data.email,
            name: checkResult.data.name,
          });
          setStatus('select_role');
          return;
        }

        // Direct session success (e.g. Admin or existing session)
        const user = checkResult.data?.user || checkResult.user;
        if (user?.role) {
          try {
            localStorage.setItem('activeRole', user.role);
          } catch {
            // Ignore storage restrictions
          }
        }

        setStatus('success');
        window.location.href = safeRedirect;
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Authentication processing failed.';
        setErrorMessage(message);
      }
    }

    processOAuthCallback();
  }, [router]);

  async function handleSelectRole(role: UserRole) {
    if (submittingRole) return;
    setSubmittingRole(role);

    try {
      const response = await fetch('/api/auth/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          code: tokens.code,
          role,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to configure selected role.');
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
      window.location.href = tokens.redirectUrl;
    } catch (err: unknown) {
      setSubmittingRole(null);
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Failed to finalize role selection.';
      setErrorMessage(message);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal text-paper flex flex-col items-center justify-center p-4">
      {status === 'select_role' ? (
        <div className="w-full max-w-xl p-8 rounded-2xl bg-surface border border-line shadow-2xl flex flex-col items-center">
          <div className="p-3.5 rounded-full bg-brand-base/10 border border-brand-base/30 text-brand-base mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-base" />
          </div>

          <h1 className="text-xl font-mono font-bold text-paper text-center">
            Welcome, {userProfile?.name || 'Explorer'}!
          </h1>
          <p className="text-xs font-mono text-paper-muted text-center mt-1 mb-6">
            Signed in via Google as <span className="text-brand-light font-semibold">{userProfile?.email}</span>. How would you like to use GigaFlow?
          </p>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Client Option */}
            <button
              type="button"
              disabled={Boolean(submittingRole)}
              onClick={() => handleSelectRole('CLIENT')}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                submittingRole === 'CLIENT'
                  ? 'border-brand-base bg-brand-base/10 ring-2 ring-brand-base'
                  : 'border-line bg-charcoal/60 hover:border-brand-base/60 hover:bg-surface-elevated'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm font-mono font-bold text-paper mb-1 flex items-center justify-between w-full">
                Client
                <ArrowRight className="w-3.5 h-3.5 text-paper-muted" />
              </span>
              <p className="text-[11px] font-mono text-paper-muted leading-relaxed">
                Post projects, fund escrow milestones, and review verified deliverables.
              </p>
              <span className="mt-3 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Hire & Fund
              </span>
            </button>

            {/* Freelancer Option */}
            <button
              type="button"
              disabled={Boolean(submittingRole)}
              onClick={() => handleSelectRole('FREELANCER')}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                submittingRole === 'FREELANCER'
                  ? 'border-brand-base bg-brand-base/10 ring-2 ring-brand-base'
                  : 'border-line bg-charcoal/60 hover:border-brand-base/60 hover:bg-surface-elevated'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
                <Code2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-mono font-bold text-paper mb-1 flex items-center justify-between w-full">
                Freelancer
                <ArrowRight className="w-3.5 h-3.5 text-paper-muted" />
              </span>
              <p className="text-[11px] font-mono text-paper-muted leading-relaxed">
                Submit proposals, complete code milestones, and get guaranteed payouts.
              </p>
              <span className="mt-3 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Build & Earn
              </span>
            </button>

            {/* Reviewer Option */}
            <button
              type="button"
              disabled={Boolean(submittingRole)}
              onClick={() => handleSelectRole('REVIEWER')}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                submittingRole === 'REVIEWER'
                  ? 'border-brand-base bg-brand-base/10 ring-2 ring-brand-base'
                  : 'border-line bg-charcoal/60 hover:border-brand-base/60 hover:bg-surface-elevated'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm font-mono font-bold text-paper mb-1 flex items-center justify-between w-full">
                Reviewer
                <ArrowRight className="w-3.5 h-3.5 text-paper-muted" />
              </span>
              <p className="text-[11px] font-mono text-paper-muted leading-relaxed">
                Inspect Merkle evidence trees and arbitrate escrow dispute settlements.
              </p>
              <span className="mt-3 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Arbitrate
              </span>
            </button>
          </div>

          {submittingRole && (
            <div className="flex items-center gap-2 text-xs font-mono text-brand-light">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing your {submittingRole.toLowerCase()} workspace...
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
