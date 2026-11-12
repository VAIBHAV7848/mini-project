'use client';

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Code2,
  Scale,
  KeyRound,
  Loader2,
  Volume2,
  VolumeX,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { useRole, Role } from '@/components/layout/RoleContext';
import { MechanicalEscrowVault, VaultState } from '@/components/auth/MechanicalEscrowVault';
import { InteractiveMonkeyAvatar } from '@/components/auth/InteractiveMonkeyAvatar';
import { AiAvatarSecurityAgent } from '@/components/auth/AiAvatarSecurityAgent';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import type { VideoAvatarState as AvatarState } from '@/components/auth/RealisticAiVideoAvatar';
import {
  playTumblerClick,
  playVaultUnlock,
  playVaultError,
  playSwitchClick,
  setMuted,
} from '@/lib/vault-audio';

interface PersonaProfile {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  title: string;
  badgeLabel: string;
  balanceFormatted: string;
  devScore: number;
  description: string;
  icon: React.ElementType;
}

const PERSONA_PROFILES: PersonaProfile[] = [
  {
    id: '9d640d0c-137c-47dd-a118-084d7e2ec807',
    name: 'Alice Chen',
    email: 'client1@escrow.local',
    password: 'Password123!',
    role: 'CLIENT',
    title: 'Enterprise Client',
    badgeLabel: 'Funded Client',
    balanceFormatted: '₹10,00,000.00',
    devScore: 50,
    description: 'Project initiator with verified escrow funding privileges & milestone release authority.',
    icon: Briefcase,
  },
  {
    id: 'a7a09030-f1c7-4d58-82db-e7a556871fc4',
    name: 'Charlie Vance',
    email: 'dev1@escrow.local',
    password: 'Password123!',
    role: 'FREELANCER',
    title: 'Lead Full-Stack Dev',
    badgeLabel: 'Top Rated 92%',
    balanceFormatted: '₹2,50,000.00',
    devScore: 92,
    description: 'Cryptographic engineer with SHA-256 deliverable submission & milestone execution.',
    icon: Code2,
  },
  {
    id: '54da6e71-a111-49f9-ac18-e25817066cbf',
    name: 'Hon. Justine',
    email: 'reviewer1@escrow.local',
    password: 'Password123!',
    role: 'REVIEWER',
    title: 'Dispute Magistrate',
    badgeLabel: 'Arbitrator',
    balanceFormatted: 'Zero Bias (Escrow)',
    devScore: 98,
    description: 'Impartial judicial reviewer handling cryptographic evidence audits & binding fund rulings.',
    icon: Scale,
  },
  {
    id: '233616fd-2260-4131-882a-bb9e50f295b1',
    name: 'Platform Administrator',
    email: 'admin@escrow.local',
    password: 'Password123!',
    role: 'ADMIN',
    title: 'Platform Lead & Settlement Officer',
    badgeLabel: 'Root Authority',
    balanceFormatted: 'Finance Vault',
    devScore: 100,
    description: 'Independent inspection of incoming credits, UTR correlation, deposit verification, and freelancer settlement disbursement.',
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [, startTransition] = useTransition();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Visualizer Mode: 'monkey' (Interactive Monkey Mascot), 'vault' (Mechanical Vault), or 'coder' (Interactive Coder)
  const [visualizerMode, setVisualizerMode] = useState<'monkey' | 'vault' | 'coder'>('monkey');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // Vault state
  const [vaultState, setVaultState] = useState<VaultState>('idle');

  // Interaction feedback states
  const [authenticatingPersonaId, setAuthenticatingPersonaId] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authTargetName, setAuthTargetName] = useState<string>('');

  // Mobile view switcher
  const [activeTab, setActiveTab] = useState<'credentials' | 'personas'>('credentials');

  // Live telemetry ping state
  const [syncLatency, setSyncLatency] = useState(16);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncLatency(Math.floor(14 + Math.random() * 6));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Compute live entropy and synthetic hash for the vault
  const { entropy, hashPreview } = useMemo(() => {
    const input = `${email}:${password}`;
    if (!input || input === ':') {
      return {
        entropy: 0,
        hashPreview: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };
    }

    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    const fullSyntheticDigest = `${hex}${hex.split('').reverse().join('')}4f89d312bc901a7e456def891234abcd`;
    const computedEntropy = Math.min(100, Math.round((email.length * 3 + password.length * 6) * 1.2));

    return {
      entropy: computedEntropy,
      hashPreview: fullSyntheticDigest,
    };
  }, [email, password]);

  // Derive react-ai-avatar AvatarState from active authentication flow
  const avatarState: AvatarState = useMemo(() => {
    if (authSuccess) return 'speaking';
    if (isFormSubmitting || authenticatingPersonaId) return 'thinking';
    if (vaultState === 'typing') {
      return password.length > 0 ? 'working' : 'listening';
    }
    return 'idle';
  }, [authSuccess, isFormSubmitting, authenticatingPersonaId, vaultState, password]);

  const toggleSound = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    setMuted(!nextState);
    if (nextState) {
      playSwitchClick();
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    playTumblerClick();
    setVaultState('typing');
  };

  const executeLogin = async (targetEmail: string, targetPass: string, personaProfile?: PersonaProfile) => {
    setErrorMessage(null);
    setVaultState('verifying');

    if (personaProfile) {
      setAuthenticatingPersonaId(personaProfile.id);
    } else {
      setIsFormSubmitting(true);
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed. Please verify credentials.');
      }

      // Successful authentication
      const user = data.data.user;
      setAuthTargetName(user.name);
      setAuthSuccess(true);
      setVaultState('unlocked');
      playVaultUnlock();

      // Synchronize role context & local storage
      const userRole = (user.role as Role) || (personaProfile?.role ?? 'CLIENT');
      setRole(userRole);
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeRole', userRole);
      }

      // Smooth transition to /dashboard with open-redirect guard
      startTransition(() => {
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const rawRedirect = urlParams.get('redirect');
          const redirectTarget =
            rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
              ? rawRedirect
              : '/dashboard';
          router.push(redirectTarget);
        }, 850);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error communicating with authentication service.';
      setErrorMessage(msg);
      setAuthSuccess(false);
      setVaultState('error');
      playVaultError();

      setTimeout(() => {
        setVaultState('idle');
      }, 2000);
    } finally {
      setAuthenticatingPersonaId(null);
      setIsFormSubmitting(false);
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      setVaultState('error');
      playVaultError();
      return;
    }
    executeLogin(email, password);
  };

  const handlePersonaClick = (persona: PersonaProfile) => {
    playSwitchClick();
    setIsPasswordFocused(false);
    setEmail(persona.email);
    setPassword(persona.password);
    executeLogin(persona.email, persona.password, persona);
  };

  const applyMasterPassword = () => {
    playSwitchClick();
    setPassword('VAIBHAV2667');
    setVaultState('typing');
  };

  return (
    <div className="relative min-h-screen bg-charcoal text-paper selection:bg-brand-base selection:text-charcoal flex flex-col justify-between overflow-x-hidden font-sans transition-colors duration-200">
      {/* Background Subtle Grid & Vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(252,108,0,0.12),transparent_70%)]" />

      {/* Top Header Navigation */}
      <header className="relative z-30 border-b border-line bg-charcoal/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-line flex items-center justify-center p-1 group-hover:border-brand-base transition-colors shadow-sm overflow-hidden">
              <Image
                src="/assets/gigaflow-mark.png"
                alt="GigaFlow Mark"
                width={32}
                height={32}
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(252,108,0,0.3)]"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg tracking-tight text-paper">
                  Giga<span className="text-brand-base">Flow</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-tint border border-brand-base/30 text-brand-base font-bold">
                  ESCROW
                </span>
              </div>
              <p className="text-[10px] font-mono text-paper-muted hidden sm:block">
                High-Assurance Milestone Protocol
              </p>
            </div>
          </Link>
        </div>

        {/* Realtime Telemetry, Audio Controls & ThemeToggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-line text-[11px] font-mono text-paper-muted">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Live
            </span>
            <span className="text-line-strong">•</span>
            <span className="flex items-center gap-1 text-brand-base font-medium">
              <Server className="w-3 h-3 text-brand-base" />
              SQLite Ledger
            </span>
            <span className="text-line-strong">•</span>
            <span className="text-paper-muted">{syncLatency}ms</span>
          </div>

          {/* Procedural Audio Mute Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isAudioEnabled ? 'Mute mechanical vault audio' : 'Unmute mechanical vault audio'}
            className="p-2 rounded-xl bg-surface-elevated border border-line text-paper-muted hover:text-brand-base transition-colors cursor-pointer"
          >
            {isAudioEnabled ? (
              <Volume2 className="w-4 h-4 text-brand-base" />
            ) : (
              <VolumeX className="w-4 h-4 text-paper-faint" />
            )}
          </button>

          {/* Light / Dark Mode Theme Toggle */}
          <ThemeToggle size="sm" />

          <Link
            href="/"
            className="text-xs font-mono text-paper-muted hover:text-paper px-3 py-1.5 rounded-xl border border-transparent hover:border-line transition-all"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Authentication Arena */}
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center w-full">
        {/* Mobile View Toggle */}
        <div className="lg:hidden flex items-center justify-center mb-6">
          <div
            role="tablist"
            className="grid grid-cols-2 p-1 rounded-xl bg-surface-elevated border border-line max-w-xs w-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'credentials'}
              onClick={() => {
                playSwitchClick();
                setActiveTab('credentials');
              }}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                activeTab === 'credentials'
                  ? 'bg-brand-base text-charcoal shadow-md'
                  : 'text-paper-muted hover:text-paper'
              }`}
            >
              Security Terminal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'personas'}
              onClick={() => {
                playSwitchClick();
                setActiveTab('personas');
              }}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                activeTab === 'personas'
                  ? 'bg-brand-base text-charcoal shadow-md'
                  : 'text-paper-muted hover:text-paper'
              }`}
            >
              1-Click Personas
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Interactive Security Terminal & AI Avatar (7 Cols on Desktop) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-6 ${
              activeTab === 'credentials' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="relative rounded-2xl bg-surface border border-line p-6 sm:p-8 shadow-xl dark:shadow-[0_16px_50px_rgba(0,0,0,0.85)] transition-colors">
              {/* Header Title with Status LED */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-base animate-pulse" />
                    <h1 className="font-display font-black text-2xl tracking-tight text-paper">
                      Escrow Security Gateway
                    </h1>
                  </div>
                  <p className="text-xs font-mono text-paper-muted mt-1">
                    Dual Authentication • Supabase Auth &amp; Local SQLite Ledger
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-surface-elevated border border-line text-[11px] font-mono text-brand-base">
                  <KeyRound className="w-3.5 h-3.5 text-brand-base" />
                  <span>SHA-256 HMAC-Ready</span>
                </div>
              </div>

              {/* Mode Switcher: Interactive Monkey Mascot vs Mechanical Vault vs Interactive Coder */}
              <div className="pt-4 pb-2 flex items-center justify-center">
                <div className="inline-flex items-center p-1 rounded-xl bg-surface-elevated border border-line gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSwitchClick();
                      setVisualizerMode('monkey');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      visualizerMode === 'monkey'
                        ? 'bg-brand-base text-charcoal shadow-sm'
                        : 'text-paper-muted hover:text-paper'
                    }`}
                  >
                    <span>🐵</span>
                    <span>Monkey Mascot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSwitchClick();
                      setVisualizerMode('vault');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      visualizerMode === 'vault'
                        ? 'bg-brand-base text-charcoal shadow-sm'
                        : 'text-paper-muted hover:text-paper'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Mechanical Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSwitchClick();
                      setVisualizerMode('coder');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      visualizerMode === 'coder'
                        ? 'bg-brand-base text-charcoal shadow-sm'
                        : 'text-paper-muted hover:text-paper'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Interactive Coder</span>
                  </button>
                </div>
              </div>

              {/* Centerpiece: Interactive Monkey Mascot, Mechanical Escrow Vault, or Coder Avatar */}
              <div className="py-4 flex flex-col items-center justify-center min-h-[260px]">
                {visualizerMode === 'monkey' && (
                  <InteractiveMonkeyAvatar
                    emailValue={email}
                    emailInputRef={emailInputRef}
                    isEmailFocused={isEmailFocused}
                    isPasswordFocused={isPasswordFocused}
                    isShowPassword={showPassword}
                    size={220}
                  />
                )}

                {visualizerMode === 'vault' && (
                  <MechanicalEscrowVault
                    state={vaultState}
                    hashPreview={hashPreview}
                    progress={entropy}
                  />
                )}

                {visualizerMode === 'coder' && (
                  <AiAvatarSecurityAgent
                    state={avatarState}
                    variant="coder"
                    size={220}
                    caption={
                      avatarState === 'working'
                        ? '🧑‍💻 Security Sentinel: Typing credentials on console...'
                        : avatarState === 'thinking'
                        ? '🧠 Security Sentinel: Cryptographic signature verification...'
                        : avatarState === 'speaking'
                        ? '🎉 Security Sentinel: Access cleared! Routing to dashboard...'
                        : avatarState === 'listening'
                        ? '👂 Security Sentinel: Ready for authentication input'
                        : '⚡ Security Sentinel: Monitoring institutional session channel'
                    }
                  />
                )}
              </div>

              {/* Error Message Toast */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-mono flex items-start gap-2.5 animate-shake"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AUTHENTICATION REJECTED: </span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Success Toast */}
              {authSuccess && (
                <div
                  role="status"
                  className="mb-5 p-3.5 rounded-xl bg-brand-tint border border-brand-base/40 text-brand-base text-xs font-mono flex items-center gap-2.5 animate-fadeIn"
                >
                  <CheckCircle2 className="w-4 h-4 text-brand-base shrink-0" />
                  <div>
                    <span className="font-bold">ACCESS GRANTED: </span>
                    Welcome, <span className="text-paper font-bold">{authTargetName}</span>. Entering dashboard...
                  </div>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-mono uppercase tracking-wider text-paper-muted mb-1.5 font-semibold"
                  >
                    Identity Identifier / Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-muted" />
                    <input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      required
                      value={email}
                      onFocus={() => {
                        setIsEmailFocused(true);
                        setIsPasswordFocused(false);
                        if (vaultState === 'idle') setVaultState('typing');
                      }}
                      onBlur={() => {
                        setIsEmailFocused(false);
                      }}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="client1@escrow.local or admin@escrow.local"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-line focus:border-brand-base focus:ring-1 focus:ring-brand-base rounded-xl text-sm font-mono text-paper placeholder:text-paper-faint outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-mono uppercase tracking-wider text-paper-muted font-semibold"
                    >
                      Cryptographic Secret / Password
                    </label>
                    <button
                      type="button"
                      onClick={applyMasterPassword}
                      className="text-[11px] font-mono text-brand-base hover:text-brand-light hover:underline cursor-pointer font-medium"
                    >
                      Fill Master Key (VAIBHAV2667)
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-muted" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onFocus={() => {
                        setIsPasswordFocused(true);
                        if (vaultState === 'idle') setVaultState('typing');
                      }}
                      onBlur={() => {
                        setIsPasswordFocused(false);
                      }}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Password123! or VAIBHAV2667"
                      className="w-full pl-10 pr-10 py-2.5 bg-surface-elevated border border-line focus:border-brand-base focus:ring-1 focus:ring-brand-base rounded-xl text-sm font-mono text-paper placeholder:text-paper-faint outline-none transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onMouseDown={(e) => {
                        // Prevent loss of focus on password input so arms stay covering eyes during peek
                        e.preventDefault();
                      }}
                      onClick={() => {
                        playSwitchClick();
                        setShowPassword(!showPassword);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-paper-muted hover:text-paper transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isFormSubmitting || authSuccess}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-mono font-bold text-sm bg-brand-base hover:bg-brand-light text-charcoal shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isFormSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : authSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-charcoal" />
                      <span>Authentication Verified</span>
                    </>
                  ) : (
                    <>
                      <span>Engage Gateway &amp; Authenticate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Master Credential Footnote */}
              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between text-[11px] font-mono text-paper-muted">
                <span>
                  Demo Passwords: <code className="text-brand-base font-bold">Password123!</code> or{' '}
                  <code className="text-brand-base font-bold">VAIBHAV2667</code>
                </span>
                <span className="hidden sm:inline text-paper-faint">Universal Dual-Auth Ready</span>
              </div>
            </div>
          </div>

          {/* Column 2: 1-Click Persona Cards (5 Cols on Desktop) */}
          <div
            className={`lg:col-span-5 flex flex-col gap-4 ${
              activeTab === 'personas' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-display font-bold text-lg text-paper">
                  1-Click Role Profiles
                </h2>
                <p className="text-xs font-mono text-paper-muted">
                  Select an identity to immediately test RBAC workflows
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-line text-paper-muted font-bold">
                4 Roles
              </span>
            </div>

            <div className="space-y-3">
              {PERSONA_PROFILES.map((persona) => {
                const IconComponent = persona.icon;
                const isLoggingIn = authenticatingPersonaId === persona.id;

                return (
                  <div
                    key={persona.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Authenticate as ${persona.name}, ${persona.title}`}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !authenticatingPersonaId) {
                        e.preventDefault();
                        handlePersonaClick(persona);
                      }
                    }}
                    onClick={() => !authenticatingPersonaId && handlePersonaClick(persona)}
                    className={`group relative rounded-xl bg-surface border border-line p-4 transition-all duration-200 cursor-pointer hover:border-brand-base/60 hover:bg-surface-elevated shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-brand-base ${
                      isLoggingIn ? 'border-brand-base ring-1 ring-brand-base' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-line flex items-center justify-center group-hover:border-brand-base transition-colors">
                          <IconComponent className="w-4 h-4 text-brand-base" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-sm text-paper group-hover:text-brand-base transition-colors">
                              {persona.name}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-brand-tint border border-brand-base/30 text-brand-base">
                              {persona.role}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-paper-muted">{persona.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-paper-muted leading-relaxed mb-3 line-clamp-2">
                      {persona.description}
                    </p>

                    {/* Footer with Balance / Authority & Action */}
                    <div className="pt-2.5 border-t border-line flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-paper-faint block">
                          {persona.role === 'CLIENT' || persona.role === 'FREELANCER'
                            ? 'Ledger Balance'
                            : 'Authority'}
                        </span>
                        <span className="font-bold text-brand-base">
                          {persona.balanceFormatted}
                        </span>
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                          isLoggingIn
                            ? 'bg-brand-base text-charcoal border-brand-base'
                            : 'bg-surface-elevated text-paper border-line group-hover:border-brand-base group-hover:text-brand-base'
                        }`}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Unlocking</span>
                          </>
                        ) : (
                          <>
                            <span>1-Click Enter</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Guarantee Box */}
            <div className="mt-2 p-4 rounded-xl bg-surface-elevated border border-line text-xs font-mono text-paper-muted space-y-1.5">
              <div className="flex items-center gap-1.5 text-paper font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-base" />
                <span>Zero Bypass Architecture</span>
              </div>
              <p className="text-[11px] leading-relaxed text-paper-muted">
                Every session is signed with HMAC-SHA256 and verified at Edge middleware. Direct deep links to protected routes (`/dashboard`, `/contracts`, `/disputes`) require cryptographic cookies.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="relative z-30 border-t border-line bg-charcoal/85 px-4 sm:px-8 py-3 text-center text-xs font-mono text-paper-muted flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors">
        <div>
          © 2026 GigaFlow Protocol • High-Assurance Escrow
        </div>
        <div className="flex items-center gap-3">
          <span>Engine 04 Web Terminal</span>
          <span>•</span>
          <span className="text-brand-base font-semibold">Multi-Engine RBAC</span>
        </div>
      </footer>
    </div>
  );
}
