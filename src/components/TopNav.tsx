'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Building2, Check, Sparkles, ChevronDown, X, Users, Shield, School, GraduationCap, UserCheck } from 'lucide-react';
import { UserRole } from '@/lib/types';

const SEED_SWITCHER_OPTIONS: { email: string; label: string; role: UserRole; tenant: string; icon: typeof GraduationCap; color: string }[] = [
  { email: 'student@alpha.test', label: 'Alice (Student)', role: 'student', tenant: 'Alpha Academy', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
  { email: 'student@beta.test', label: 'Bob (Student)', role: 'student', tenant: 'Beta Institute', icon: GraduationCap, color: 'text-teal-600 bg-teal-50' },
  { email: 'instructor@alpha.test', label: 'Dr. Stone (Instructor)', role: 'instructor', tenant: 'Alpha Academy', icon: School, color: 'text-blue-600 bg-blue-50' },
  { email: 'admin@alpha.test', label: 'Arthur (Tenant Admin)', role: 'tenant_admin', tenant: 'Alpha Academy', icon: UserCheck, color: 'text-violet-600 bg-violet-50' },
  { email: 'super@demo.test', label: 'Sam (Super Admin)', role: 'super_admin', tenant: 'Platform Root', icon: Shield, color: 'text-rose-600 bg-rose-50' },
];

export default function TopNav() {
  const { profile, tenant, switchSeedAccount } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const role = profile?.role || 'student';

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'student': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'instructor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tenant_admin': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'super_admin': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRoleDot = (r: string) => {
    switch (r) {
      case 'student': return 'bg-emerald-500';
      case 'instructor': return 'bg-blue-500';
      case 'tenant_admin': return 'bg-violet-500';
      case 'super_admin': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className="h-14 bg-white/95 border-b border-slate-200 px-5 flex items-center justify-between z-30 shrink-0 backdrop-blur-sm"
      style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.04)' }}>

      {/* Left: Tenant indicator */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>{tenant?.name || (role === 'super_admin' ? 'Platform Root' : 'Tenant')}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <div className="h-1 w-1 rounded-full bg-slate-300" />
          <span>RLS Policy:</span>
          <span className="text-emerald-600 font-semibold">Active</span>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Right: Switcher + User */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="relative">
          <button
            id="role-switcher-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition group"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden md:inline">Role Switcher</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Switch Demo Account</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Test role-based isolation</div>
                  </div>
                  <button onClick={() => setDropdownOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-2 space-y-0.5">
                  {SEED_SWITCHER_OPTIONS.map((opt) => {
                    const isCurrent = profile?.email?.toLowerCase() === opt.email.toLowerCase();
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.email}
                        onClick={async () => {
                          setSwitching(true);
                          setDropdownOpen(false);
                          await switchSeedAccount(opt.email);
                          setSwitching(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-3 rounded-xl transition-all ${
                          isCurrent ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${opt.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="truncate">{opt.label}</span>
                            {isCurrent && <Check className="h-3 w-3 text-indigo-600 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{opt.email} · {opt.tenant}</div>
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User chip */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-slate-900 leading-tight">{profile?.full_name || 'User'}</div>
            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{profile?.email}</div>
          </div>
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${getRoleDot(role)}`} />
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider hidden sm:inline-flex ${getRoleBadgeStyle(role)}`}>
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
}
