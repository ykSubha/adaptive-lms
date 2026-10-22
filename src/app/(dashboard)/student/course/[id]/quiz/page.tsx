'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { useProctoring } from '@/lib/proctor';
import ProctorBanner from '@/components/ProctorBanner';
import { Question } from '@/lib/types';
import {
  INITIAL_COURSES,
  INITIAL_TOPICS,
  INITIAL_QUESTIONS,
  INITIAL_COGNITIVE_PROFILES,
} from '@/lib/mockData';
import {
  Brain,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  updated_trust_score: number;
  topic_id: string;
  previous_trust_score?: number;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function StudentQuizPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const router = useRouter();
  const { profile, tenant } = useAuth();

  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [courseTitle, setCourseTitle] = useState('Course Quiz');
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const proctor = useProctoring({
    courseId,
    studentId: profile?.id,
    tenantId: tenant?.id || profile?.tenant_id || undefined,
    enabled: true,
  });

  useEffect(() => {
    const course = INITIAL_COURSES.find(c => c.id === courseId);
    if (course) setCourseTitle(course.title);
  }, [courseId]);

  useEffect(() => {
    if (!result && question) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [question, result]);

  const loadNextQuestion = async () => {
    setLoadingQuestion(true);
    setSelectedOption(null);
    setResult(null);
    setError(null);

    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive) {
      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('next_question', { p_course_id: courseId });
        if (rpcError) throw rpcError;
        if (data && !data.error) {
          setQuestion(data as Question);
          setLoadingQuestion(false);
          return;
        }
      } catch (err: any) {
        console.warn('Live next_question RPC failed, using local fallback:', err);
      }
    }

    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      const studentProfiles = INITIAL_COGNITIVE_PROFILES.filter(
        cp => cp.student_id === studentId && cp.course_id === courseId
      ).sort((a, b) => a.trust_score - b.trust_score);

      const weakestProfile = studentProfiles[0];
      const weakestTopicId = weakestProfile
        ? weakestProfile.topic_id
        : INITIAL_TOPICS.find(t => t.course_id === courseId)?.id;

      const topicObj = INITIAL_TOPICS.find(t => t.id === weakestTopicId);
      const topicName = topicObj ? topicObj.name : 'Foundations';
      const currentTrust = weakestProfile ? weakestProfile.trust_score : 0.500;

      const candidateQuestions = INITIAL_QUESTIONS.filter(
        q => q.topic_id === weakestTopicId && q.course_id === courseId
      );

      const pickedQuestion = candidateQuestions.length > 0
        ? candidateQuestions[Math.floor(Math.random() * candidateQuestions.length)]
        : INITIAL_QUESTIONS.find(q => q.course_id === courseId) || INITIAL_QUESTIONS[0];

      const why = `Targeting your weakest topic "${topicName}" (trust: ${currentTrust.toFixed(2)}). Calibrated at difficulty ${pickedQuestion.difficulty.toFixed(2)}.`;

      setQuestion({ ...pickedQuestion, topic_name: topicName, why });
      setLoadingQuestion(false);
    }, 300);
  };

  useEffect(() => { loadNextQuestion(); }, [courseId]);

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !question) return;
    setSubmitting(true);
    const responseMs = Date.now() - startTimeRef.current;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive) {
      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('submit_answer', {
          p_question_id: question.id,
          p_selected: selectedOption,
          p_response_ms: responseMs,
        });
        if (rpcError) throw rpcError;
        if (data) {
          setResult(data as AnswerResult);
          setQuestionCount(q => q + 1);
          if ((data as AnswerResult).is_correct) setCorrectCount(c => c + 1);
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        console.warn('Live submit_answer RPC failed, using local fallback:', err);
      }
    }

    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      const isCorrect = selectedOption.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase();
      const scoreVal = isCorrect ? 1.0 : 0.0;
      const alpha = 0.35;

      let existingProfile = INITIAL_COGNITIVE_PROFILES.find(
        cp => cp.student_id === studentId && cp.topic_id === question.topic_id
      );

      const oldTrust = existingProfile ? existingProfile.trust_score : 0.500;
      const updatedTrust = Number(Math.max(0.05, Math.min(0.99, alpha * scoreVal + (1 - alpha) * oldTrust)).toFixed(3));

      if (existingProfile) {
        existingProfile.trust_score = updatedTrust;
        existingProfile.attempt_count += 1;
        existingProfile.last_updated = new Date().toISOString();
      } else {
        INITIAL_COGNITIVE_PROFILES.push({
          id: 'cp-' + Date.now(),
          student_id: studentId,
          course_id: courseId,
          topic_id: question.topic_id,
          trust_score: updatedTrust,
          attempt_count: 1,
          last_updated: new Date().toISOString(),
        });
      }

      const res: AnswerResult = {
        is_correct: isCorrect,
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || 'No explanation provided.',
        updated_trust_score: updatedTrust,
        previous_trust_score: oldTrust,
        topic_id: question.topic_id,
      };

      setResult(res);
      setQuestionCount(q => q + 1);
      if (isCorrect) setCorrectCount(c => c + 1);
      setSubmitting(false);
    }, 350);
  };

  // Timer color based on elapsed time
  const timerColor = elapsedSeconds > 60 ? 'text-rose-600' : elapsedSeconds > 30 ? 'text-amber-600' : 'text-indigo-600';

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="animate-fade-in-up flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/student')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          {/* Session score */}
          {questionCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>{correctCount}/{questionCount} correct</span>
            </div>
          )}
          {/* Timer */}
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 ${timerColor} transition-colors`}>
            <Timer className="h-3.5 w-3.5" />
            <span>{elapsedSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Proctor Banner */}
      <ProctorBanner activeFlag={proctor.activeFlag} eventCount={proctor.eventCount} />

      {/* Quiz Card */}
      <div className="animate-fade-in-up bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{courseTitle}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Adaptive Assessment Engine · EMA Trust Scoring</p>
          </div>
          {question && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {question.topic_name || 'Adaptive Topic'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Diff: {question.difficulty?.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-5">
          {loadingQuestion ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-flex">
                <Brain className="h-10 w-10 text-indigo-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">Calibrating next question based on cognitive profile...</p>
            </div>
          ) : error ? (
            <div className="p-5 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
              <p className="font-semibold text-sm">{error}</p>
              <button onClick={loadNextQuestion} className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold">
                Retry
              </button>
            </div>
          ) : question ? (
            <>
              {/* Why this question */}
              {question.why && (
                <div className="animate-fade-in-up p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50/60 border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
                        <Sparkles className="h-3 w-3" />
                        Why this question?
                      </div>
                      <p className="text-xs text-indigo-900 leading-relaxed">{question.why}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Question text */}
              <div className="animate-fade-in-up">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                  {question.question_text}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5 stagger-children">
                {Array.isArray(question.options) &&
                  question.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === opt;
                    const isAnswered = result !== null;
                    const isCorrectOption = result?.correct_answer === opt;
                    const isSelectedWrong = isAnswered && isSelected && !result?.is_correct;

                    let cls = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 bg-white';
                    let labelCls = 'bg-slate-100 text-slate-600 border-slate-200';

                    if (isSelected && !isAnswered) {
                      cls = 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20';
                      labelCls = 'bg-indigo-600 text-white border-indigo-600';
                    } else if (isAnswered) {
                      if (isCorrectOption) {
                        cls = 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/20';
                        labelCls = 'bg-emerald-500 text-white border-emerald-500';
                      } else if (isSelectedWrong) {
                        cls = 'border-rose-400 bg-rose-50 ring-2 ring-rose-400/20';
                        labelCls = 'bg-rose-500 text-white border-rose-500';
                      } else {
                        cls = 'opacity-50 border-slate-200 bg-white';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswered || submitting}
                        onClick={() => setSelectedOption(opt)}
                        className={`animate-fade-in-up w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center gap-3 ${cls}`}
                      >
                        <span className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${labelCls}`}>
                          {OPTION_LABELS[idx]}
                        </span>
                        <span className="flex-1 text-slate-800 font-medium">{opt}</span>
                        {isAnswered && isCorrectOption && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        )}
                        {isSelectedWrong && (
                          <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Result feedback */}
              {result && (
                <div
                  className={`animate-scale-in p-5 rounded-2xl border ${
                    result.is_correct
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                      : 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.is_correct ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className={`text-sm font-bold ${result.is_correct ? 'text-emerald-900' : 'text-rose-900'}`}>
                          {result.is_correct ? '✓ Correct!' : '✗ Incorrect'}
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">{result.explanation}</p>
                      </div>

                      {/* EMA Trust Score update */}
                      <div className="p-3.5 rounded-xl bg-white/80 border border-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${result.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {result.is_correct ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">Topic Trust Score (EMA)</div>
                            <div className="text-[10px] text-slate-500">
                              {result.is_correct ? 'Reinforced via exponential moving average' : 'Trust lowered; difficulty will adapt'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.previous_trust_score !== undefined && (
                            <span className="text-sm text-slate-400 line-through font-mono">
                              {result.previous_trust_score.toFixed(3)}
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg font-mono ${
                            result.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {result.updated_trust_score.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-1 flex items-center justify-end gap-2.5">
                {!result ? (
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm shadow-indigo-200"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>Submit Answer <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={loadNextQuestion}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm"
                  >
                    Next Question <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
