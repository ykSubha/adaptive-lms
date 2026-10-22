'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { Course, Profile } from '@/lib/types';
import {
  INITIAL_COURSES,
  INITIAL_PROFILES,
  INITIAL_TENANTS,
} from '@/lib/mockData';
import {
  UserCheck,
  BookOpen,
  Plus,
  Users,
  Building2,
  CheckCircle2,
  Shield,
  RefreshCw,
  X,
  GraduationCap,
  School,
  Hash,
  Mail,
  Calendar,
} from 'lucide-react';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8]">
      <div className="p-2 rounded-lg bg-[#edf4ee] text-[#2e5a44]">
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-[11px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="animate-scale-in bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2e5a44] focus:ring-2 focus:ring-[#2e5a44]/20 transition"
      />
    </div>
  );
}

export default function TenantAdminPage() {
  const { profile, tenant } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'instructor'>('student');

  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseInstructorId, setNewCourseInstructorId] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadTenantData = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive && profile?.tenant_id) {
      try {
        const supabase = createClient();
        const { data: tenantCourses } = await supabase.from('courses').select('*').eq('tenant_id', profile.tenant_id);
        if (tenantCourses) setCourses(tenantCourses);
        const { data: tenantUsers } = await supabase.from('profiles').select('*').eq('tenant_id', profile.tenant_id);
        if (tenantUsers) setUsers(tenantUsers);
        setLoading(false);
        return;
      } catch (err) { console.warn('Live fetch failed, using mock data:', err); }
    }
    setTimeout(() => {
      const tenantId = profile?.tenant_id || '11111111-1111-1111-1111-111111111111';
      const myCourses = INITIAL_COURSES.filter(c => c.tenant_id === tenantId);
      const myUsers = INITIAL_PROFILES.filter(u => u.tenant_id === tenantId);
      setCourses(myCourses);
      setUsers(myUsers);
      if (myUsers.some(u => u.role === 'instructor')) {
        const first = myUsers.find(u => u.role === 'instructor');
        if (first) setNewCourseInstructorId(first.id);
      }
      setLoading(false);
    }, 250);
  };

  useEffect(() => { loadTenantData(); }, [profile]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    const tenantId = profile?.tenant_id || '11111111-1111-1111-1111-111111111111';
    const newUser: Profile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      tenant_id: tenantId,
      email: newUserEmail,
      full_name: newUserName,
      role: newUserRole,
      created_at: new Date().toISOString(),
    };
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive) {
      try { const supabase = createClient(); await supabase.from('profiles').insert(newUser); }
      catch (err) { console.warn('Live insert failed:', err); }
    }
    INITIAL_PROFILES.push(newUser);
    setUsers(prev => [...prev, newUser]);
    setNewUserName(''); setNewUserEmail('');
    setShowAddUserModal(false);
    setFeedbackMsg(`User ${newUser.full_name} added successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseCode) return;
    const tenantId = profile?.tenant_id || '11111111-1111-1111-1111-111111111111';
    const newCourse: Course = {
      id: 'crs-' + Math.random().toString(36).substring(2, 9),
      tenant_id: tenantId,
      instructor_id: newCourseInstructorId || users.find(u => u.role === 'instructor')?.id || '44444444-4444-4444-4444-444444444441',
      title: newCourseTitle,
      code: newCourseCode,
      description: newCourseDesc,
      created_at: new Date().toISOString(),
    };
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive) {
      try { const supabase = createClient(); await supabase.from('courses').insert(newCourse); }
      catch (err) { console.warn('Live insert failed:', err); }
    }
    INITIAL_COURSES.push(newCourse);
    setCourses(prev => [...prev, newCourse]);
    setNewCourseTitle(''); setNewCourseCode(''); setNewCourseDesc('');
    setShowAddCourseModal(false);
    setFeedbackMsg(`Course "${newCourse.title}" created successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const instructors = users.filter(u => u.role === 'instructor');
  const studentCount = users.filter(u => u.role === 'student').length;

  const ROLE_BADGE: Record<string, string> = {
    student: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    instructor: 'bg-blue-50 text-blue-700 border-blue-200',
    tenant_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    super_admin: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const ROLE_ICON: Record<string, React.ElementType> = {
    student: GraduationCap,
    instructor: School,
    tenant_admin: Shield,
    super_admin: Shield,
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Institutional Banner */}
      <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#2e5a44] text-xs font-bold uppercase tracking-wider mb-1">
              <UserCheck className="h-4 w-4" />
              <span>Department Administration Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {tenant?.name || 'School of Computing & Engineering'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">Curriculum management and user roster provisioning for institutional department.</p>
          </div>
          <button
            onClick={loadTenantData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Records
          </button>
        </div>
        {!loading && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={BookOpen} label="Course Modules" value={courses.length} />
            <StatCard icon={GraduationCap} label="Enrolled Candidates" value={studentCount} />
            <StatCard icon={School} label="Faculty Instructors" value={instructors.length} />
          </div>
        )}
      </div>

      {/* Feedback toast */}
      {feedbackMsg && (
        <div className="animate-scale-in flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tenant Courses */}
      <section id="courses" className="space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#2e5a44]" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Department Course Modules</h2>
              <p className="text-xs text-slate-400">Curriculum catalog under {tenant?.name || 'this department'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCourseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Module
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {courses.map((course, i) => (
            <div
              key={course.id}
              className="animate-fade-in-up bg-white rounded-2xl border border-[#dbe7dc] p-5 shadow-xs hover:border-[#2e5a44]/40 transition-all space-y-2"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
                  {course.code}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {course.id.substring(0, 8)}…</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{course.description || 'No description provided.'}</p>
            </div>
          ))}
          {courses.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 col-span-2 text-sm">
              No course modules configured for this department.
            </div>
          )}
        </div>
      </section>

      {/* Tenant Users */}
      <section id="users" className="animate-fade-in-up bg-white rounded-3xl border border-[#dbe7dc] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#f8faf8]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#edf4ee] text-[#2e5a44]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Department Roster</h2>
              <p className="text-xs text-slate-400">{users.length} registered member{users.length !== 1 ? 's' : ''} in this department</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Full Name</th>
                <th className="py-3 px-5">Email</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Tenant ID</th>
                <th className="py-3 px-5">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const RoleIcon = ROLE_ICON[u.role] || Shield;
                const badgeCls = ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600 border-slate-200';
                return (
                  <tr key={u.id} className="hover:bg-[#f8faf8] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[#2e5a44] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold text-slate-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-300" />
                        {u.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border uppercase text-[9px] tracking-wider ${badgeCls}`}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[10px]">
                      {u.tenant_id?.substring(0, 8)}…
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-300" />
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-400">No users found for this department.</div>
          )}
        </div>
      </section>

      {/* Modal: Add User */}
      <Modal open={showAddUserModal} onClose={() => setShowAddUserModal(false)} title="Add User to Department">
        <form onSubmit={handleAddUser} className="space-y-4">
          <InputField label="Full Name" value={newUserName} onChange={setNewUserName} placeholder="e.g. John Doe" required />
          <InputField label="Email Address" type="email" value={newUserEmail} onChange={setNewUserEmail} placeholder="e.g. candidate@university.edu" required />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Role</label>
            <select
              value={newUserRole}
              onChange={e => setNewUserRole(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#2e5a44] focus:ring-2 focus:ring-[#2e5a44]/20 bg-white transition"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-[#2e5a44] text-white font-semibold text-sm hover:bg-[#254937] transition shadow-xs">
              Save User
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Course */}
      <Modal open={showAddCourseModal} onClose={() => setShowAddCourseModal(false)} title="Create Course Module">
        <form onSubmit={handleAddCourse} className="space-y-4">
          <InputField label="Course Title" value={newCourseTitle} onChange={setNewCourseTitle} placeholder="e.g. Operating Systems" required />
          <InputField label="Course Code" value={newCourseCode} onChange={setNewCourseCode} placeholder="e.g. CS-301" required />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Faculty Instructor</label>
            <select
              value={newCourseInstructorId}
              onChange={e => setNewCourseInstructorId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#2e5a44] focus:ring-2 focus:ring-[#2e5a44]/20 bg-white transition"
            >
              {instructors.map(ins => (
                <option key={ins.id} value={ins.id}>{ins.full_name} ({ins.email})</option>
              ))}
              {instructors.length === 0 && (
                <option value="44444444-4444-4444-4444-444444444441">Dr. Sarah Stone</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={newCourseDesc}
              onChange={e => setNewCourseDesc(e.target.value)}
              placeholder="Course summary and learning objectives"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2e5a44] focus:ring-2 focus:ring-[#2e5a44]/20 transition resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-[#2e5a44] text-white font-semibold text-sm hover:bg-[#254937] transition shadow-xs">
              Create Module
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
