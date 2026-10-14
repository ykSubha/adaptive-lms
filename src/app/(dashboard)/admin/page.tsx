'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { Course, Profile, UserRole } from '@/lib/types';
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
  Mail,
  Shield,
  RefreshCw,
  X,
} from 'lucide-react';

export default function TenantAdminPage() {
  const { profile, tenant } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'instructor'>('student');

  // New course form state
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

        // 1. Fetch courses for this tenant only
        const { data: tenantCourses } = await supabase
          .from('courses')
          .select('*')
          .eq('tenant_id', profile.tenant_id);

        if (tenantCourses) setCourses(tenantCourses);

        // 2. Fetch profiles for this tenant only
        const { data: tenantUsers } = await supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', profile.tenant_id);

        if (tenantUsers) setUsers(tenantUsers);

        setLoading(false);
        return;
      } catch (err) {
        console.warn('Live fetch for tenant admin failed, using mock data:', err);
      }
    }

    // Local simulation: strictly filter to this admin's tenant
    setTimeout(() => {
      const tenantId = profile?.tenant_id || '11111111-1111-1111-1111-111111111111';
      const myCourses = INITIAL_COURSES.filter(c => c.tenant_id === tenantId);
      const myUsers = INITIAL_PROFILES.filter(u => u.tenant_id === tenantId);

      setCourses(myCourses);
      setUsers(myUsers);
      if (myUsers.some(u => u.role === 'instructor')) {
        const firstInstructor = myUsers.find(u => u.role === 'instructor');
        if (firstInstructor) setNewCourseInstructorId(firstInstructor.id);
      }
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadTenantData();
  }, [profile]);

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
      try {
        const supabase = createClient();
        await supabase.from('profiles').insert(newUser);
      } catch (err) {
        console.warn('Live profile insert failed:', err);
      }
    }

    INITIAL_PROFILES.push(newUser);
    setUsers(prev => [...prev, newUser]);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUserModal(false);
    setFeedbackMsg(`User ${newUser.full_name} added successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
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
      try {
        const supabase = createClient();
        await supabase.from('courses').insert(newCourse);
      } catch (err) {
        console.warn('Live course insert failed:', err);
      }
    }

    INITIAL_COURSES.push(newCourse);
    setCourses(prev => [...prev, newCourse]);
    setNewCourseTitle('');
    setNewCourseCode('');
    setNewCourseDesc('');
    setShowAddCourseModal(false);
    setFeedbackMsg(`Course ${newCourse.title} created successfully.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const instructors = users.filter(u => u.role === 'instructor');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
            <UserCheck className="h-4 w-4" />
            <span>Tenant Administrator Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tenant?.name || 'Alpha Academy'} Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage courses and user rosters exclusively for your tenant.
          </p>
        </div>
        <button
          onClick={loadTenantData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Tenant
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Section 1: Tenant Courses */}
      <section id="courses" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tenant Courses</h2>
              <p className="text-xs text-slate-500">Courses published under {tenant?.name || 'this tenant'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCourseModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Course
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {course.code}
                </span>
                <span className="text-[11px] text-slate-400">ID: {course.id.substring(0, 8)}...</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{course.description || 'No description provided.'}</p>
            </div>
          ))}

          {courses.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 col-span-2">
              No courses configured for this tenant.
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Tenant Users */}
      <section id="users" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tenant Users</h2>
              <p className="text-xs text-slate-500">Students and instructors registered in this tenant</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Full Name</th>
                <th className="py-3 px-5">Email Address</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Tenant ID</th>
                <th className="py-3 px-5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (u.role === 'instructor') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                if (u.role === 'tenant_admin') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3.5 px-5 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-full font-bold border uppercase text-[10px] tracking-wider ${badgeColor}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">{u.tenant_id?.substring(0, 8)}...</td>
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-400">No users found for this tenant.</div>
          )}
        </div>
      </section>

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add User to Tenant</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. john@alpha.test"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-purple-600 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Course */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Tenant Course</h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={e => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={newCourseCode}
                  onChange={e => setNewCourseCode(e.target.value)}
                  placeholder="e.g. CS-301"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructor</label>
                <select
                  value={newCourseInstructorId}
                  onChange={e => setNewCourseInstructorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-600 bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCourseDesc}
                  onChange={e => setNewCourseDesc(e.target.value)}
                  placeholder="Course summary and learning objectives"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
