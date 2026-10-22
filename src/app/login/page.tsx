'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { BookOpen, ArrowRight, Lock, KeyRound, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your institutional email address.');
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

  const fillCredential = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo-session-key');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2e5a44] text-white shadow-xs">
          <BookOpen className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Academic Portal
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Institutional Curriculum Management & Examination Platform
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#dbe7dc] rounded-2xl sm:px-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Failed:</span> {error}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Institutional Email
              </label>
              <div className="relative rounded-xl border border-slate-200 focus-within:border-[#2e5a44] focus-within:ring-1 focus-within:ring-[#2e5a44]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@bitsathy.ac.in"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 bg-transparent rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password / Access Key
              </label>
              <div className="relative rounded-xl border border-slate-200 focus-within:border-[#2e5a44] focus-within:ring-1 focus-within:ring-[#2e5a44]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 bg-transparent rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#2e5a44] hover:bg-[#254937] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e5a44] disabled:opacity-50 transition shadow-xs mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </button>
          </form>

          {/* Clean Institutional Account Reference */}
          <div className="mt-6 pt-5 border-t border-[#eaf0eb]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Institutional User Directory
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { email: 'student@bitsathy.ac.in', label: 'Student' },
                { email: 'faculty@bitsathy.ac.in', label: 'Faculty' },
                { email: 'admin@bitsathy.ac.in', label: 'Admin' },
                { email: 'superadmin@platform.gov', label: 'Platform Root' },
              ].map(item => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => fillCredential(item.email)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#f4f7f4] hover:bg-[#e4efe5] text-[#254d37] border border-[#dbe7dc] transition"
                  title={`Click to fill ${item.email}`}
                >
                  {item.email}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-slate-500">
          <p className="flex items-center justify-center gap-1">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Strict Row-Level Security Enforced</span>
          </p>
        </div>
      </div>
    </div>
  );
}
