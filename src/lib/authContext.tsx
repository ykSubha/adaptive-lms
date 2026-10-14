'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from './supabase/client';
import { Profile, Tenant, UserRole } from './types';
import { INITIAL_PROFILES, INITIAL_TENANTS } from './mockData';

interface AuthContextType {
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string; role?: UserRole }>;
  signOut: () => Promise<void>;
  switchSeedAccount: (email: string) => Promise<UserRole>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  tenant: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  switchSeedAccount: async () => 'student',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to resolve profile from cookie or local state
  const loadUser = async () => {
    setLoading(true);
    const supabase = createClient();
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
            if (profileData.tenant_id) {
              const { data: tenantData } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', profileData.tenant_id)
                .single();
              setTenant(tenantData || null);
            } else {
              setTenant(null);
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Live Supabase auth check failed, falling back to local session', e);
      }
    }

    // Check demo cookie / localStorage
    const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('adaptive_lms_demo_user') : null;
    const activeEmail = savedEmail || 'student@alpha.test';
    const foundProfile = INITIAL_PROFILES.find(p => p.email.toLowerCase() === activeEmail.toLowerCase()) || INITIAL_PROFILES[0];
    const foundTenant = foundProfile.tenant_id ? INITIAL_TENANTS.find(t => t.id === foundProfile.tenant_id) || null : null;

    setProfile(foundProfile);
    setTenant(foundTenant);
    if (typeof document !== 'undefined') {
      document.cookie = `demo_user_email=${foundProfile.email}; path=/; max-age=604800`;
      document.cookie = `demo_user_role=${foundProfile.role}; path=/; max-age=604800`;
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signIn = async (email: string, password?: string): Promise<{ error?: string; role?: UserRole }> => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    const supabase = createClient();

    if (isLive && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        const { data: profileData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profError || !profileData) {
          setLoading(false);
          return { error: 'Profile not found for this user.' };
        }

        setProfile(profileData);
        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .single();
          setTenant(tenantData || null);
        } else {
          setTenant(null);
        }

        document.cookie = `demo_user_email=${profileData.email}; path=/; max-age=604800`;
        document.cookie = `demo_user_role=${profileData.role}; path=/; max-age=604800`;
        setLoading(false);
        return { role: profileData.role };
      }
    }

    // Local / Demo seed sign in
    const match = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (match) {
      setProfile(match);
      const matchTenant = match.tenant_id ? INITIAL_TENANTS.find(t => t.id === match.tenant_id) || null : null;
      setTenant(matchTenant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('adaptive_lms_demo_user', match.email);
        document.cookie = `demo_user_email=${match.email}; path=/; max-age=604800`;
        document.cookie = `demo_user_role=${match.role}; path=/; max-age=604800`;
      }
      setLoading(false);
      return { role: match.role };
    }

    setLoading(false);
    return { error: 'User email not found in seed profiles.' };
  };

  const switchSeedAccount = async (email: string): Promise<UserRole> => {
    const res = await signIn(email);
    const role = res.role || 'student';
    const redirectMap: Record<UserRole, string> = {
      student: '/student',
      instructor: '/instructor',
      tenant_admin: '/admin',
      super_admin: '/platform',
    };
    router.push(redirectMap[role]);
    return role;
  };

  const signOut = async () => {
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setProfile(null);
    setTenant(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adaptive_lms_demo_user');
      document.cookie = 'demo_user_email=; path=/; max-age=0';
      document.cookie = 'demo_user_role=; path=/; max-age=0';
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ profile, tenant, loading, signIn, signOut, switchSeedAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
