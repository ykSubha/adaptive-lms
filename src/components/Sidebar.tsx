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
  ListTodo
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

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand & Tenant Header */}
      <div className="h-16 px-6 flex items-center border-b border-slate-800 gap-3">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-white truncate">Adaptive LMS</div>
          <div className="text-xs text-indigo-400 font-medium flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{tenant?.name || (role === 'super_admin' ? 'Platform Root' : 'Default Tenant')}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          {role.replace('_', ' ')} workspace
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-white truncate">{profile?.full_name || 'Loading...'}</div>
            <div className="text-xs text-slate-400 truncate">{profile?.email}</div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
