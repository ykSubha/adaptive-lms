'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Building2, ChevronDown, Check, Sparkles, ShieldCheck } from 'lucide-react';
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
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'instructor':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'tenant_admin':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'super_admin':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Institution / Tenant Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200">
          <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-700" />
          <span>{tenant?.name || (role === 'super_admin' ? 'Platform Root (Global)' : 'Tenant Portal')}</span>
        </div>
        <div className="hidden lg:flex items-center text-[11px] text-slate-500 gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>RLS Enforced: Isolated Tenant Partition</span>
        </div>
      </div>

      {/* Right: Quick Role Switcher & User Badge */}
      <div className="flex items-center space-x-3">
        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
            title="Switch demo seed role"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-700" />
            <span className="hidden sm:inline">Role Switcher</span>
            <ChevronDown className="h-3 w-3 ml-0.5 text-blue-700" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Active Account
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
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
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

        {/* User Badge */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">{profile?.full_name || 'User'}</div>
            <div className="text-[11px] text-slate-500">{profile?.email}</div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(role)} uppercase tracking-wider`}>
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
}
