'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  BookOpen, Shield, GraduationCap, School, UserCheck,
  ArrowRight, Lock, Sparkles, Brain, Zap, ChevronRight
} from 'lucide-react';

const SEED_ACCOUNTS = [
  {
    email: 'student@alpha.test',
    role: 'student',
    roleLabel: 'Student',
    tenant: 'Alpha Academy',
    desc: 'Adaptive quiz, heatmap & trust scoring',
    icon: GraduationCap,
    gradient: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  {
    email: 'student@beta.test',
    role: 'student',
    roleLabel: 'Student',
    tenant: 'Beta Institute',
    desc: 'Isolated tenant — Intro to Python course',
    icon: GraduationCap,
    gradient: 'from-teal-500 to-cyan-600',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    dot: 'bg-teal-500',
  },
  {
    email: 'instructor@alpha.test',
    role: 'instructor',
    roleLabel: 'Instructor',
    tenant: 'Alpha Academy',
    desc: 'Class pulse analytics & proctoring review',
    icon: School,
    gradient: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    email: 'admin@alpha.test',
    role: 'tenant_admin',
    roleLabel: 'Tenant Admin',
    tenant: 'Alpha Academy',
    desc: 'Manage users & courses in your tenant',
    icon: UserCheck,
    gradient: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
  },
  {
    email: 'super@demo.test',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    tenant: 'Platform Root',
    desc: 'Global tenant provisioning — zero data access',
    icon: Shield,
    gradient: 'from-rose-500 to-pink-600',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, switchSeedAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError(null);
    const res = await signIn(email, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    const role = res.role || 'student';
    const redirectMap: Record<string, string> = {
      student: '/student',
      instructor: '/instructor',
      tenant_admin: '/admin',
      super_admin: '/platform',
    };
    router.push(redirectMap[role] || '/student');
  };

  const handleQuickSeed = async (seedEmail: string) => {
    setLoadingEmail(seedEmail);
    setError(null);
    await switchSeedAccount(seedEmail);
    setLoadingEmail(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute top-3/4 left-1/2 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-lg px-4 py-12 animate-fade-in-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50 mb-4 animate-float">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Adaptive Tenant LMS
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Multi-tenant learning with real-time cognitive trust scoring
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
              <Brain className="h-3 w-3 text-indigo-400" />
              Adaptive EMA Engine
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
              <Shield className="h-3 w-3 text-emerald-400" />
              Row-Level Security
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
              <Zap className="h-3 w-3 text-amber-400" />
              Real-time Proctoring
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
          {/* Login Form */}
          <div className="p-6 border-b border-slate-200/20">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300 flex items-start space-x-2 animate-scale-in">
                <span className="font-semibold shrink-0">Error:</span>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@alpha.test"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for demo seed login"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white transition"
                />
              </div>
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition shadow-sm shadow-indigo-900/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Quick Seed Logins */}
          <div className="p-6 bg-slate-50/80">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">One-Click Demo Logins</span>
            </div>
            <div className="space-y-2 stagger-children">
              {SEED_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isLoading = loadingEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    id={`seed-${acc.role}`}
                    type="button"
                    onClick={() => handleQuickSeed(acc.email)}
                    disabled={!!loadingEmail}
                    className="animate-fade-in-up w-full text-left px-3.5 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-white bg-white/60 transition-all group flex items-center justify-between shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${acc.gradient} text-white shadow-sm`}>
                        {isLoading ? (
                          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{acc.email}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${acc.badgeColor}`}>
                            {acc.roleLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${acc.dot}`} />
                          {acc.tenant} — {acc.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Strict Row-Level Security enforced per tenant & role
          </p>
          <p>EMA trust score engine · Client-side proctoring · No paid AI APIs</p>
        </div>
      </div>
    </div>
  );
}
