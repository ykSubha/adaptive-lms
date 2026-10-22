'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import Heatmap from '@/components/Heatmap';
import { Course, Topic, CognitiveProfile } from '@/lib/types';
import {
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_TOPICS,
  INITIAL_COGNITIVE_PROFILES,
} from '@/lib/mockData';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Sparkles,
  Flame,
  Brain,
  RefreshCw,
  TrendingUp,
  Target,
  Zap,
  BarChart2,
} from 'lucide-react';

interface EnrolledCourseWithDetails {
  course: Course;
  topics: Topic[];
  cognitiveProfiles: CognitiveProfile[];
  weakestTopic: Topic | null;
  avgTrust: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="animate-fade-in-up bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</div>
      <div className="text-sm font-semibold text-slate-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function StudentDashboardPage() {
  const { profile } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudentData = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive && profile) {
      try {
        const supabase = createClient();
        const { data: enrollments, error: enrollError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', profile.id);
        if (enrollError) throw enrollError;
        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);
          const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
          const { data: topics } = await supabase.from('topics').select('*').in('course_id', courseIds);
          const { data: cognitiveProfiles } = await supabase
            .from('cognitive_profiles').select('*').eq('student_id', profile.id);
          if (courses) {
            const formatted: EnrolledCourseWithDetails[] = courses.map(c => {
              const courseTopics = (topics || []).filter(t => t.course_id === c.id);
              const courseCP = (cognitiveProfiles || []).filter(cp => cp.course_id === c.id);
              let weakest: Topic | null = null;
              let lowestScore = 1.0;
              for (const t of courseTopics) {
                const cp = courseCP.find(p => p.topic_id === t.id);
                const score = cp ? cp.trust_score : 0.500;
                if (score < lowestScore) { lowestScore = score; weakest = t; }
              }
              const avgTrust = courseCP.length > 0
                ? courseCP.reduce((acc, curr) => acc + curr.trust_score, 0) / courseCP.length
                : 0.500;
              return { course: c, topics: courseTopics, cognitiveProfiles: courseCP, weakestTopic: weakest, avgTrust };
            });
            setEnrolledCourses(formatted);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Live fetch failed, using mock data:', err);
      }
    }

    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      const myEnrollments = INITIAL_ENROLLMENTS.filter(e => e.student_id === studentId);
      const enrolledCourseIds = new Set(myEnrollments.map(e => e.course_id));
      const myCourses = INITIAL_COURSES.filter(c => enrolledCourseIds.has(c.id));
      const formatted: EnrolledCourseWithDetails[] = myCourses.map(c => {
        const courseTopics = INITIAL_TOPICS.filter(t => t.course_id === c.id);
        const courseCP = INITIAL_COGNITIVE_PROFILES.filter(cp => cp.student_id === studentId && cp.course_id === c.id);
        let weakest: Topic | null = null;
        let lowestScore = 1.0;
        for (const t of courseTopics) {
          const cp = courseCP.find(p => p.topic_id === t.id);
          const score = cp ? cp.trust_score : 0.500;
          if (score < lowestScore) { lowestScore = score; weakest = t; }
        }
        const avgTrust = courseCP.length > 0
          ? courseCP.reduce((acc, curr) => acc + curr.trust_score, 0) / courseCP.length
          : 0.500;
        return { course: c, topics: courseTopics, cognitiveProfiles: courseCP, weakestTopic: weakest, avgTrust };
      });
      setEnrolledCourses(formatted);
      setLoading(false);
    }, 250);
  };

  useEffect(() => { loadStudentData(); }, [profile]);

  // Aggregate stats
  const totalTopics = enrolledCourses.reduce((s, c) => s + c.topics.length, 0);
  const masteredTopics = enrolledCourses.reduce(
    (s, c) => s + c.cognitiveProfiles.filter(cp => cp.trust_score >= 0.7).length, 0
  );
  const overallAvg = enrolledCourses.length > 0
    ? enrolledCourses.reduce((s, c) => s + c.avgTrust, 0) / enrolledCourses.length
    : 0;

  const tenantLabel = profile?.email?.includes('beta') ? 'Beta Institute' : 'Alpha Academy';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="animate-fade-in-up relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-indigo-900/20">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>Student Learning Hub</span>
              <span className="h-1 w-1 rounded-full bg-indigo-300" />
              <span>{tenantLabel}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-indigo-200 text-sm mt-1.5 max-w-lg">
              Track your cognitive trust scores, take adaptive quizzes, and review targeted practice recommendations.
            </p>
          </div>
          <button
            onClick={loadStudentData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition text-white backdrop-blur-sm shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Enrolled Courses" value={enrolledCourses.length} sub="Active enrollments" color="bg-indigo-100 text-indigo-600" delay={0} />
          <StatCard icon={Target} label="Total Topics" value={totalTopics} sub="Across all courses" color="bg-violet-100 text-violet-600" delay={60} />
          <StatCard icon={TrendingUp} label="Topics Mastered" value={`${masteredTopics}/${totalTopics}`} sub="Score ≥ 70%" color="bg-emerald-100 text-emerald-600" delay={120} />
          <StatCard icon={BarChart2} label="Overall Trust" value={`${(overallAvg * 100).toFixed(0)}%`} sub="EMA Average" color="bg-amber-100 text-amber-600" delay={180} />
        </div>
      )}

      {/* Enrolled Courses & Heatmaps */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Enrolled Courses & Topic Heatmaps</h2>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Loading courses & cognitive trust scores...</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
            <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No active course enrollments found.</p>
            <p className="text-xs text-slate-400 mt-1">Your tenant administrator manages course enrollment.</p>
          </div>
        ) : (
          enrolledCourses.map(({ course, topics, cognitiveProfiles, weakestTopic, avgTrust }, courseIdx) => {
            const trustPct = Math.round(avgTrust * 100);
            const masteredCount = cognitiveProfiles.filter(cp => cp.trust_score >= 0.7).length;
            const radius = 28;
            const circ = 2 * Math.PI * radius;
            const offset = circ - (trustPct / 100) * circ;

            return (
              <div
                key={course.id}
                className="animate-fade-in-up bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                style={{ animationDelay: `${courseIdx * 80}ms` }}
              >
                {/* Course Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-start gap-4">
                    {/* Trust ring */}
                    <div className="relative shrink-0">
                      <svg width="70" height="70" className="-rotate-90">
                        <circle cx="35" cy="35" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle
                          cx="35" cy="35" r={radius}
                          fill="none"
                          stroke={avgTrust >= 0.7 ? '#10b981' : avgTrust >= 0.4 ? '#f59e0b' : '#f43f5e'}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={circ}
                          strokeDashoffset={offset}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-extrabold text-slate-900">{trustPct}%</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {course.code}
                        </span>
                        <span className="text-xs text-slate-400">{masteredCount}/{topics.length} topics mastered</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl line-clamp-2">{course.description}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2.5 w-full lg:w-auto">
                    <Link
                      href={`/student/course/${course.id}/practice`}
                      className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Practice Weakest
                    </Link>
                    <Link
                      href={`/student/course/${course.id}/quiz`}
                      className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      Adaptive Quiz
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Heatmap Section */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Topic Mastery Heatmap</span>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mastered (≥70%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500" /> Developing
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Needs Work
                      </span>
                    </div>
                  </div>

                  <Heatmap topics={topics} cognitiveProfiles={cognitiveProfiles} />

                  {weakestTopic && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <div className="p-1.5 rounded-lg bg-rose-100">
                          <Flame className="h-4 w-4 text-rose-500" />
                        </div>
                        <span>
                          Focus topic: <strong className="text-slate-900">{weakestTopic.name}</strong>
                        </span>
                      </div>
                      <Link
                        href={`/student/course/${course.id}/practice`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        View Recommendations <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
