'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Building2, User, ChevronDown, Check, Sparkles } from 'lucide-react';
import { UserRole } from '@/lib/types';

const SEED_SWITCHER_OPTIONS: { email: string; label: string; role: UserRole; tenant: string }[] = [
  { email: 'student@alpha.test', label: 'Alice (Student)', role: 'student', tenant: 'Alpha Academy' },
  { email: 'student@beta.test', label: 'Bob (Student)', role: 'student', tenant: 'Beta Institute' },
  { email: 'instructor@alpha.test', label: 'Dr. Stone (Instructor)', role: 'instructor', tenant: 'Alpha Academy' },
  { email: 'admin@alpha.test', label: 'Arthur (Tenant Admin)', role: 'tenant_admin', tenant: 'Alpha Academy' },
  { email: 'super@demo.test', label: 'Sam (Super Admin)', role: 'super_admin', tenant: 'Platform Root' },
];

export default function TopNav() {
  const { profile, tenant, switchSeedAccount } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const role = profile?.role || 'student';

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'student':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'instructor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'tenant_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'super_admin':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Tenant Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
          <span>Tenant: {tenant?.name || (role === 'super_admin' ? 'Platform Root (Global)' : 'Tenant')}</span>
        </div>
        <span className="text-xs text-slate-400">|</span>
        <span className="text-xs text-slate-500 hidden sm:inline">RLS Policy: <span className="text-emerald-600 font-medium">Strict Multi-Tenant</span></span>
      </div>

      {/* Right: User Profile, Role Badge & Quick Switcher */}
      <div className="flex items-center space-x-4">
        {/* Quick Seed Switcher dropdown for quick testing */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition"
            title="Switch seed account to test role isolation"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden md:inline">Test Role Switcher</span>
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Test Account
              </div>
              {SEED_SWITCHER_OPTIONS.map((opt) => {
                const isCurrent = profile?.email.toLowerCase() === opt.email.toLowerCase();
                return (
                  <button
                    key={opt.email}
                    onClick={async () => {
                      setDropdownOpen(false);
                      await switchSeedAccount(opt.email);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        {opt.label}
                        {isCurrent && <Check className="h-3 w-3 text-emerald-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500">{opt.email} • {opt.tenant}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-900 leading-tight">{profile?.full_name || 'User'}</div>
            <div className="text-xs text-slate-500">{profile?.email}</div>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getRoleBadge(role)} uppercase tracking-wider`}>
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
}
