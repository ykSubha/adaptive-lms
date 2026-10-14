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
  HelpCircle,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  updated_trust_score: number;
  topic_id: string;
  previous_trust_score?: number;
}

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

  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Proctoring client running during the entire quiz session
  const proctor = useProctoring({
    courseId,
    studentId: profile?.id,
    tenantId: tenant?.id || profile?.tenant_id || undefined,
    enabled: true,
  });

  // Fetch course metadata
  useEffect(() => {
    const course = INITIAL_COURSES.find(c => c.id === courseId);
    if (course) {
      setCourseTitle(course.title);
    }
  }, [courseId]);

  // High precision question timer
  useEffect(() => {
    if (!result && question) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [question, result]);

  // Load next question via supabase.rpc("next_question", { p_course_id })
  const loadNextQuestion = async () => {
    setLoadingQuestion(true);
    setSelectedOption(null);
    setResult(null);
    setError(null);

    const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isLive) {
      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('next_question', {
          p_course_id: courseId,
        });

        if (rpcError) throw rpcError;
        if (data && !data.error) {
          setQuestion(data as Question);
          setLoadingQuestion(false);
          return;
        }
      } catch (err: any) {
        console.warn('Live next_question RPC failed, using local adaptive engine fallback:', err);
      }
    }

    // Local adaptive engine simulation (identical algorithm to schema.sql)
    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      // Find weakest topic for this student & course
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

      // Filter questions in this topic targeting difficulty
      const candidateQuestions = INITIAL_QUESTIONS.filter(
        q => q.topic_id === weakestTopicId && q.course_id === courseId
      );

      const pickedQuestion = candidateQuestions.length > 0
        ? candidateQuestions[Math.floor(Math.random() * candidateQuestions.length)]
        : INITIAL_QUESTIONS.find(q => q.course_id === courseId) || INITIAL_QUESTIONS[0];

      const why = `Selected based on your mastery in topic "${topicName}" (current trust score: ${currentTrust.toFixed(2)}). Calibrated at difficulty ${pickedQuestion.difficulty.toFixed(2)} to adapt to your learning curve.`;

      setQuestion({
        ...pickedQuestion,
        topic_name: topicName,
        why,
      });
      setLoadingQuestion(false);
    }, 300);
  };

  useEffect(() => {
    loadNextQuestion();
  }, [courseId]);

  // Submit answer via supabase.rpc("submit_answer", { p_question_id, p_selected, p_response_ms })
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
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        console.warn('Live submit_answer RPC failed, using local adaptive calculation:', err);
      }
    }

    // Local EMA calculation (identical to schema.sql)
    setTimeout(() => {
      const studentId = profile?.id || '33333333-3333-3333-3333-333333333331';
      const isCorrect = selectedOption.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase();
      const scoreVal = isCorrect ? 1.0 : 0.0;
      const alpha = 0.35; // Smoothing factor

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

      setResult({
        is_correct: isCorrect,
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || 'No explanation provided.',
        updated_trust_score: updatedTrust,
        previous_trust_score: oldTrust,
        topic_id: question.topic_id,
      });
      setSubmitting(false);
    }, 350);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/student')}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Dashboard
        </button>
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Timer className="h-4 w-4 text-indigo-600" />
          <span>Timer: <strong className="text-slate-900 font-semibold">{elapsedSeconds}s</strong></span>
        </div>
      </div>

      {/* Proctoring Notice Banner */}
      <ProctorBanner
        activeFlag={proctor.activeFlag}
        eventCount={proctor.eventCount}
      />

      {/* Quiz Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">{courseTitle}</h2>
            <p className="text-xs text-slate-500">Adaptive Assessment Engine</p>
          </div>
          {question && (
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {question.topic_name || 'Adaptive Topic'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
                Diff: {question.difficulty.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-6">
          {loadingQuestion ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600">Calibrating next question based on cognitive profile...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
              <p className="font-semibold">{error}</p>
              <button
                onClick={loadNextQuestion}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          ) : question ? (
            <>
              {/* "Why this question?" Panel */}
              {question.why && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start space-x-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-indigo-600" />
                      Why this question?
                    </h4>
                    <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                      {question.why}
                    </p>
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                  {question.question_text}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {Array.isArray(question.options) &&
                  question.options.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === opt;
                    const isAnswered = result !== null;
                    const isCorrectOption = result?.correct_answer === opt;
                    const isSelectedWrong = isAnswered && isSelected && !result?.is_correct;

                    let optionClasses = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50';

                    if (isSelected && !isAnswered) {
                      optionClasses = 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20';
                    } else if (isAnswered) {
                      if (isCorrectOption) {
                        optionClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20';
                      } else if (isSelectedWrong) {
                        optionClasses = 'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/20';
                      } else {
                        optionClasses = 'opacity-60 border-slate-200';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswered || submitting}
                        onClick={() => setSelectedOption(opt)}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition flex items-center justify-between ${optionClasses}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 bg-white">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isAnswered && isCorrectOption && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        )}
                        {isSelectedWrong && (
                          <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Feedback and Trust Score Update Panel */}
              {result && (
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    result.is_correct
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {result.is_correct ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4
                          className={`text-sm font-bold ${
                            result.is_correct ? 'text-emerald-900' : 'text-rose-900'
                          }`}
                        >
                          {result.is_correct ? 'Correct Answer!' : 'Incorrect'}
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                          {result.explanation}
                        </p>
                      </div>

                      {/* Exponential Moving Average Trust Score Card */}
                      <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              result.is_correct
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {result.is_correct ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              Topic Trust Score (EMA)
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {result.is_correct
                                ? 'Reinforced mastery via exponential moving average'
                                : 'Answering wrong lowers trust score; difficulty adapts'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {result.previous_trust_score !== undefined && (
                            <span className="text-xs text-slate-400 line-through">
                              {result.previous_trust_score.toFixed(3)}
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span
                            className={`text-sm font-extrabold px-2.5 py-0.5 rounded-md ${
                              result.is_correct
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {result.updated_trust_score.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                {!result ? (
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || submitting}
                    className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition shadow-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={loadNextQuestion}
                    className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition shadow-sm"
                  >
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
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
