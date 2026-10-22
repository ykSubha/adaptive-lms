'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { recommend, RecommendationResult } from '@/lib/recommend';
import { Course, Topic, Question } from '@/lib/types';
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
} from 'lucide-react';

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
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const loadPracticeData = async () => {
    setLoading(true);
    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive && profile) {
      try {
        const supabase = createClient();

        // 1. Fetch course
        const { data: c } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (c) setCourse(c);

        // 2. Fetch topics
        const { data: topics } = await supabase
          .from('topics')
          .select('*')
          .eq('course_id', courseId);

        // 3. Fetch cognitive profiles
        const { data: cognitiveProfiles } = await supabase
          .from('cognitive_profiles')
          .select('*')
          .eq('student_id', profile.id)
          .eq('course_id', courseId);

        // 4. Fetch all questions for this course
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('course_id', courseId);

        if (topics && questions) {
          let weakest: Topic = topics[0];
          let lowest = 1.0;

          for (const t of topics) {
            const cp = (cognitiveProfiles || []).find(p => p.topic_id === t.id);
            const score = cp ? cp.trust_score : 0.500;
            if (score < lowest) {
              lowest = score;
              weakest = t;
            }
          }

          setWeakestTopic(weakest);
          setWeakestScore(lowest);

          // Run recommend() algorithm from lib/recommend.ts
          const recs = recommend(questions as any, weakest.id, weakest.name, lowest);
          setRecommendations(recs);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live fetch for practice recommendations failed, using local recommend algorithm:', err);
      }
    }

    // Local simulation using identical recommend() engine
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
        if (score < lowest) {
          lowest = score;
          weakest = t;
        }
      }

      setWeakestTopic(weakest);
      setWeakestScore(lowest);

      const courseQuestions = INITIAL_QUESTIONS.filter(q => q.course_id === foundCourse.id);
      // Run TF-IDF similarity algorithm over course question text
      const recs = recommend(courseQuestions as any, weakest.id, weakest.name, lowest);
      setRecommendations(recs);
      setLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadPracticeData();
  }, [courseId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/student')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Dashboard
        </button>
        <Link
          href={`/student/course/${courseId}/quiz`}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition shadow-xs"
        >
          <Brain className="h-3.5 w-3.5 mr-1.5" />
          Start 5-Question Quiz
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </div>

      {/* Weakest Topic Header Card (Refined Academic Navy / Slate Style) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 uppercase tracking-wide">
              <Flame className="h-3.5 w-3.5 text-rose-600" />
              Target Remediation Topic
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Weakest Topic: {weakestTopic?.name || 'Loading Topic...'}
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Course: <strong>{course?.title || 'Computer Science Core'}</strong> ({course?.code || 'CSE-401'}).
              Recommendations are dynamically ranked using token similarity from <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">lib/recommend.ts</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0 min-w-[140px]">
            <div className="text-[11px] uppercase font-bold text-slate-500">Current Trust</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {(weakestScore * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">EMA: {weakestScore.toFixed(3)}</div>
          </div>
        </div>
      </div>

      {/* Recommendations List: Practice These Next */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">Practice These Next</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Sorted by relevance &amp; difficulty affinity
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <RefreshCw className="h-8 w-8 text-blue-700 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Computing similarity matrix over question texts...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No practice recommendations found for this course.
          </div>
        ) : (
          recommendations.map((rec, index) => {
            const q = rec.question;
            const isExpanded = expandedQuestionId === q.id;
            const rankBadge = index === 0 ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition space-y-3"
              >
                {/* Recommendation Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${rankBadge}`}>
                      Priority #{index + 1}
                    </span>
                    <span className="text-xs text-slate-500">
                      Relevance Match: <strong className="text-slate-800">{(rec.score * 100).toFixed(0)}%</strong>
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                    Difficulty: {q.difficulty.toFixed(2)}
                  </span>
                </div>

                {/* Reason Banner */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-700 shrink-0 mt-0.5" />
                  <span>{rec.reason}</span>
                </div>

                {/* Question Text */}
                <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                  {q.question_text}
                </h3>

                {/* Expand Options / Review Solution */}
                <div className="pt-1">
                  <button
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="inline-flex items-center text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                  >
                    <HelpCircle className="h-3.5 w-3.5 mr-1" />
                    {isExpanded ? 'Hide Options & Explanation' : 'Inspect Practice Options & Explanation'}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="text-xs font-semibold text-slate-700">Multiple Choice Options:</div>
                      <div className="space-y-1.5">
                        {Array.isArray(q.options) &&
                          q.options.map((opt: string, optIdx: number) => {
                            const isCorrect = q.correct_answer === opt;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Correct Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {q.explanation && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs text-slate-600">
                          <strong className="text-slate-800">Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
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
