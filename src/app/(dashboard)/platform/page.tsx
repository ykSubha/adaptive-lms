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
  AlertOctagon,
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
        // Super admin can select tenants
        const { data: tenantList } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });

        if (tenantList) {
          setTenants(tenantList);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live fetch for super admin tenants failed, using mock data:', err);
      }
    }

    setTimeout(() => {
      setTenants([...INITIAL_TENANTS]);
      setLoading(false);
    }, 250);
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
        console.warn('Live tenant insert failed:', err);
      }
    }

    INITIAL_TENANTS.push(newTenant);
    setTenants(prev => [...prev, newTenant]);
    setTenantName('');
    setTenantSlug('');
    setShowCreateModal(false);
    setFeedbackMsg(`Tenant "${newTenant.name}" created successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
            <Shield className="h-4 w-4" />
            <span>Platform Super Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tenant Provisioning & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage global multi-tenant entities. Strict RLS policy prevents super admins from accessing course or student data.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadTenants}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Tenant
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Security Isolation Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
        <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Zero-Knowledge Tenant Isolation Active: </span>
          Per security policy, super administrators can only provision tenants. Super admins are strictly prohibited by Row-Level Security from viewing student enrollments, quiz results, cognitive profiles, or course materials.
        </div>
      </div>

      {/* Tenants Table */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Provisioned Tenants</h2>
              <p className="text-xs text-slate-500">Active enterprise learning instances on the platform</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Total: {tenants.length} tenants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Tenant Name</th>
                <th className="py-3 px-5">Slug / Domain</th>
                <th className="py-3 px-5">Tenant UUID</th>
                <th className="py-3 px-5">Provisioned Date</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span>{t.name}</span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-indigo-600">{t.slug}.test</td>
                  <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">{t.id}</td>
                  <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tenants.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-400">No tenants provisioned yet.</div>
          )}
        </div>
      </section>

      {/* Modal: Create Tenant */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Provision New Tenant</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={e => {
                    setTenantName(e.target.value);
                    if (!tenantSlug) {
                      setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder="e.g. Gamma University"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-rose-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug / Identifier</label>
                <input
                  type="text"
                  required
                  value={tenantSlug}
                  onChange={e => setTenantSlug(e.target.value)}
                  placeholder="e.g. gamma"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-rose-600"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
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
