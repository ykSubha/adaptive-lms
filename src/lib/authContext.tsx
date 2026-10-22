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
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  tenant: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
});

function getInitialProfile(): Profile | null {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const queryEmail = urlParams.get('demo_user');

    const cookieMatch = document.cookie.match(/demo_user_email=([^;]+)/);
    const cookieEmail = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : null;
    const savedEmail = localStorage.getItem('auth_user_email');
    const email = queryEmail || cookieEmail || savedEmail;
    if (email) {
      const found = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (found) {
        document.cookie = `demo_user_email=${found.email}; path=/; max-age=604800`;
        document.cookie = `demo_user_role=${found.role}; path=/; max-age=604800`;
        localStorage.setItem('auth_user_email', found.email);
        return found;
      }
    }
  }
  return null;
}

function getInitialTenant(prof: Profile | null): Tenant | null {
  if (!prof?.tenant_id) return null;
  return INITIAL_TENANTS.find(t => t.id === prof.tenant_id) || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLive = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'));
  const [profile, setProfile] = useState<Profile | null>(() => (isLive ? null : getInitialProfile()));
  const [tenant, setTenant] = useState<Tenant | null>(() => (isLive ? null : getInitialTenant(getInitialProfile())));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadUser = async () => {
    const supabase = createClient();

    if (isLive) {
      setLoading(true);
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
            document.cookie = `demo_user_email=${profileData.email}; path=/; max-age=604800`;
            document.cookie = `demo_user_role=${profileData.role}; path=/; max-age=604800`;
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Live Supabase auth check failed:', e);
      }
      setLoading(false);
      return;
    }

    const current = getInitialProfile();
    setProfile(current);
    setTenant(getInitialTenant(current));
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
          return { error: 'Profile not found for this user account.' };
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
        localStorage.setItem('auth_user_email', profileData.email);
        setLoading(false);
        return { role: profileData.role };
      }
    }

    // Standard Seed Directory verification
    const match = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      setProfile(match);
      const matchTenant = match.tenant_id ? INITIAL_TENANTS.find(t => t.id === match.tenant_id) || null : null;
      setTenant(matchTenant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user_email', match.email);
        document.cookie = `demo_user_email=${match.email}; path=/; max-age=604800`;
        document.cookie = `demo_user_role=${match.role}; path=/; max-age=604800`;
      }
      setLoading(false);
      return { role: match.role };
    }

    setLoading(false);
    return { error: 'Invalid credentials. User email not recognized in directory.' };
  };

  const signOut = async () => {
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    setProfile(null);
    setTenant(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user_email');
      localStorage.removeItem('adaptive_lms_demo_user');
      document.cookie = 'demo_user_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'demo_user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        tenant,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
