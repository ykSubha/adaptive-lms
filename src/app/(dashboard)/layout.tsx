'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login');
      return;
    }

    if (!loading && profile) {
      // Role guards
      if (pathname.startsWith('/student') && profile.role !== 'student') {
        router.push(getRoleHome(profile.role));
      } else if (pathname.startsWith('/instructor') && profile.role !== 'instructor') {
        router.push(getRoleHome(profile.role));
      } else if (pathname.startsWith('/admin') && profile.role !== 'tenant_admin') {
        router.push(getRoleHome(profile.role));
      } else if (pathname.startsWith('/platform') && profile.role !== 'super_admin') {
        router.push(getRoleHome(profile.role));
      }
    }
  }, [profile, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-sm text-slate-500 font-medium">Validating session & tenant credentials...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function getRoleHome(role: string): string {
  switch (role) {
    case 'instructor':
      return '/instructor';
    case 'tenant_admin':
      return '/admin';
    case 'super_admin':
      return '/platform';
    case 'student':
    default:
      return '/student';
  }
}
