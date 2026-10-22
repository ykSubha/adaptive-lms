'use client';

import React from 'react';
import { useAuth } from '@/lib/authContext';
import { Building2, ShieldCheck, LogOut } from 'lucide-react';

export default function TopNav() {
  const { profile, tenant, signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#e2ede3] px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Institutional Entity / Tenant */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f4f7f4] text-[#254d37] border border-[#dbe7dc]">
          <Building2 className="h-3.5 w-3.5 mr-1.5 text-[#2e5a44]" />
          <span>{tenant?.name || 'Faculty of Engineering & Technology'}</span>
        </div>
      </div>

      {/* Right: User Information & Explicit Sign Out */}
      <div className="flex items-center space-x-4">
        {profile && (
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">{profile.full_name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{profile.email}</div>
          </div>
        )}

        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-rose-700 bg-[#f4f7f4] hover:bg-rose-50 border border-[#dbe7dc] hover:border-rose-200 transition"
          title="Sign out of current account"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
