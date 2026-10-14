'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function RootPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push('/login');
      } else {
        const routes: Record<string, string> = {
          student: '/student',
          instructor: '/instructor',
          tenant_admin: '/admin',
          super_admin: '/platform',
        };
        router.push(routes[profile.role] || '/student');
      }
    }
  }, [profile, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}
