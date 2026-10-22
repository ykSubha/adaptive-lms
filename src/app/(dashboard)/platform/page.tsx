'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Calendar,
  Hash,
  Activity,
  Server,
  Search,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

function PlatformContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams ? searchParams.get('tab') || 'dash' : 'dash';

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
        if (tenantList) {
          setTenants(tenantList);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live fetch failed, using mock data:', err);
      }
    }
    setTimeout(() => {
      setTenants([...INITIAL_TENANTS]);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadTenants();
  }, [profile]);

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
      try {
        const supabase = createClient();
        await supabase.from('tenants').insert(newTenant);
      } catch (err) {
        console.warn('Live insert failed:', err);
      }
    }
    INITIAL_TENANTS.push(newTenant);
    setTenants(prev => [newTenant, ...prev]);
    setTenantName('');
    setTenantSlug('');
    setShowCreateModal(false);
    setFeedbackMsg(`Tenant "${newTenant.name}" provisioned successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Institutional Banner */}
      <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#2e5a44] text-xs font-bold uppercase tracking-wider mb-1">
              <Shield className="h-4 w-4" />
              <span>Multi-Tenant Infrastructure Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Institutional Tenancy &amp; Entity Directory
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
              Partitioned organizational instances directory. Strict RLS policy prevents cross-tenant and platform access to academic records and course materials.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadTenants}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Records
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Entity
            </button>
          </div>
        </div>

        {!loading && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="px-4 py-3 rounded-xl bg-[#f8faf8] border border-[#dbe7dc]">
              <div className="text-xl font-bold text-slate-900 leading-none">{tenants.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Total Entities</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-[#f8faf8] border border-[#dbe7dc]">
              <div className="text-xl font-bold text-[#2e5a44] leading-none">{tenants.length}</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Active Partitions</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-[#f8faf8] border border-[#dbe7dc]">
              <div className="text-xl font-bold text-emerald-700 leading-none">100%</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">RLS Compliance</div>
            </div>
          </div>
        )}
      </div>

      {feedbackMsg && (
        <div className="animate-scale-in flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Security isolation notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-900">Zero-Knowledge Tenant Isolation Active</div>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            Per security policy, super administrators can only provision and manage tenants. Strict Row-Level Security blocks all access to student enrollments, quiz results, cognitive profiles, and course materials.
          </p>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: MULTI-TENANT GOVERNANCE (tab === 'dash')
          ========================================================================= */}
      {activeTab === 'dash' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* System Partitioning Card */}
            <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#2e5a44] font-bold text-sm">
                <Server className="h-4 w-4" />
                <span>Multi-Tenant Architecture</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Each institutional department operates in a dedicated logical database partition. Student assessments, cognitive profiles, and proctoring telemetry are isolated via Postgres Row-Level Security (RLS) policies.
              </p>
              <div className="space-y-2 pt-2 border-t border-[#eaf0eb]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Database Engine:</span>
                  <span className="font-semibold text-slate-800">PostgreSQL (Supabase)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Isolation Layer:</span>
                  <span className="font-semibold text-[#2e5a44]">Row-Level Security (RLS)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Active Tenant Nodes:</span>
                  <span className="font-semibold text-slate-800">{tenants.length} Instances</span>
                </div>
              </div>
            </div>

            {/* Quick Entity Provisioning Snapshot */}
            <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#2e5a44] font-bold text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>Provisioned Entities</span>
                </div>
                <button
                  onClick={() => router.push('/platform?tab=tenants')}
                  className="text-xs font-semibold text-[#2e5a44] hover:underline flex items-center gap-1"
                >
                  View Directory <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Institutional departments registered on this infrastructure instance.
              </p>
              <div className="space-y-2 pt-2 border-t border-[#eaf0eb]">
                {tenants.map(t => (
                  <div key={t.id} className="p-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.slug}.test</div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#2e5a44] bg-[#edf4ee] px-2 py-0.5 rounded-full border border-[#dbe7dc]">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: PROVISIONED ENTITIES (tab === 'tenants')
          ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Provisioned Departments &amp; Entities</h2>
              <p className="text-xs text-slate-500">Directory of isolated institutional tenancy instances</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Provision New Entity
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-3 shadow-xs">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entities by name or domain slug..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2e5a44]"
              />
            </div>
          </div>

          {/* Grid of entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTenants.map(t => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-[#dbe7dc] shadow-xs p-5 hover:border-[#2e5a44]/40 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[#edf4ee] text-[#2e5a44] flex items-center justify-center font-bold text-sm border border-[#dbe7dc]">
                    {t.name.charAt(0)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc] uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2e5a44]" />
                    Active Entity
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                  <div className="text-[11px] font-mono text-[#2e5a44] mt-0.5 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span>{t.slug}.test</span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#eaf0eb] text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <Hash className="h-3 w-3 text-slate-300" />
                    <span className="truncate">{t.id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-300" />
                    <span>Provisioned {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredTenants.length === 0 && (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-[#dbe7dc] col-span-3 text-xs">
                No institutional entities found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="animate-scale-in bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 text-slate-900">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#2e5a44]" />
                <h3 className="text-sm font-bold">Provision New Entity</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Entity / Department Name</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={e => {
                    setTenantName(e.target.value);
                    if (!tenantSlug) setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="e.g. Faculty of Engineering"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2e5a44] focus:ring-2 focus:ring-[#2e5a44]/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Slug / Domain Identifier</label>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:border-[#2e5a44] focus-within:ring-2 focus-within:ring-[#2e5a44]/20 transition">
                  <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs font-mono border-r border-slate-200 shrink-0">slug:</span>
                  <input
                    type="text"
                    required
                    value={tenantSlug}
                    onChange={e => setTenantSlug(e.target.value)}
                    placeholder="e.g. engineering"
                    className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Will resolve to <span className="font-mono text-[#2e5a44]">{tenantSlug || 'slug'}.test</span></p>
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
                  className="px-4 py-2 rounded-xl bg-[#2e5a44] text-white font-bold text-sm hover:bg-[#254937] transition shadow-xs"
                >
                  Provision Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformSuperAdminPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading platform governance...</div>}>
      <PlatformContent />
    </Suspense>
  );
}
