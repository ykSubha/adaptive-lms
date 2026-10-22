'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { BookOpen, Shield, GraduationCap, School, UserCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

const SEED_ACCOUNTS = [
  {
    email: 'student@alpha.test',
    role: 'student',
    roleLabel: 'Student (Alpha)',
    tenant: 'Alpha Academy',
    desc: 'Enrolled in Computer Science Core (DSA, ML & DS); adaptive quiz & heatmap',
    icon: GraduationCap,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    email: 'student@beta.test',
    role: 'student',
    roleLabel: 'Student (Beta)',
    tenant: 'Beta Institute',
    desc: 'Enrolled in Intro to Python; strictly isolated from Alpha tenant courses',
    icon: GraduationCap,
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  {
    email: 'instructor@alpha.test',
    role: 'instructor',
    roleLabel: 'Instructor (Alpha)',
    tenant: 'Alpha Academy',
    desc: 'Teaches CS Core; Class Topic Pulse analytics & Proctoring Flag Review',
    icon: School,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    email: 'admin@alpha.test',
    role: 'tenant_admin',
    roleLabel: 'Tenant Admin (Alpha)',
    tenant: 'Alpha Academy',
    desc: 'Manages Alpha tenant users & courses; isolated from Beta tenant',
    icon: UserCheck,
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    email: 'super@demo.test',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    tenant: 'Platform Root',
    desc: 'Manages platform tenants; strictly prohibited from seeing student/course data',
    icon: Shield,
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, switchSeedAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

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
    setLoading(true);
    setError(null);
    await switchSeedAccount(seedEmail);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-xs">
          <BookOpen className="h-7 w-7" />
        </div>
        <h2 className="mt-3.5 text-2xl font-extrabold text-slate-900 tracking-tight">
          Adaptive Learning Portal
        </h2>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          Multi-Tenant Academic Management with Adaptive Diagnostic Assessments
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@alpha.test"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs shadow-2xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (optional in seed demo mode)"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs shadow-2xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition shadow-xs"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-7">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                  One-Click Test Account Access
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {SEED_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSeed(acc.email)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{acc.email}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${acc.badgeColor}`}>
                            {acc.roleLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{acc.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>
            <Lock className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
            Row-Level Security (RLS) active across all tenants and roles.
          </p>
        </div>
      </div>
    </div>
  );
}
