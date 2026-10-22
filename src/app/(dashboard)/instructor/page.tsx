'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { ProctoringEvent, Course, ClassTopicPulse } from '@/lib/types';
import {
  INITIAL_COURSES,
  INITIAL_PROCTORING_EVENTS,
  INITIAL_TOPICS,
  INITIAL_COGNITIVE_PROFILES,
} from '@/lib/mockData';
import {
  School,
  ShieldAlert,
  CheckCircle,
  XCircle,
  BarChart3,
  BookOpen,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-react';

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`px-4 py-3 rounded-2xl border flex flex-col gap-1 ${color}`}>
      <div className="text-xl font-extrabold leading-none">{value}</div>
      <div className="text-[11px] font-semibold opacity-75 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function InstructorPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pulseData, setPulseData] = useState<ClassTopicPulse[]>([]);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'dismissed'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInstructorData = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive && profile) {
      try {
        const supabase = createClient();
        const { data: courseList } = await supabase.from('courses').select('*').eq('instructor_id', profile.id);
        if (courseList) setCourses(courseList);
        const { data: pulse } = await supabase.from('class_topic_pulse').select('*');
        if (pulse) setPulseData(pulse);
        const { data: flags } = await supabase
          .from('proctoring_events')
          .select(`id, tenant_id, course_id, student_id, flag_type, confidence, severity, status, reviewed_by, reviewed_at, created_at, student:profiles!student_id(full_name, email), course:courses!course_id(title, code)`)
          .order('created_at', { ascending: false });
        if (flags) { setEvents(flags as any); setLoading(false); return; }
      } catch (err) {
        console.warn('Live fetch failed, using mock data:', err);
      }
    }

    setTimeout(() => {
      const instructorId = profile?.id || '44444444-4444-4444-4444-444444444441';
      const myCourses = INITIAL_COURSES.filter(c => c.instructor_id === instructorId);
      setCourses(myCourses);
      const myCourseIds = new Set(myCourses.map(c => c.id));
      const topics = INITIAL_TOPICS.filter(t => myCourseIds.has(t.course_id));
      const computedPulse: ClassTopicPulse[] = topics.map(topic => {
        const course = myCourses.find(c => c.id === topic.course_id);
        const profilesForTopic = INITIAL_COGNITIVE_PROFILES.filter(cp => cp.topic_id === topic.id);
        const avg = profilesForTopic.length > 0
          ? profilesForTopic.reduce((acc, curr) => acc + curr.trust_score, 0) / profilesForTopic.length
          : 0.500;
        return { course_id: topic.course_id, course_title: course?.title || 'Course', topic_id: topic.id, topic_name: topic.name, avg_trust: Number(avg.toFixed(3)), student_count: profilesForTopic.length || 1 };
      });
      setPulseData(computedPulse);
      const instructorEvents = INITIAL_PROCTORING_EVENTS.filter(e => myCourseIds.has(e.course_id));
      const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
      instructorEvents.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
      setEvents([...instructorEvents]);
      setLoading(false);
    }, 250);
  };

  useEffect(() => { loadInstructorData(); }, [profile]);

  const handleReviewFlag = async (eventId: string, newStatus: 'dismissed' | 'confirmed') => {
    setUpdatingId(eventId);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    if (isLive && profile) {
      try {
        const supabase = createClient();
        await supabase.from('proctoring_events').update({ status: newStatus, reviewed_by: profile.id, reviewed_at: new Date().toISOString() }).eq('id', eventId);
      } catch (err) { console.warn('Live update failed:', err); }
    }
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus, reviewed_by: profile?.id || 'instructor', reviewed_at: new Date().toISOString() } : ev));
    const mockMatch = INITIAL_PROCTORING_EVENTS.find(e => e.id === eventId);
    if (mockMatch) { mockMatch.status = newStatus; mockMatch.reviewed_by = profile?.id; mockMatch.reviewed_at = new Date().toISOString(); }
    setUpdatingId(null);
  };

  const filteredEvents = events.filter(e => filterStatus === 'all' || e.status === filterStatus);

  // Stats
  const pendingCount = events.filter(e => e.status === 'pending').length;
  const highSeverityCount = events.filter(e => e.severity === 'high').length;
  const avgClassTrust = pulseData.length > 0 ? (pulseData.reduce((s, p) => s + p.avg_trust, 0) / pulseData.length) : 0;

  const TABS = ['all', 'pending', 'confirmed', 'dismissed'] as const;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="animate-fade-in-up relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <School className="h-4 w-4" />
              <span>Instructor Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome, {profile?.full_name?.split(' ')[0] || 'Instructor'} 👋
            </h1>
            <p className="text-blue-200 text-sm mt-1.5">Real-time topic pulse analytics & student proctoring audit trails</p>
          </div>
          <button
            onClick={loadInstructorData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition text-white shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Quick stats row */}
        {!loading && (
          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip label="Courses" value={courses.length} color="bg-white/10 border-white/20 text-white" />
            <StatChip label="Topics Tracked" value={pulseData.length} color="bg-white/10 border-white/20 text-white" />
            <StatChip label="Avg Class Trust" value={`${(avgClassTrust * 100).toFixed(0)}%`} color="bg-white/10 border-white/20 text-white" />
            <StatChip label="Pending Flags" value={pendingCount} color={pendingCount > 0 ? "bg-amber-400/20 border-amber-300/30 text-white" : "bg-white/10 border-white/20 text-white"} />
          </div>
        )}
      </div>

      {/* Assigned Courses */}
      <section className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Assigned Courses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {courses.map((course, i) => (
            <div
              key={course.id}
              className="animate-fade-in-up bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  {course.code}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{course.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
            </div>
          ))}
          {courses.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 col-span-2">
              No courses assigned to your instructor profile.
            </div>
          )}
        </div>
      </section>

      {/* Class Topic Pulse */}
      <section className="animate-fade-in-up bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Class Topic Pulse</h2>
              <p className="text-xs text-slate-400">Aggregated EMA trust scores per topic (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">class_topic_pulse</code> view)</p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">Exponential Moving Average</span>
        </div>

        {pulseData.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No topic pulse data recorded yet.</div>
        ) : (
          <div className="space-y-4 stagger-children">
            {pulseData.map((topic, i) => {
              const trustPct = Math.round(topic.avg_trust * 100);
              let barColor = 'bg-gradient-to-r from-rose-500 to-rose-400';
              let badgeCls = 'bg-rose-50 text-rose-700 border-rose-200';
              let TrIcon = TrendingDown;
              let trColor = 'text-rose-500';
              if (topic.avg_trust >= 0.70) {
                barColor = 'bg-gradient-to-r from-emerald-500 to-emerald-400';
                badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                TrIcon = TrendingUp;
                trColor = 'text-emerald-500';
              } else if (topic.avg_trust >= 0.45) {
                barColor = 'bg-gradient-to-r from-amber-500 to-amber-400';
                badgeCls = 'bg-amber-50 text-amber-700 border-amber-200';
                TrIcon = TrendingUp;
                trColor = 'text-amber-500';
              }

              return (
                <div key={topic.topic_id} className="animate-fade-in-up space-y-1.5" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <TrIcon className={`h-3.5 w-3.5 ${trColor}`} />
                      <span className="font-semibold text-slate-800">{topic.topic_name}</span>
                      <span className="text-slate-400 hidden sm:inline">
                        <Users className="h-3 w-3 inline mr-0.5" />
                        {topic.student_count} {topic.student_count === 1 ? 'student' : 'students'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg font-bold border text-xs ${badgeCls}`}>
                      {topic.avg_trust.toFixed(3)} ({trustPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} bar-animated transition-all duration-700`}
                      style={{ width: `${trustPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Proctoring Review */}
      <section className="animate-fade-in-up bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Proctoring Review</h2>
              <p className="text-xs text-slate-400">Flags sorted by severity. Review and update status.</p>
            </div>
            {highSeverityCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                <AlertTriangle className="h-3 w-3" />
                {highSeverityCount} high severity
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterStatus === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {tab === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-4">Flag Type</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEvents.map(flag => {
                const isUpdating = updatingId === flag.id;

                const severityMap: Record<string, string> = {
                  high: 'bg-rose-100 text-rose-800 border-rose-200',
                  medium: 'bg-amber-100 text-amber-800 border-amber-200',
                  low: 'bg-blue-100 text-blue-800 border-blue-200',
                };
                const statusMap: Record<string, string> = {
                  pending: 'bg-amber-50 text-amber-700 border-amber-200',
                  confirmed: 'bg-rose-50 text-rose-700 border-rose-200',
                  dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
                };

                return (
                  <tr key={flag.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{flag.student?.full_name || 'Student'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{flag.student?.email || flag.student_id.substring(0, 8)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">
                        {flag.flag_type === 'tab_switch' ? 'Tab Switch' : 'Focus Loss'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(flag.confidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-slate-600">{(flag.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold border uppercase text-[9px] tracking-wider ${severityMap[flag.severity] || ''}`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-300" />
                        {new Date(flag.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-semibold border capitalize text-[10px] ${statusMap[flag.status] || ''}`}>
                        {flag.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReviewFlag(flag.id, 'dismissed')}
                          disabled={isUpdating || flag.status === 'dismissed'}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition border border-slate-200"
                        >
                          <XCircle className="h-3 w-3 text-slate-500" />
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleReviewFlag(flag.id, 'confirmed')}
                          disabled={isUpdating || flag.status === 'confirmed'}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition shadow-sm shadow-rose-200"
                        >
                          <Check className="h-3 w-3" />
                          Confirm
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredEvents.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No flags matching "{filterStatus}".
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
