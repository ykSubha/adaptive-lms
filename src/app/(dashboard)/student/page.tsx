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
  BookOpen,
  ArrowRight,
  Sparkles,
  Flame,
  Brain,
  RefreshCw,
  Award,
} from 'lucide-react';

interface EnrolledCourseWithDetails {
  course: Course;
  topics: Topic[];
  cognitiveProfiles: CognitiveProfile[];
  weakestTopic: Topic | null;
  avgTrust: number;
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

        // 1. Fetch enrollments for current student
        const { data: enrollments, error: enrollError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', profile.id);

        if (enrollError) throw enrollError;

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);

          // 2. Fetch courses
          const { data: courses } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);

          // 3. Fetch topics for these courses
          const { data: topics } = await supabase
            .from('topics')
            .select('*')
            .in('course_id', courseIds);

          // 4. Fetch cognitive profiles for this student
          const { data: cognitiveProfiles } = await supabase
            .from('cognitive_profiles')
            .select('*')
            .eq('student_id', profile.id);

          if (courses) {
            const formatted: EnrolledCourseWithDetails[] = courses.map(c => {
              const courseTopics = (topics || []).filter(t => t.course_id === c.id);
              const courseCP = (cognitiveProfiles || []).filter(cp => cp.course_id === c.id);

              let weakest: Topic | null = null;
              let lowestScore = 1.0;

              for (const t of courseTopics) {
                const cp = courseCP.find(p => p.topic_id === t.id);
                const score = cp ? cp.trust_score : 0.500;
                if (score < lowestScore) {
                  lowestScore = score;
                  weakest = t;
                }
              }

              const avgTrust = courseCP.length > 0
                ? courseCP.reduce((acc, curr) => acc + curr.trust_score, 0) / courseCP.length
                : 0.500;

              return {
                course: c,
                topics: courseTopics,
                cognitiveProfiles: courseCP,
                weakestTopic: weakest,
                avgTrust,
              };
            });

            setEnrolledCourses(formatted);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Live fetch for student dashboard failed, using mock data:', err);
      }
    }

    // Fallback using in-memory mock data
    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      // RLS Check: Alpha student only gets Alpha courses; Beta student only gets Beta courses
      const myEnrollments = INITIAL_ENROLLMENTS.filter(e => e.student_id === studentId);
      const enrolledCourseIds = new Set(myEnrollments.map(e => e.course_id));

      const myCourses = INITIAL_COURSES.filter(c => enrolledCourseIds.has(c.id));

      const formatted: EnrolledCourseWithDetails[] = myCourses.map(c => {
        const courseTopics = INITIAL_TOPICS.filter(t => t.course_id === c.id);
        const courseCP = INITIAL_COGNITIVE_PROFILES.filter(
          cp => cp.student_id === studentId && cp.course_id === c.id
        );

        let weakest: Topic | null = null;
        let lowestScore = 1.0;

        for (const t of courseTopics) {
          const cp = courseCP.find(p => p.topic_id === t.id);
          const score = cp ? cp.trust_score : 0.500;
          if (score < lowestScore) {
            lowestScore = score;
            weakest = t;
          }
        }

        const avgTrust = courseCP.length > 0
          ? courseCP.reduce((acc, curr) => acc + curr.trust_score, 0) / courseCP.length
          : 0.500;

        return {
          course: c,
          topics: courseTopics,
          cognitiveProfiles: courseCP,
          weakestTopic: weakest,
          avgTrust,
        };
      });

      setEnrolledCourses(formatted);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadStudentData();
  }, [profile]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Institutional Banner */}
      <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 md:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-[#2e5a44] mb-1">
            <Award className="h-4 w-4" />
            <span>Curriculum & Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {profile?.full_name || 'Academic Candidate'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered coursework modules, per-topic cognitive mastery heatmaps, and proctored examinations.
          </p>
        </div>
        <button
          onClick={loadStudentData}
          disabled={loading}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {/* Enrolled Courses & Heatmaps */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-[#2e5a44]" />
            <h2 className="text-base font-bold text-slate-900">Enrolled Curriculum</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Affiliated Department: <strong className="text-slate-800">{profile?.email.includes('beta') ? 'Department of Information Sciences' : 'School of Computing & Engineering'}</strong>
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e5a44] mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading syllabus records and cognitive mastery profile...</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-12 text-center text-slate-500">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active course enrollments found.</p>
            <p className="text-xs text-slate-400 mt-1">Contact your institutional department administrator for course assignment.</p>
          </div>
        ) : (
          enrolledCourses.map(({ course, topics, cognitiveProfiles, weakestTopic, avgTrust }) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-[#dbe7dc] shadow-xs overflow-hidden"
            >
              {/* Course Header */}
              <div className="p-5 md:p-6 border-b border-[#e2ede3] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#f8faf8]">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Topic Mastery Index: {(avgTrust * 100).toFixed(0)}%</span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{course.description}</p>
                </div>

                {/* Course Actions */}
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <Link
                    href={`/student/course/${course.id}/practice`}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2e5a44] bg-[#edf4ee] hover:bg-[#e2ede3] border border-[#dbe7dc] transition"
                  >
                    Target Weakest
                  </Link>
                  <Link
                    href={`/student/course/${course.id}/quiz`}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2e5a44] hover:bg-[#254937] shadow-xs transition"
                  >
                    <Brain className="h-3.5 w-3.5 mr-1.5" />
                    Proctored Assessment
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Heatmap Section */}
              <div className="p-5 md:p-6 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Per-Topic Cognitive Mastery Heatmap</span>
                  <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#2e5a44]"></span> Mastered (≥ 0.70)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span> Developing (0.40 - 0.69)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span> Needs Review (&lt; 0.40)
                    </span>
                  </div>
                </div>

                <Heatmap topics={topics} cognitiveProfiles={cognitiveProfiles} />

                {weakestTopic && (
                  <div className="mt-3 p-3 rounded-xl bg-[#f8faf8] border border-[#dbe7dc] text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Flame className="h-4 w-4 text-rose-500" />
                      <span>
                        Diagnostic Target Topic: <strong className="text-slate-900">{weakestTopic.name}</strong>
                      </span>
                    </div>
                    <Link
                      href={`/student/course/${course.id}/practice`}
                      className="text-[#2e5a44] font-semibold hover:underline flex items-center gap-1"
                    >
                      Targeted Practice Questions <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
