'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { Tenant } from '@/lib/types';
import { INITIAL_TENANTS } from '@/lib/mockData';
import {
  Shield,
  Building2,
  Plus,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw,
  X,
  Sparkles,
  Calendar,
  Hash,
  Activity,
  Server,
} from 'lucide-react';

export default function PlatformSuperAdminPage() {
  const { profile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadTenants = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive && profile?.role === 'super_admin') {
      try {
        const supabase = createClient();
        const { data: tenantList } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
        if (tenantList) { setTenants(tenantList); setLoading(false); return; }
      } catch (err) { console.warn('Live fetch failed, using mock data:', err); }
    }
    setTimeout(() => { setTenants([...INITIAL_TENANTS]); setLoading(false); }, 250);
  };

  useEffect(() => { loadTenants(); }, [profile]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantSlug) return;
    const newTenant: Tenant = {
      id: 'tnt-' + Math.random().toString(36).substring(2, 9),
      name: tenantName,
      slug: tenantSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      created_at: new Date().toISOString(),
    };
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive) {
      try { const supabase = createClient(); await supabase.from('tenants').insert(newTenant); }
      catch (err) { console.warn('Live insert failed:', err); }
    }
    INITIAL_TENANTS.push(newTenant);
    setTenants(prev => [newTenant, ...prev]);
    setTenantName(''); setTenantSlug('');
    setShowCreateModal(false);
    setFeedbackMsg(`Tenant "${newTenant.name}" provisioned successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Color palette for tenant cards
  const CARD_GRADIENTS = [
    'from-indigo-500 to-violet-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-teal-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="animate-fade-in-up relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-slate-900/30">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Shield className="h-4 w-4 text-rose-400" />
              <span>Platform Super Admin</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="text-emerald-400">Global Root</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Tenant Provisioning & Management
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
              Manage global multi-tenant entities. Strict RLS prevents super admins from accessing course or student data.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadTenants}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md shadow-rose-900/40"
            >
              <Plus className="h-3.5 w-3.5" />
              New Tenant
            </button>
          </div>
        </div>

        {/* Quick stats */}
        {!loading && (
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xl font-extrabold">{tenants.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">Total Tenants</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xl font-extrabold text-emerald-400">{tenants.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">Active</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xl font-extrabold text-amber-400">0</div>
              <div className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">Suspended</div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedbackMsg && (
        <div className="animate-scale-in flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Security isolation notice */}
      <div className="animate-fade-in-up flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-900">Zero-Knowledge Tenant Isolation Active</div>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            Per security policy, super administrators can only provision and manage tenants. Strict Row-Level Security blocks all access to student enrollments, quiz results, cognitive profiles, and course materials.
          </p>
        </div>
      </div>

      {/* Tenant Cards Grid */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Provisioned Tenants</h2>
              <p className="text-xs text-slate-400">Active enterprise learning instances</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="h-8 w-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading tenant instances...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No tenants provisioned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {tenants.map((t, i) => {
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              const initial = t.name.charAt(0).toUpperCase();
              return (
                <div
                  key={t.id}
                  className="animate-fade-in-up bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Top accent */}
                  <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-extrabold shadow-sm`}>
                        {initial}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">{t.name}</h3>

                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Globe className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        <span className="font-mono text-indigo-600">{t.slug}.test</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Hash className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        <span className="font-mono truncate">{t.id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        <span>Provisioned {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="animate-scale-in bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold">Provision New Tenant</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={e => {
                    setTenantName(e.target.value);
                    if (!tenantSlug) setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="e.g. Gamma University"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug / Identifier</label>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 transition">
                  <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs font-mono border-r border-slate-200 shrink-0">slug:</span>
                  <input
                    type="text"
                    required
                    value={tenantSlug}
                    onChange={e => setTenantSlug(e.target.value)}
                    placeholder="e.g. gamma"
                    className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Will resolve to <span className="font-mono text-indigo-600">{tenantSlug || 'slug'}.test</span></p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition shadow-sm shadow-rose-200"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
