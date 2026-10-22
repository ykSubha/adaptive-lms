'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import Heatmap from '@/components/Heatmap';
import { Course, Topic, CognitiveProfile } from '@/lib/types';
import { recommend, RecommendationResult } from '@/lib/recommend';
import {
  INITIAL_COURSES,
  INITIAL_ENROLLMENTS,
  INITIAL_TOPICS,
  INITIAL_QUESTIONS,
  INITIAL_COGNITIVE_PROFILES,
} from '@/lib/mockData';
import {
  BookOpen,
  ArrowRight,
  Flame,
  Brain,
  RefreshCw,
  Award,
  ClipboardList,
  Compass,
  Layers,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Shield,
  HelpCircle,
  Target,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface EnrolledCourseWithDetails {
  course: Course;
  topics: Topic[];
  cognitiveProfiles: CognitiveProfile[];
  weakestTopic: Topic | null;
  avgTrust: number;
}

function StudentContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams ? searchParams.get('tab') || 'dashboard' : 'dashboard';

  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithDetails[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const loadStudentData = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive && profile) {
      try {
        const supabase = createClient();
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', profile.id);

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);
          const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
          const { data: topics } = await supabase.from('topics').select('*').in('course_id', courseIds);
          const { data: cognitiveProfiles } = await supabase.from('cognitive_profiles').select('*').eq('student_id', profile.id);
          const { data: questions } = await supabase.from('questions').select('*').in('course_id', courseIds);

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

            // Compute recommendations for weakest topic
            if (formatted[0]?.weakestTopic && questions) {
              const recs = recommend(
                questions as any,
                formatted[0].weakestTopic.id,
                formatted[0].weakestTopic.name,
                0.28
              );
              setRecommendations(recs);
            }

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

      if (formatted[0]?.weakestTopic) {
        const courseQuestions = INITIAL_QUESTIONS.filter(q => q.course_id === formatted[0].course.id);
        const recs = recommend(
          courseQuestions as any,
          formatted[0].weakestTopic.id,
          formatted[0].weakestTopic.name,
          0.28
        );
        setRecommendations(recs);
      }

      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadStudentData();
  }, [profile]);

  const primaryCourse = enrolledCourses[0];
  const primaryWeakest = primaryCourse?.weakestTopic;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Institutional Banner */}
      <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 md:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-[#2e5a44] mb-1">
            <Award className="h-4 w-4" />
            <span>Curriculum &amp; Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {profile?.full_name || 'Academic Candidate'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered coursework modules, per-topic cognitive mastery tracking, and proctored examinations.
          </p>
        </div>

        <button
          onClick={loadStudentData}
          disabled={loading}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {/* Quick Stat Bar (Visible across views) */}
      {!loading && primaryCourse && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="px-4 py-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8]">
            <div className="text-xl font-bold text-slate-900 leading-none">{enrolledCourses.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Active Modules</div>
          </div>
          <div className="px-4 py-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8]">
            <div className="text-xl font-bold text-[#2e5a44] leading-none">
              {(primaryCourse.avgTrust * 100).toFixed(0)}%
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Cohort Mastery</div>
          </div>
          <div className="px-4 py-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8]">
            <div className="text-base font-bold text-rose-700 leading-tight truncate">
              {primaryWeakest?.name.split(' ')[0] || 'Machine Learning'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Focus Deficit</div>
          </div>
          <div className="px-4 py-3 rounded-xl border border-[#dbe7dc] bg-[#f8faf8]">
            <div className="text-base font-bold text-[#2e5a44] leading-tight flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Autonomous CV
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Proctoring Ready</div>
          </div>
        </div>
      )}

      {/* --- TAB VIEW 1: DASHBOARD & COURSES --- */}
      {(activeTab === 'dashboard' || activeTab === 'courses') && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Enrolled Curriculum &amp; Syllabus</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Department: <strong className="text-slate-800">{profile?.email.includes('beta') ? 'Department of Information Sciences' : 'School of Computing & Engineering'}</strong>
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
      )}

      {/* --- TAB VIEW 2: ASSESSMENTS --- */}
      {activeTab === 'assessments' && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Proctored Examination Center</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
                  CSE-401
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Computer Science Core Adaptive Examination
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  5-Question diagnostic assessment with autonomous client-side vision proctoring and real-time EMA score calibration.
                </p>
              </div>

              {primaryCourse && (
                <Link
                  href={`/student/course/${primaryCourse.course.id}/quiz`}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2e5a44] hover:bg-[#254937] shadow-xs transition"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Launch Assessment
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#f8faf8] border border-[#dbe7dc] space-y-2">
              <div className="text-xs font-bold text-[#254d37] flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#2e5a44]" />
                Institutional Proctoring Compliance Protocols
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Webcam feed must remain uninterrupted for autonomous head &amp; gaze tracking.</li>
                <li>Unauthorized mobile devices or secondary displays trigger automated instructor audit flags.</li>
                <li>Tab switches and window blur events are debounced and logged into the audit ledger.</li>
                <li>No automated failures occur; all flagged anomalies are submitted for faculty review.</li>
              </ul>
            </div>
          </div>

          {/* Historical Assessment Log */}
          <div className="bg-white rounded-2xl border border-[#dbe7dc] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f8faf8] border-b border-[#dbe7dc] text-xs font-bold text-slate-800">
              Recent Assessment Records
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Diagnostic Quiz #1 - Data Structures &amp; ML</div>
                  <div className="text-[11px] text-slate-400">Completed 5 Questions • 2 flags reviewed</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- TAB VIEW 3: LEARNING PATH --- */}
      {activeTab === 'path' && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Curriculum Learning Roadmap</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-5">
            <p className="text-xs text-slate-500">
              Sequential cognitive mastery milestones aligned with Department of Computer Science &amp; Engineering standards.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#dbe7dc] bg-[#edf4ee] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#2e5a44] text-white flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Data Structures &amp; Algorithms (DSA)</div>
                    <div className="text-[11px] text-slate-600">Arrays, Trees, Graphs &amp; Dynamic Programming</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2e5a44] bg-white px-2.5 py-1 rounded-lg border border-[#dbe7dc]">
                  Mastered (82%)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Data Science &amp; Analytics (DS)</div>
                    <div className="text-[11px] text-slate-600">Feature Engineering, Imputation &amp; PCA</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  In Progress (58%)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Operating Systems &amp; Networks</div>
                    <div className="text-[11px] text-slate-600">Virtual Memory, TCP Handshake &amp; Scheduling</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  Developing (44%)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Machine Learning (ML)</div>
                    <div className="text-[11px] text-slate-600">Loss Functions, Decision Trees &amp; Overfitting</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                  Focus Target (28%)
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- TAB VIEW 4: RECOMMENDATIONS --- */}
      {activeTab === 'recommendations' && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Diagnostic Practice Recommendations</h2>
            </div>
            {primaryCourse && (
              <Link
                href={`/student/course/${primaryCourse.course.id}/practice`}
                className="text-xs font-semibold text-[#2e5a44] hover:underline flex items-center gap-1"
              >
                Inspect Remediation View <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#dbe7dc] p-12 text-center text-slate-400 text-xs">
                Analyzing cognitive matrix to formulate recommendation sequence...
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <div
                  key={rec.question.id}
                  className="bg-white rounded-2xl border border-[#dbe7dc] p-5 shadow-2xs space-y-2 hover:border-[#2e5a44]/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#edf4ee] text-[#2e5a44] border border-[#dbe7dc]">
                      Priority #{idx + 1}
                    </span>
                    <span className="text-xs text-slate-500">
                      Relevance Affinity: <strong className="text-slate-800">{(rec.score * 100).toFixed(0)}%</strong>
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{rec.question.question_text}</h3>
                  <div className="p-2.5 rounded-lg bg-[#f8faf8] border border-[#dbe7dc] text-xs text-slate-600 flex items-start gap-2">
                    <Target className="h-3.5 w-3.5 text-[#2e5a44] shrink-0 mt-0.5" />
                    <span>{rec.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* --- TAB VIEW 5: REMEDIATION --- */}
      {activeTab === 'remediation' && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Target Weakest Topic Remediation</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                  Target: Machine Learning (ML)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Remediation Practice Questions</h3>
                <p className="text-xs text-slate-500 mt-1">Review questions specifically selected to improve your EMA mastery score.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#f8faf8] border border-[#dbe7dc] text-center shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Current Trust</div>
                <div className="text-xl font-black text-rose-600">28%</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {INITIAL_QUESTIONS.filter(q => q.topic_id === 't-ml').map((q) => {
                const isExpanded = expandedQuestionId === q.id;
                return (
                  <div key={q.id} className="p-4 rounded-xl border border-[#dbe7dc] bg-[#f8faf8] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{q.question_text}</span>
                      <span className="text-[11px] text-slate-400">Diff: {q.difficulty.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      className="text-xs font-semibold text-[#2e5a44] hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {isExpanded ? 'Hide Solution' : 'Inspect Explanation & Options'}
                    </button>
                    {isExpanded && (
                      <div className="pt-2 border-t border-[#dbe7dc] text-xs text-slate-600 space-y-2">
                        <div><strong className="text-slate-800">Correct Answer:</strong> {q.correct_answer}</div>
                        <div><strong className="text-slate-800">Explanation:</strong> {q.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* --- TAB VIEW 6: MY PROGRESS & COGNITIVE PROFILE --- */}
      {(activeTab === 'progress' || activeTab === 'profile') && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Cognitive Profile &amp; Progress Trajectory</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dbe7dc] p-6 shadow-xs space-y-4">
            <div className="text-xs text-slate-600 leading-relaxed">
              The Cognitive Trust Score evaluates candidate topic mastery using an Exponential Moving Average (EMA):
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono ml-1 text-slate-800">
                Score(t) = α · Result + (1 - α) · Score(t-1)
              </code>.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#dbe7dc] bg-[#f8faf8] text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Curriculum Topic</th>
                    <th className="py-2.5 px-4">EMA Trust Score</th>
                    <th className="py-2.5 px-4">Attempts</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INITIAL_COGNITIVE_PROFILES.filter(cp => cp.student_id === '33333333-3333-3333-3333-333333333331').map((cp) => {
                    const topic = INITIAL_TOPICS.find(t => t.id === cp.topic_id);
                    const pct = Math.round(cp.trust_score * 100);
                    let badge = 'bg-rose-50 text-rose-800 border-rose-200';
                    let label = 'Needs Review';
                    if (cp.trust_score >= 0.70) {
                      badge = 'bg-[#edf4ee] text-[#2e5a44] border-[#dbe7dc]';
                      label = 'Mastered';
                    } else if (cp.trust_score >= 0.40) {
                      badge = 'bg-amber-50 text-amber-800 border-amber-200';
                      label = 'Developing';
                    }

                    return (
                      <tr key={cp.id}>
                        <td className="py-3 px-4 font-semibold text-slate-900">{topic?.name || cp.topic_id}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{cp.trust_score.toFixed(3)} ({pct}%)</td>
                        <td className="py-3 px-4 text-slate-500">{cp.attempt_count} evaluations</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* --- TAB VIEW 7: NOTIFICATIONS --- */}
      {activeTab === 'notifications' && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-[#2e5a44]" />
              <h2 className="text-base font-bold text-slate-900">Institutional Examination Notices</h2>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#dbe7dc] p-5 shadow-xs flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#2e5a44] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Autonomous Proctoring System Active</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time client-side vision proctoring is enabled. Keep face centered in frame during assessments. Mobile devices and gaze deviations are audited automatically.
                </p>
                <div className="text-[10px] text-slate-400 mt-1">Institutional Audit Board • Today</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#dbe7dc] p-5 shadow-xs flex items-start gap-3">
              <FileText className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Diagnostic Practice Sequences Updated</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Term frequency recommendations for CSE-401 are calibrated with your recent response times.
                </p>
                <div className="text-[10px] text-slate-400 mt-1">Curriculum Council • Yesterday</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading academic workspace...</div>}>
      <StudentContent />
    </Suspense>
  );
}
