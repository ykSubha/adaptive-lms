'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { BookOpen, Shield, GraduationCap, School, UserCheck, ArrowRight, Lock } from 'lucide-react';

const SEED_ACCOUNTS = [
  {
    email: 'student@alpha.test',
    role: 'student',
    roleLabel: 'Student (Alpha)',
    tenant: 'Alpha Academy',
    desc: 'Enrolled in Data Structures; cognitive profile heatmap & adaptive quiz',
    icon: GraduationCap,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    email: 'student@beta.test',
    role: 'student',
    roleLabel: 'Student (Beta)',
    tenant: 'Beta Institute',
    desc: 'Enrolled in Intro to Python; isolated from Alpha Academy courses',
    icon: GraduationCap,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  {
    email: 'instructor@alpha.test',
    role: 'instructor',
    roleLabel: 'Instructor (Alpha)',
    tenant: 'Alpha Academy',
    desc: 'Teaches Data Structures; Class Pulse chart & Proctoring Flag Review',
    icon: School,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    email: 'admin@alpha.test',
    role: 'tenant_admin',
    roleLabel: 'Tenant Admin (Alpha)',
    tenant: 'Alpha Academy',
    desc: 'Manages Alpha users & courses; isolated from Beta tenant',
    icon: UserCheck,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    email: 'super@demo.test',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    tenant: 'Platform Root',
    desc: 'Manages tenants; strictly blocked from viewing student/course data',
    icon: Shield,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          Adaptive Tenant LMS
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Multi-tenant learning with adaptive trust scoring & proctoring
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm ring-1 ring-slate-900/5 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start space-x-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@alpha.test"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (or leave empty for seed demo)"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium tracking-wider">
                  Or One-Click Test Seed Logins
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {SEED_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSeed(acc.email)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-900">{acc.email}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${acc.badgeColor}`}>
                            {acc.roleLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{acc.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>
            <Lock className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
            Row-Level Security (RLS) is enforced for every tenant and role.
          </p>
          <p>Trust score computed with Exponential Moving Average (EMA).</p>
        </div>
      </div>
    </div>
  );
}
