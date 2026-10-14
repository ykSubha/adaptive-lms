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
  Clock,
  User,
  BookOpen,
  Filter,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

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

        // 1. Fetch courses taught by this instructor
        const { data: courseList } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', profile.id);

        if (courseList) setCourses(courseList);

        // 2. Fetch class_topic_pulse view
        const { data: pulse } = await supabase
          .from('class_topic_pulse')
          .select('*');

        if (pulse) setPulseData(pulse);

        // 3. Fetch proctoring_events for instructor's courses
        const { data: flags } = await supabase
          .from('proctoring_events')
          .select(`
            id, tenant_id, course_id, student_id, flag_type, confidence,
            severity, status, reviewed_by, reviewed_at, created_at,
            student:profiles!student_id(full_name, email),
            course:courses!course_id(title, code)
          `)
          .order('created_at', { ascending: false });

        if (flags) {
          setEvents(flags as any);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live fetch for instructor dashboard failed, using mock data:', err);
      }
    }

    // Mock data fallback
    setTimeout(() => {
      const instructorId = profile?.id || '44444444-4444-4444-4444-444444444441';
      const myCourses = INITIAL_COURSES.filter(c => c.instructor_id === instructorId);
      setCourses(myCourses);

      // Compute pulse data from topics and cognitive profiles
      const myCourseIds = new Set(myCourses.map(c => c.id));
      const topics = INITIAL_TOPICS.filter(t => myCourseIds.has(t.course_id));

      const computedPulse: ClassTopicPulse[] = topics.map(topic => {
        const course = myCourses.find(c => c.id === topic.course_id);
        const profilesForTopic = INITIAL_COGNITIVE_PROFILES.filter(cp => cp.topic_id === topic.id);
        const avg = profilesForTopic.length > 0
          ? profilesForTopic.reduce((acc, curr) => acc + curr.trust_score, 0) / profilesForTopic.length
          : 0.500;

        return {
          course_id: topic.course_id,
          course_title: course?.title || 'Course',
          topic_id: topic.id,
          topic_name: topic.name,
          avg_trust: Number(avg.toFixed(3)),
          student_count: profilesForTopic.length || 1,
        };
      });
      setPulseData(computedPulse);

      // Filter proctoring events for courses taught by this instructor
      const instructorEvents = INITIAL_PROCTORING_EVENTS.filter(e => myCourseIds.has(e.course_id));
      // Sort by severity (high > medium > low)
      const severityRank = { high: 3, medium: 2, low: 1 };
      instructorEvents.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
      setEvents([...instructorEvents]);
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadInstructorData();
  }, [profile]);

  // Update status (Dismiss or Confirm)
  const handleReviewFlag = async (eventId: string, newStatus: 'dismissed' | 'confirmed') => {
    setUpdatingId(eventId);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive && profile) {
      try {
        const supabase = createClient();
        await supabase
          .from('proctoring_events')
          .update({
            status: newStatus,
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', eventId);
      } catch (err) {
        console.warn('Live proctoring status update failed:', err);
      }
    }

    // Update in-memory state
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            status: newStatus,
            reviewed_by: profile?.id || 'instructor',
            reviewed_at: new Date().toISOString(),
          };
        }
        return ev;
      })
    );

    const mockMatch = INITIAL_PROCTORING_EVENTS.find(e => e.id === eventId);
    if (mockMatch) {
      mockMatch.status = newStatus;
      mockMatch.reviewed_by = profile?.id;
      mockMatch.reviewed_at = new Date().toISOString();
    }

    setUpdatingId(null);
  };

  const filteredEvents = events.filter(e => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <School className="h-4 w-4" />
            <span>Instructor Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile?.full_name || 'Instructor'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time topic pulse analytics and student proctoring audit trails
          </p>
        </div>
        <button
          onClick={loadInstructorData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Courses Overview */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Assigned Courses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {course.code}
                </span>
                <span className="text-xs text-slate-400">Instructor ID: {course.instructor_id.substring(0, 8)}...</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">{course.title}</h3>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{course.description}</p>
            </div>
          ))}
          {courses.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 col-span-2">
              No courses assigned to your instructor profile.
            </div>
          )}
        </div>
      </section>

      {/* Section: class_topic_pulse View */}
      <section id="pulse" className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Class Topic Pulse</h2>
              <p className="text-xs text-slate-500">
                Aggregated average trust scores per topic (view: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">class_topic_pulse</code>)
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Exponential Moving Average</span>
        </div>

        {pulseData.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No topic pulse data recorded yet.</div>
        ) : (
          <div className="space-y-4">
            {pulseData.map(topic => {
              const trustPct = Math.round(topic.avg_trust * 100);
              let barColor = 'bg-rose-500';
              let badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
              if (topic.avg_trust >= 0.70) {
                barColor = 'bg-emerald-500';
                badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else if (topic.avg_trust >= 0.45) {
                barColor = 'bg-amber-500';
                badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
              }

              return (
                <div key={topic.topic_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{topic.topic_name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-medium">
                        {topic.student_count} student{topic.student_count === 1 ? '' : 's'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold border ${badgeBg}`}>
                        Trust: {topic.avg_trust.toFixed(3)} ({trustPct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${trustPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section: Proctoring Review Table */}
      <section id="proctoring" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Proctoring Review</h2>
              <p className="text-xs text-slate-500">
                Flags for your courses sorted by severity. Instructors review and update status.
              </p>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['all', 'pending', 'confirmed', 'dismissed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Flags Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Flag Type</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map(flag => {
                const isUpdating = updatingId === flag.id;

                let severityBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                if (flag.severity === 'high') severityBadge = 'bg-rose-100 text-rose-800 border-rose-200';
                if (flag.severity === 'low') severityBadge = 'bg-blue-100 text-blue-800 border-blue-200';

                let statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                if (flag.status === 'confirmed') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                if (flag.status === 'dismissed') statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <tr key={flag.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {flag.student?.full_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {flag.student?.email || flag.student_id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {flag.flag_type === 'tab_switch' ? 'Tab Switch' : 'Focus Loss'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {(flag.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold border uppercase text-[10px] tracking-wider ${severityBadge}`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(flag.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-semibold border capitalize ${statusBadge}`}>
                        {flag.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleReviewFlag(flag.id, 'dismissed')}
                        disabled={isUpdating || flag.status === 'dismissed'}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
                        title="Dismiss flag as benign"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleReviewFlag(flag.id, 'confirmed')}
                        disabled={isUpdating || flag.status === 'confirmed'}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition"
                        title="Confirm flag for violation review"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Confirm
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredEvents.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              No flags matching status "{filterStatus}".
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
