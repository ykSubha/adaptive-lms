'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  ClipboardList,
  Compass,
  Brain,
  Layers,
  Award,
  Bell,
} from 'lucide-react';

function NavLinksList({ role }: { role: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getDefaultTab = () => {
    if (role === 'student') return 'dashboard';
    return 'dash';
  };

  const currentTab = searchParams ? searchParams.get('tab') || getDefaultTab() : getDefaultTab();

  const getNavLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'Dashboard', href: '/student?tab=dashboard', tabKey: 'dashboard', icon: LayoutDashboard },
          { name: 'Assessments', href: '/student?tab=assessments', tabKey: 'assessments', icon: ClipboardList },
          { name: 'Learning Path', href: '/student?tab=path', tabKey: 'path', icon: Compass },
          { name: 'Recommendations', href: '/student?tab=recommendations', tabKey: 'recommendations', icon: Brain },
          { name: 'Remediation', href: '/student?tab=remediation', tabKey: 'remediation', icon: Layers },
          { name: 'My Progress', href: '/student?tab=progress', tabKey: 'progress', icon: BarChart3 },
          { name: 'Notifications', href: '/student?tab=notifications', tabKey: 'notifications', icon: Bell },
        ];
      case 'instructor':
        return [
          { name: 'Faculty Dashboard', href: '/instructor?tab=dash', tabKey: 'dash', icon: School },
          { name: 'Assigned Courses', href: '/instructor?tab=courses', tabKey: 'courses', icon: BookOpen },
          { name: 'Cohort Topic Pulse', href: '/instructor?tab=pulse', tabKey: 'pulse', icon: BarChart3 },
          { name: 'Proctoring Review', href: '/instructor?tab=proctoring', tabKey: 'proctoring', icon: Shield },
        ];
      case 'tenant_admin':
        return [
          { name: 'Administration Hub', href: '/admin?tab=dash', tabKey: 'dash', icon: UserCheck },
          { name: 'Department Modules', href: '/admin?tab=courses', tabKey: 'courses', icon: BookOpen },
          { name: 'Department Roster', href: '/admin?tab=users', tabKey: 'users', icon: GraduationCap },
        ];
      case 'super_admin':
        return [
          { name: 'Multi-Tenant Governance', href: '/platform?tab=dash', tabKey: 'dash', icon: Shield },
          { name: 'Provisioned Entities', href: '/platform?tab=tenants', tabKey: 'tenants', icon: Building2 },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <div className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const targetPath = link.href.split('?')[0];
        const isActive = pathname === targetPath && currentTab === link.tabKey;

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
    </div>
  );
}

export default function Sidebar() {
  const { profile, tenant, signOut } = useAuth();
  const role = profile?.role || 'student';

  const roleLabelMap: Record<string, string> = {
    student: 'Student',
    instructor: 'Instructor',
    tenant_admin: 'Department Admin',
    super_admin: 'Platform Admin',
  };

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 border-r border-[#e2ede3]">
      {/* User Profile Card Header (Matching User Uploaded Design) */}
      <div className="p-4 border-b border-[#e2ede3] bg-[#f8faf8] flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#edf4ee] text-[#2e5a44] font-bold text-sm flex items-center justify-center border border-[#dbe7dc] shrink-0 shadow-2xs">
          {profile?.full_name?.charAt(0) || 'A'}
        </div>
        <div className="overflow-hidden flex-1">
          <div className="text-sm font-bold text-slate-900 truncate">
            {profile?.full_name || 'Academic Candidate'}
          </div>
          <div className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-semibold bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
            {roleLabelMap[role] || 'Student'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs text-slate-400">Loading navigation...</div>}>
          <NavLinksList role={role} />
        </Suspense>
      </nav>

      {/* Institutional Entity & Sign Out Footer */}
      <div className="p-3.5 border-t border-[#e2ede3] bg-[#f8faf8] space-y-2.5">
        <div className="px-1 flex items-center gap-2 text-xs text-slate-600 truncate">
          <Building2 className="h-3.5 w-3.5 text-[#2e5a44] shrink-0" />
          <span className="truncate font-medium">{tenant?.name || 'School of Computing'}</span>
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
