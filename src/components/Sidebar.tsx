'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  BookOpen,
  GraduationCap,
  School,
  UserCheck,
  Shield,
  BarChart3,
  LogOut,
  Building2,
  ListTodo,
  Cpu,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, tenant, signOut } = useAuth();
  const role = profile?.role || 'student';

  const getNavLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'My Courses & Heatmap', href: '/student', icon: GraduationCap },
        ];
      case 'instructor':
        return [
          { name: 'Instructor Dashboard', href: '/instructor', icon: School },
          { name: 'Class Topic Pulse', href: '/instructor#pulse', icon: BarChart3 },
          { name: 'Proctoring Flags', href: '/instructor#proctoring', icon: Shield },
        ];
      case 'tenant_admin':
        return [
          { name: 'Tenant Admin Hub', href: '/admin', icon: UserCheck },
          { name: 'Manage Courses', href: '/admin#courses', icon: BookOpen },
          { name: 'Manage Users', href: '/admin#users', icon: ListTodo },
        ];
      case 'super_admin':
        return [
          { name: 'Platform Tenants', href: '/platform', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const getRoleAccent = () => {
    switch (role) {
      case 'student': return { dot: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' };
      case 'instructor': return { dot: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/30' };
      case 'tenant_admin': return { dot: 'bg-violet-500', text: 'text-violet-400', ring: 'ring-violet-500/30' };
      case 'super_admin': return { dot: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/30' };
      default: return { dot: 'bg-slate-500', text: 'text-slate-400', ring: 'ring-slate-500/30' };
    }
  };

  const links = getNavLinks();
  const accent = getRoleAccent();
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="w-64 flex flex-col shrink-0 border-r border-slate-800/60 relative"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1120 100%)' }}>

      {/* Subtle top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center border-b border-slate-800/60 gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shrink-0 shadow-lg shadow-indigo-900/40">
          <Cpu className="h-5 w-5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-white tracking-tight truncate">Adaptive LMS</div>
          <div className={`text-[11px] font-medium flex items-center gap-1 truncate ${accent.text}`}>
            <Building2 className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{tenant?.name || (role === 'super_admin' ? 'Platform Root' : 'Default Tenant')}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">
          {role.replace('_', ' ')} workspace
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/student' && pathname.startsWith(link.href.split('#')[0]));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
              )}
              <div className={`p-1.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 truncate">{link.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom gradient separator */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* User Info & Logout */}
      <div className="p-4 pt-3">
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 ring-1 ${accent.ring} mb-3`}>
          {/* Avatar */}
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm`}>
            {initials}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-semibold text-white truncate leading-tight">{profile?.full_name || 'Loading...'}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${accent.dot} animate-pulse`} />
              <div className={`text-[10px] font-medium uppercase tracking-wider truncate ${accent.text}`}>
                {role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all border border-transparent hover:border-rose-900/40"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </aside>
  );
}
