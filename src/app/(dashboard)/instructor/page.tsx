'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { ProctoringEvent, Course, ClassTopicPulse, Topic } from '@/lib/types';
import {
  INITIAL_COURSES,
  INITIAL_PROCTORING_EVENTS,
  INITIAL_TOPICS,
  INITIAL_COGNITIVE_PROFILES,
  INITIAL_QUESTIONS,
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
  Shield,
  FileSpreadsheet,
  ChevronRight,
  Eye,
  Smartphone,
  CheckCircle2,
  SlidersHorizontal,
  FolderGit2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Download,
  HelpCircle,
} from 'lucide-react';

function StatChip({
  label,
  value,
  badge,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  badge?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="px-4 py-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8] flex flex-col gap-1 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-4 w-4 text-[#2e5a44]" />}
          <span className="text-xl font-bold text-slate-900 leading-none">{value}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {badge}
          </span>
        )}
      </div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

const FLAG_METADATA: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  mobile_detected: { label: 'Mobile Device Detected', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: Smartphone },
  eye_diversion: { label: 'Eye Diversion / Head Tilt', badge: 'bg-amber-50 text-amber-800 border-amber-200', icon: Eye },
  multiple_faces: { label: 'Multiple Faces in Frame', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: Users },
  face_missing: { label: 'Candidate Face Missing', badge: 'bg-rose-50 text-rose-800 border-rose-200', icon: AlertTriangle },
  tab_switch: { label: 'Tab Switch', badge: 'bg-purple-50 text-purple-800 border-purple-200', icon: ShieldAlert },
  focus_loss: { label: 'Window Blur / Focus Loss', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
};

function InstructorContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams ? searchParams.get('tab') || 'dash' : 'dash';

  const [courses, setCourses] = useState<Course[]>([]);
  const [pulseData, setPulseData] = useState<ClassTopicPulse[]>([]);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Proctoring Review
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'dismissed'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterFlagType, setFilterFlagType] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter for Topic Pulse
  const [pulseFilterCourse, setPulseFilterCourse] = useState<string>('all');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);

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
        const { data: allTopics } = await supabase.from('topics').select('*');
        if (allTopics) setTopics(allTopics);
        const { data: flags } = await supabase
          .from('proctoring_events')
          .select(`id, tenant_id, course_id, student_id, flag_type, confidence, severity, status, reviewed_by, reviewed_at, created_at, student:profiles!student_id(full_name, email), course:courses!course_id(title, code)`)
          .order('created_at', { ascending: false });
        if (flags) {
          setEvents(flags as any);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live fetch failed, using mock data:', err);
      }
    }

    setTimeout(() => {
      const instructorId = profile?.id || '44444444-4444-4444-4444-444444444441';
      const myCourses = INITIAL_COURSES.filter(c => c.instructor_id === instructorId);
      setCourses(myCourses);
      const myCourseIds = new Set(myCourses.map(c => c.id));
      const relevantTopics = INITIAL_TOPICS.filter(t => myCourseIds.has(t.course_id));
      setTopics(relevantTopics);

      const computedPulse: ClassTopicPulse[] = relevantTopics.map(topic => {
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

      const instructorEvents = INITIAL_PROCTORING_EVENTS.filter(e => myCourseIds.has(e.course_id));
      const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
      instructorEvents.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
      setEvents([...instructorEvents]);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadInstructorData();
  }, [profile]);

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
        console.warn('Live update failed:', err);
      }
    }
    setEvents(prev =>
      prev.map(ev =>
        ev.id === eventId
          ? { ...ev, status: newStatus, reviewed_by: profile?.id || 'instructor', reviewed_at: new Date().toISOString() }
          : ev
      )
    );
    const mockMatch = INITIAL_PROCTORING_EVENTS.find(e => e.id === eventId);
    if (mockMatch) {
      mockMatch.status = newStatus;
      mockMatch.reviewed_by = profile?.id;
      mockMatch.reviewed_at = new Date().toISOString();
    }
    setUpdatingId(null);
  };

  const handleBatchConfirmHigh = () => {
    const highPending = events.filter(e => e.severity === 'high' && e.status === 'pending');
    if (highPending.length === 0) return;
    setEvents(prev =>
      prev.map(e =>
        e.severity === 'high' && e.status === 'pending'
          ? { ...e, status: 'confirmed', reviewed_by: profile?.id || 'instructor', reviewed_at: new Date().toISOString() }
          : e
      )
    );
    setActionNotice(`Batch confirmed ${highPending.length} high-severity proctoring incident(s).`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Filtered Proctoring Events
  const filteredEvents = events.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (filterFlagType !== 'all' && e.flag_type !== filterFlagType) return false;
    return true;
  });

  // Filtered Pulse Data
  const filteredPulse = pulseData.filter(p => {
    if (pulseFilterCourse !== 'all' && p.course_id !== pulseFilterCourse) return false;
    return true;
  });

  // Key stats
  const pendingCount = events.filter(e => e.status === 'pending').length;
  const highSeverityCount = events.filter(e => e.severity === 'high' && e.status === 'pending').length;
  const confirmedCount = events.filter(e => e.status === 'confirmed').length;
  const avgClassTrust =
    pulseData.length > 0 ? pulseData.reduce((s, p) => s + p.avg_trust, 0) / pulseData.length : 0;

  const weakestCohortTopic = [...pulseData].sort((a, b) => a.avg_trust - b.avg_trust)[0];
  const strongestCohortTopic = [...pulseData].sort((a, b) => b.avg_trust - a.avg_trust)[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Institutional Faculty Header */}
      <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#2e5a44] text-xs font-bold uppercase tracking-wider mb-1">
              <School className="h-4 w-4" />
              <span>Department of Computer Science &amp; Engineering</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {profile?.full_name || 'Faculty Member'}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Curriculum oversight, cohort EMA cognitive mastery tracking, and autonomous proctoring adjudication.
            </p>
          </div>
          <button
            onClick={loadInstructorData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Records
          </button>
        </div>

        {/* Global Faculty Metrics */}
        {!loading && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip label="Assigned Modules" value={courses.length} icon={BookOpen} />
            <StatChip label="Syllabus Topics Tracked" value={pulseData.length} icon={BarChart3} />
            <StatChip label="Avg Cohort Mastery" value={`${(avgClassTrust * 100).toFixed(0)}%`} icon={GraduationCap} />
            <StatChip
              label="Audit Flags Pending"
              value={pendingCount}
              badge={highSeverityCount > 0 ? `${highSeverityCount} High Risk` : undefined}
              icon={ShieldAlert}
            />
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="animate-scale-in p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: FACULTY DASHBOARD (tab === 'dash')
          ========================================================================= */}
      {activeTab === 'dash' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action alerts banner */}
          {pendingCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    {pendingCount} Candidate Proctoring Flag{pendingCount !== 1 ? 's' : ''} Awaiting Adjudication
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Autonomous CV camera detected {highSeverityCount} high-severity anomaly event{highSeverityCount !== 1 ? 's' : ''} requiring instructor disposition.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/instructor?tab=proctoring')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-xs shrink-0 flex items-center gap-1"
              >
                Open Audit Review <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Course Modules & Topic Health Snapshot */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assigned Course Cards */}
              <div className="bg-white rounded-2xl border border-[#dbe7dc] p-5 md:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#2e5a44]" />
                    <h2 className="text-sm font-bold text-slate-900">Assigned Course Modules</h2>
                  </div>
                  <button
                    onClick={() => router.push('/instructor?tab=courses')}
                    className="text-xs font-semibold text-[#2e5a44] hover:underline flex items-center gap-1"
                  >
                    View All Modules <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl border border-[#dbe7dc] bg-[#f8faf8] hover:border-[#2e5a44]/50 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
                          {course.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                          Active Syllabus
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{course.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{course.description}</p>
                      <div className="pt-2 border-t border-[#eaf0eb] flex items-center justify-between text-[11px] text-slate-500">
                        <span>4 Topics Tracked</span>
                        <span className="font-semibold text-slate-800">4 Enrolled</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Pulse Overview Bar */}
              <div className="bg-white rounded-2xl border border-[#dbe7dc] p-5 md:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#2e5a44]" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Cohort Topic Pulse Summary</h2>
                      <p className="text-[11px] text-slate-400">Class aggregate mastery score per curriculum topic</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/instructor?tab=pulse')}
                    className="text-xs font-semibold text-[#2e5a44] hover:underline flex items-center gap-1"
                  >
                    Full Topic Analytics <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {pulseData.slice(0, 4).map(topic => {
                    const trustPct = Math.round(topic.avg_trust * 100);
                    let barColor = 'bg-rose-500';
                    let badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                    if (topic.avg_trust >= 0.70) {
                      barColor = 'bg-[#2e5a44]';
                      badgeColor = 'bg-[#edf4ee] text-[#2e5a44] border-[#dbe7dc]';
                    } else if (topic.avg_trust >= 0.45) {
                      barColor = 'bg-amber-500';
                      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                    }

                    return (
                      <div key={topic.topic_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{topic.topic_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {(topic.avg_trust * 100).toFixed(0)}% Mastery
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${trustPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Recent Proctoring Flags Needing Review */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#dbe7dc] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-slate-900">Recent Proctoring Alerts</h2>
                  </div>
                  <button
                    onClick={() => router.push('/instructor?tab=proctoring')}
                    className="text-xs font-semibold text-[#2e5a44] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {events.slice(0, 4).map(flag => {
                    const meta = FLAG_METADATA[flag.flag_type] || { label: flag.flag_type, badge: 'bg-slate-100 text-slate-700', icon: AlertTriangle };
                    const FlagIcon = meta.icon;
                    return (
                      <div key={flag.id} className="p-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{flag.student?.full_name || 'Candidate'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${flag.severity === 'high' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {flag.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <FlagIcon className="h-3 w-3 text-slate-400" />
                          <span>{meta.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#eaf0eb]">
                          <span>{new Date(flag.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <div className="flex items-center gap-1">
                            {flag.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleReviewFlag(flag.id, 'dismissed')}
                                  className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold"
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => handleReviewFlag(flag.id, 'confirmed')}
                                  className="px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700 font-semibold"
                                >
                                  Confirm
                                </button>
                              </>
                            ) : (
                              <span className="font-semibold uppercase text-slate-600">{flag.status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pedagogical Intervention Card */}
              {weakestCohortTopic && (
                <div className="bg-[#edf4ee] rounded-2xl border border-[#c8dec9] p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#254d37]">
                    <Sparkles className="h-4 w-4 text-[#2e5a44]" />
                    <span>Curriculum Focus Target</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{weakestCohortTopic.topic_name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cohort average is lowest on this topic ({(weakestCohortTopic.avg_trust * 100).toFixed(0)}%). Consider scheduling a dedicated tutorial or releasing practice question sequences.
                  </p>
                  <button
                    onClick={() => router.push('/instructor?tab=pulse')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2e5a44] hover:underline pt-1"
                  >
                    View Diagnostic Breakdown <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ASSIGNED COURSES (tab === 'courses')
          ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Curriculum &amp; Modules</h2>
              <p className="text-xs text-slate-500">Manage syllabus topics, examination question pools, and student enrollment</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-[#dbe7dc] text-slate-700">
                {courses.length} Assigned Course{courses.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map(course => {
              const courseTopics = topics.filter(t => t.course_id === course.id);
              const courseQuestions = INITIAL_QUESTIONS.filter(q => q.course_id === course.id);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-4 hover:border-[#2e5a44]/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
                      {course.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      Core Curriculum • 4 Credits
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{course.description}</p>
                  </div>

                  {/* Course Details Grid */}
                  <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#dbe7dc] grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Syllabus Topics</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{courseTopics.length} Units</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Question Pool</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{courseQuestions.length} Items</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Candidates</div>
                      <div className="text-sm font-bold text-[#2e5a44] mt-0.5">4 Enrolled</div>
                    </div>
                  </div>

                  {/* Topics List under Course */}
                  <div className="space-y-1.5 pt-2 border-t border-[#eaf0eb]">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Curriculum Units:
                    </div>
                    {courseTopics.map(t => (
                      <div
                        key={t.id}
                        className="px-3 py-2 rounded-lg bg-white border border-[#e2ede3] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">CSE Unit</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setSelectedCourseForDetail(selectedCourseForDetail?.id === course.id ? null : course)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#2e5a44] bg-[#edf4ee] hover:bg-[#e0ece1] border border-[#dbe7dc] transition text-center"
                    >
                      {selectedCourseForDetail?.id === course.id ? 'Hide Syllabus Details' : 'Inspect Syllabus'}
                    </button>
                    <button
                      onClick={() => router.push('/instructor?tab=pulse')}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-xs text-center"
                    >
                      View Topic Pulse
                    </button>
                  </div>

                  {/* Expandable Syllabus Drawer */}
                  {selectedCourseForDetail?.id === course.id && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-fade-in">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Course Syllabus Breakdown</span>
                        <span className="text-[10px] text-slate-500 font-normal">Department of Computing</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Evaluations in this module incorporate algorithmic time/space complexity, data structure design, and machine learning model validation.
                      </p>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Evaluation Structure:</div>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                          <li>5-Question diagnostic adaptive assessments</li>
                          <li>Real-time client vision proctoring required for all candidates</li>
                          <li>Exponential moving average mastery updates on each question submit</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: COHORT TOPIC PULSE (tab === 'pulse')
          ========================================================================= */}
      {activeTab === 'pulse' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cohort Topic Pulse Analytics</h2>
              <p className="text-xs text-slate-500">
                Class aggregate mastery score per curriculum topic calculated via Exponential Moving Average (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">class_topic_pulse</code>)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pulseFilterCourse}
                onChange={e => setPulseFilterCourse(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#dbe7dc] bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#2e5a44]"
              >
                <option value="all">All Assigned Modules</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparative Metrics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#dbe7dc] shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Strongest Mastery Topic</div>
              <div className="text-base font-bold text-[#2e5a44]">{strongestCohortTopic?.topic_name || 'DSA'}</div>
              <div className="text-xs text-slate-500">{((strongestCohortTopic?.avg_trust || 0.8) * 100).toFixed(0)}% cohort proficiency</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#dbe7dc] shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Critical Focus Topic</div>
              <div className="text-base font-bold text-rose-700">{weakestCohortTopic?.topic_name || 'Machine Learning'}</div>
              <div className="text-xs text-slate-500">{((weakestCohortTopic?.avg_trust || 0.28) * 100).toFixed(0)}% cohort proficiency</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#dbe7dc] shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Scoring Algorithm</div>
              <div className="text-base font-bold text-slate-900">Exponential Moving Average</div>
              <div className="text-xs text-slate-500">Smoothing Factor α = 0.35</div>
            </div>
          </div>

          {/* Interactive Topic Pulse Bar Chart */}
          <div className="bg-white rounded-3xl border border-[#dbe7dc] p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#eaf0eb] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#edf4ee] text-[#2e5a44]">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Topic Proficiency Spectrum</h3>
                  <p className="text-xs text-slate-400">Class average across candidate cognitive profiles</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#2e5a44]" /> Mastered (≥ 70%)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Developing (45-69%)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Intervention (&lt; 45%)</span>
              </div>
            </div>

            <div className="space-y-5">
              {filteredPulse.map(topic => {
                const trustPct = Math.round(topic.avg_trust * 100);
                let barColor = 'bg-rose-500';
                let badgeCls = 'bg-rose-50 text-rose-700 border-rose-200';
                let TrIcon = TrendingDown;
                let trColor = 'text-rose-500';

                if (topic.avg_trust >= 0.70) {
                  barColor = 'bg-[#2e5a44]';
                  badgeCls = 'bg-[#edf4ee] text-[#2e5a44] border-[#dbe7dc]';
                  TrIcon = TrendingUp;
                  trColor = 'text-[#2e5a44]';
                } else if (topic.avg_trust >= 0.45) {
                  barColor = 'bg-amber-500';
                  badgeCls = 'bg-amber-50 text-amber-700 border-amber-200';
                  TrIcon = TrendingUp;
                  trColor = 'text-amber-500';
                }

                return (
                  <div key={topic.topic_id} className="p-4 rounded-xl border border-[#eaf0eb] bg-[#f8faf8] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <TrIcon className={`h-4 w-4 ${trColor}`} />
                        <span className="font-bold text-slate-900">{topic.topic_name}</span>
                        <span className="text-slate-400 text-[11px] hidden sm:inline">({topic.course_title})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">{topic.student_count} candidate{topic.student_count !== 1 ? 's' : ''} evaluated</span>
                        <span className={`px-2.5 py-0.5 rounded-lg font-bold border text-xs ${badgeCls}`}>
                          {topic.avg_trust.toFixed(3)} ({trustPct}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-700`}
                        style={{ width: `${trustPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: PROCTORING REVIEW (tab === 'proctoring')
          ========================================================================= */}
      {activeTab === 'proctoring' && (
        <div className="space-y-6 animate-fade-in">
          {/* Proctoring Header & Batch Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Candidate Proctoring Integrity Audit</h2>
              <p className="text-xs text-slate-500">
                Autonomous CV and browser visibility event ledger. Adjudicate candidate assessment compliance flags.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {highSeverityCount > 0 && (
                <button
                  onClick={handleBatchConfirmHigh}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm All High ({highSeverityCount})
                </button>
              )}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(['all', 'pending', 'confirmed', 'dismissed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                      filterStatus === tab
                        ? 'bg-white text-slate-900 shadow-xs'
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

              {/* Severity Filter */}
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2e5a44]"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity Only</option>
                <option value="medium">Medium Severity Only</option>
                <option value="low">Low Severity Only</option>
              </select>

              {/* Flag Type Filter */}
              <select
                value={filterFlagType}
                onChange={e => setFilterFlagType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2e5a44]"
              >
                <option value="all">All Violation Types</option>
                <option value="mobile_detected">Mobile Device Detected</option>
                <option value="eye_diversion">Eye Diversion / Head Tilt</option>
                <option value="multiple_faces">Multiple Faces in Frame</option>
                <option value="face_missing">Candidate Face Missing</option>
                <option value="tab_switch">Tab Switch</option>
                <option value="focus_loss">Window Blur / Focus Loss</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredEvents.length} of {events.length} records
            </span>
          </div>

          {/* Audit Table */}
          <div className="bg-white rounded-3xl border border-[#dbe7dc] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8faf8] text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Candidate</th>
                    <th className="py-3 px-4">Audit Violation</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Audit Status</th>
                    <th className="py-3 px-4 text-right">Adjudication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map(flag => {
                    const isUpdating = updatingId === flag.id;

                    const severityMap: Record<string, string> = {
                      high: 'bg-rose-100 text-rose-800 border-rose-200',
                      medium: 'bg-amber-100 text-amber-800 border-amber-200',
                      low: 'bg-[#edf4ee] text-[#2e5a44] border-[#dbe7dc]',
                    };
                    const statusMap: Record<string, string> = {
                      pending: 'bg-amber-50 text-amber-700 border-amber-200',
                      confirmed: 'bg-rose-50 text-rose-700 border-rose-200',
                      dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
                    };
                    const meta = FLAG_METADATA[flag.flag_type] || {
                      label: flag.flag_type,
                      badge: 'bg-slate-100 text-slate-700 border-slate-200',
                      icon: AlertTriangle,
                    };

                    return (
                      <tr key={flag.id} className="hover:bg-[#f8faf8] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900">{flag.student?.full_name || 'Candidate'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{flag.student?.email || 'candidate@cse.bitsathy.ac.in'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2e5a44] rounded-full"
                                style={{ width: `${(flag.confidence * 100).toFixed(0)}%` }}
                              />
                            </div>
                            <span className="text-slate-600 font-medium">{(flag.confidence * 100).toFixed(0)}%</span>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition shadow-xs shadow-rose-200"
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
                  No proctoring records matching current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstructorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading faculty portal...</div>}>
      <InstructorContent />
    </Suspense>
  );
}
