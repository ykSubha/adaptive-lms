'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  GraduationCap,
  School,
  UserCheck,
  Shield,
  BarChart3,
  LogOut,
  Building2,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, tenant, signOut } = useAuth();
  const role = profile?.role || 'student';

  const getNavLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'Curriculum & Mastery', href: '/student', icon: LayoutDashboard },
        ];
      case 'instructor':
        return [
          { name: 'Courses & Evaluation', href: '/instructor', icon: School },
          { name: 'Topic Mastery Pulse', href: '/instructor#pulse', icon: BarChart3 },
          { name: 'Proctoring Review', href: '/instructor#proctoring', icon: Shield },
        ];
      case 'tenant_admin':
        return [
          { name: 'Institutional Overview', href: '/admin', icon: UserCheck },
          { name: 'Course Directory', href: '/admin#courses', icon: BookOpen },
          { name: 'User Directory', href: '/admin#users', icon: GraduationCap },
        ];
      case 'super_admin':
        return [
          { name: 'Tenants Infrastructure', href: '/platform', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 border-r border-[#e2ede3]">
      {/* Enterprise Institutional Header */}
      <div className="h-16 px-5 flex items-center border-b border-[#e2ede3] gap-3 bg-white">
        <div className="h-9 w-9 rounded-lg bg-[#2e5a44] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-900 tracking-tight uppercase">
            Academic Portal
          </div>
          <div className="text-[11px] text-[#2e5a44] font-medium flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{tenant?.name || 'Engineering Faculty'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Academic Workspace
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-[#edf4ee] text-[#254d37] border border-[#c8dec9] shadow-2xs'
                  : 'text-slate-600 hover:bg-[#f4f7f4] hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#254d37]' : 'text-slate-400'}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3.5 border-t border-[#e2ede3] bg-[#f7faf7]">
        <div className="flex items-center gap-2.5 mb-2.5 px-1">
          <div className="h-8 w-8 rounded-lg bg-[#e2ede4] text-[#254d37] flex items-center justify-center font-bold text-xs border border-[#c8dec9]">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">{profile?.full_name || 'User'}</div>
            <div className="text-[11px] text-slate-500 truncate font-mono">{profile?.email}</div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-[#dbe7dc] bg-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
