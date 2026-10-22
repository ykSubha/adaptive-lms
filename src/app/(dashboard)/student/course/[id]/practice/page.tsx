'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { recommend, RecommendationResult } from '@/lib/recommend';
import { Course, Topic, CognitiveProfile, Question } from '@/lib/types';
import {
  INITIAL_COURSES,
  INITIAL_TOPICS,
  INITIAL_QUESTIONS,
  INITIAL_COGNITIVE_PROFILES,
} from '@/lib/mockData';
import {
  Sparkles,
  ArrowLeft,
  Flame,
  Brain,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Target,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Medal,
  BarChart,
  Lightbulb,
} from 'lucide-react';

const DIFFICULTY_BADGE: Record<string, { label: string; cls: string }> = {
  easy: { label: 'Easy', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  hard: { label: 'Hard', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
};

function getDifficultyLabel(val: number): string {
  if (val < 0.4) return 'easy';
  if (val < 0.7) return 'medium';
  return 'hard';
}

export default function StudentPracticePage() {
  const params = useParams();
  const courseId = params?.id as string;
  const router = useRouter();
  const { profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [weakestTopic, setWeakestTopic] = useState<Topic | null>(null);
  const [weakestScore, setWeakestScore] = useState<number>(0.500);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPracticeData = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive && profile) {
      try {
        const supabase = createClient();
        const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single();
        if (c) setCourse(c);
        const { data: topics } = await supabase.from('topics').select('*').eq('course_id', courseId);
        const { data: cognitiveProfiles } = await supabase
          .from('cognitive_profiles').select('*').eq('student_id', profile.id).eq('course_id', courseId);
        const { data: questions } = await supabase.from('questions').select('*').eq('course_id', courseId);

        if (topics && questions) {
          let weakest: Topic = topics[0];
          let lowest = 1.0;
          for (const t of topics) {
            const cp = (cognitiveProfiles || []).find(p => p.topic_id === t.id);
            const score = cp ? cp.trust_score : 0.500;
            if (score < lowest) { lowest = score; weakest = t; }
          }
          setWeakestTopic(weakest);
          setWeakestScore(lowest);
          const recs = recommend(questions as any, weakest.id, weakest.name, lowest);
          setRecommendations(recs);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live fetch failed, using local algorithm:', err);
      }
    }

    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      const foundCourse = INITIAL_COURSES.find(c => c.id === courseId) || INITIAL_COURSES[0];
      setCourse(foundCourse);
      const courseTopics = INITIAL_TOPICS.filter(t => t.course_id === foundCourse.id);
      const studentCPs = INITIAL_COGNITIVE_PROFILES.filter(
        cp => cp.student_id === studentId && cp.course_id === foundCourse.id
      );
      let weakest: Topic = courseTopics[0];
      let lowest = 1.0;
      for (const t of courseTopics) {
        const cp = studentCPs.find(p => p.topic_id === t.id);
        const score = cp ? cp.trust_score : 0.500;
        if (score < lowest) { lowest = score; weakest = t; }
      }
      setWeakestTopic(weakest);
      setWeakestScore(lowest);
      const courseQuestions = INITIAL_QUESTIONS.filter(q => q.course_id === foundCourse.id);
      const recs = recommend(courseQuestions as any, weakest.id, weakest.name, lowest);
      setRecommendations(recs);
      setLoading(false);
    }, 250);
  };

  useEffect(() => { loadPracticeData(); }, [courseId]);

  const trustPct = Math.round(weakestScore * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="animate-fade-in-up flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/student')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <Link
          href={`/student/course/${courseId}/quiz`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
        >
          <Brain className="h-3.5 w-3.5" />
          Start Adaptive Quiz
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Hero: Weakest Topic */}
      <div className="animate-fade-in-up relative overflow-hidden rounded-3xl text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be185d 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold tracking-wide uppercase">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              Target Focus Topic
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {loading ? 'Loading...' : weakestTopic?.name || 'Unknown Topic'}
            </h1>
            <p className="text-sm text-rose-200 max-w-xl">
              Course: <strong className="text-white">{course?.title || 'Data Structures'}</strong> ({course?.code || 'CS-201'})
            </p>
            <p className="text-xs text-rose-300 max-w-lg">
              Recommendations ranked using token-frequency similarity from{' '}
              <code className="bg-white/20 px-1.5 py-0.5 rounded text-[11px]">lib/recommend.ts</code>
            </p>
          </div>

          {/* Trust score ring */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative">
              <svg width="100" height="100" className="-rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 - (trustPct / 100) * 2 * Math.PI * 40}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{trustPct}%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-rose-200 uppercase tracking-wider">Current Trust</div>
              <div className="text-[11px] text-rose-300 mt-0.5">EMA: {weakestScore.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Practice These Next</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <BarChart className="h-3.5 w-3.5" />
            Sorted by relevance & difficulty affinity
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="relative inline-flex mb-4">
              <Sparkles className="h-10 w-10 text-indigo-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Computing similarity matrix over question texts...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No practice recommendations found for this course.
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {recommendations.map((rec, index) => {
              const q = rec.question;
              const isExpanded = expandedId === q.id;
              const diffKey = getDifficultyLabel(q.difficulty);
              const diff = DIFFICULTY_BADGE[diffKey];
              const isTop = index === 0;

              return (
                <div
                  key={q.id}
                  className={`animate-fade-in-up bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md ${
                    isTop ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {isTop ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                            <Medal className="h-3 w-3" /> Top Pick
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                            #{index + 1}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          Match: <strong className="text-slate-700">{(rec.score * 100).toFixed(0)}%</strong>
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${diff.cls}`}>
                        {diff.label}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 mb-3">
                      <Lightbulb className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-indigo-800 leading-relaxed">{rec.reason}</span>
                    </div>

                    {/* Question text */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{q.question_text}</h3>

                    {/* Expand toggle */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {isExpanded ? 'Hide Solution' : 'Inspect Options & Explanation'}
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="animate-fade-in-up px-5 pb-5 border-t border-slate-100 bg-slate-50/60 space-y-3 pt-4">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Options</div>
                      <div className="space-y-2">
                        {Array.isArray(q.options) &&
                          q.options.map((opt: string, optIdx: number) => {
                            const isCorrect = q.correct_answer === opt;
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl text-xs flex items-center justify-between border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" /> Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
                          <strong className="text-slate-900 block mb-1">Explanation:</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
