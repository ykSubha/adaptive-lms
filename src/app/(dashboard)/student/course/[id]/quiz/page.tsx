'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { createClient } from '@/lib/supabase/client';
import { useProctoring } from '@/lib/proctor';
import ProctorBanner from '@/components/ProctorBanner';
import ProctorCamera from '@/components/ProctorCamera';
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
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Award,
  Check,
  RotateCcw,
  Target,
} from 'lucide-react';

interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  updated_trust_score: number;
  topic_id: string;
  previous_trust_score?: number;
}

interface AnswerHistoryItem {
  questionNumber: number;
  questionText: string;
  topicName: string;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  explanation: string;
}

const TOTAL_QUIZ_QUESTIONS = 5; // Standard 5-question focused adaptive assessment

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
  const [courseTitle, setCourseTitle] = useState('Course Assessment');
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Quiz Session State (5 questions per session)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [sessionHistory, setSessionHistory] = useState<AnswerHistoryItem[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Proctoring client running during the entire quiz session
  const proctor = useProctoring({
    courseId,
    studentId: profile?.id,
    tenantId: tenant?.id || profile?.tenant_id || undefined,
    enabled: !isQuizCompleted,
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
    if (!result && question && !isQuizCompleted) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [question, result, isQuizCompleted]);

  // Load next question
  const loadNextQuestion = async (excludedQuestionIds: string[] = answeredIds) => {
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

    // Local adaptive engine simulation (targets weakest topic, avoids recently answered)
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
      const topicName = topicObj ? topicObj.name : 'Computer Science Foundations';
      const currentTrust = weakestProfile ? weakestProfile.trust_score : 0.500;

      // Filter unasked questions in this topic
      let candidateQuestions = INITIAL_QUESTIONS.filter(
        q => q.topic_id === weakestTopicId && q.course_id === courseId && !excludedQuestionIds.includes(q.id)
      );

      // If all questions in weakest topic were answered, look across other topics
      if (candidateQuestions.length === 0) {
        candidateQuestions = INITIAL_QUESTIONS.filter(
          q => q.course_id === courseId && !excludedQuestionIds.includes(q.id)
        );
      }

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
    }, 200);
  };

  useEffect(() => {
    loadNextQuestion([]);
  }, [courseId]);

  // Submit answer
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
          const res = data as AnswerResult;
          setResult(res);
          if (res.is_correct) setCorrectCount(prev => prev + 1);

          setSessionHistory(prev => [
            ...prev,
            {
              questionNumber: currentQuestionIndex,
              questionText: question.question_text,
              topicName: question.topic_name || 'CSE Core',
              selectedOption,
              correctAnswer: res.correct_answer,
              isCorrect: res.is_correct,
              responseTimeMs: responseMs,
              explanation: res.explanation,
            },
          ]);

          setAnsweredIds(prev => [...prev, question.id]);
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        console.warn('Live submit_answer RPC failed, using local adaptive calculation:', err);
      }
    }

    // Local EMA calculation
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

      if (isCorrect) setCorrectCount(prev => prev + 1);

      setSessionHistory(prev => [
        ...prev,
        {
          questionNumber: currentQuestionIndex,
          questionText: question.question_text,
          topicName: question.topic_name || 'CSE Core',
          selectedOption,
          correctAnswer: question.correct_answer || '',
          isCorrect,
          responseTimeMs: responseMs,
          explanation: question.explanation || '',
        },
      ]);

      setAnsweredIds(prev => [...prev, question.id]);

      setResult({
        is_correct: isCorrect,
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || 'No explanation provided.',
        updated_trust_score: updatedTrust,
        previous_trust_score: oldTrust,
        topic_id: question.topic_id,
      });
      setSubmitting(false);
    }, 250);
  };

  const handleNextClick = () => {
    if (currentQuestionIndex >= TOTAL_QUIZ_QUESTIONS) {
      setIsQuizCompleted(true);
    } else {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      loadNextQuestion([...answeredIds, question?.id || '']);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(1);
    setCorrectCount(0);
    setAnsweredIds([]);
    setSessionHistory([]);
    setIsQuizCompleted(false);
    loadNextQuestion([]);
  };

  // --- QUIZ COMPLETION SUMMARY SCREEN ---
  if (isQuizCompleted) {
    const accuracyPct = Math.round((correctCount / TOTAL_QUIZ_QUESTIONS) * 100);
    const avgResponseTimeMs = sessionHistory.length > 0
      ? Math.round(sessionHistory.reduce((acc, h) => acc + h.responseTimeMs, 0) / sessionHistory.length)
      : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/student')}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Course Dashboard
          </button>
        </div>

        {/* Completion Card */}
        <div className="bg-white rounded-2xl border border-[#dbe7dc] p-8 shadow-xs text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ee] text-[#2e5a44] border border-[#c8dec9]">
            <Award className="h-9 w-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#254d37] bg-[#edf4ee] border border-[#c8dec9] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Check className="h-3.5 w-3.5" />
              Assessment Session Completed
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Quiz Results & Performance Diagnostics
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Your cognitive profile has been updated via exponential moving average (EMA) based on your {TOTAL_QUIZ_QUESTIONS}-question response session.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-medium text-slate-500">Final Score</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {correctCount} / {TOTAL_QUIZ_QUESTIONS}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{accuracyPct}% accuracy</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-medium text-slate-500">Average Speed</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {(avgResponseTimeMs / 1000).toFixed(1)}s
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{avgResponseTimeMs} ms response time</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-medium text-slate-500">Proctoring Audit</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {proctor.eventCount === 0 ? 'Clean' : `${proctor.eventCount} Flags`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {proctor.eventCount === 0 ? 'No tab switches detected' : 'Logged for instructor review'}
              </div>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="text-left border-t border-slate-100 pt-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Question Performance Summary</h3>
            <div className="space-y-2">
              {sessionHistory.map(item => (
                <div
                  key={item.questionNumber}
                  className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-4 ${
                    item.isCorrect
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/60 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">Q{item.questionNumber}.</span>
                      <span className="font-semibold text-slate-900">{item.questionText}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Topic: <strong>{item.topicName}</strong> • Your answer: <span className={item.isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>{item.selectedOption}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {(item.responseTimeMs / 1000).toFixed(1)}s
                    </span>
                    {item.isCorrect ? (
                      <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-rose-100 text-rose-700">
                        <XCircle className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restartQuiz}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Retake 5-Question Assessment
            </button>
            <Link
              href={`/student/course/${courseId}/practice`}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2e5a44] hover:bg-[#254937] transition shadow-sm"
            >
              <Target className="h-4 w-4 mr-1.5" />
              Practice Weakest Topic
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ QUESTION SCREEN ---
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Navigation and Question Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => router.push('/student')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Dashboard
        </button>

        {/* Question Counter & Timer */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-[#dbe7dc] text-slate-700 shadow-xs">
            Question <strong className="text-[#2e5a44]">{currentQuestionIndex}</strong> of {TOTAL_QUIZ_QUESTIONS}
          </div>
          <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#dbe7dc] text-slate-700 shadow-xs">
            <Timer className="h-3.5 w-3.5 text-[#2e5a44]" />
            <span>Time: <strong className="text-slate-900">{elapsedSeconds}s</strong></span>
          </div>
        </div>
      </div>

      {/* Progress Bar (e.g. Question 1/5 = 20%) */}
      <div className="w-full bg-[#e2ede3] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#2e5a44] h-full transition-all duration-300"
          style={{ width: `${(currentQuestionIndex / TOTAL_QUIZ_QUESTIONS) * 100}%` }}
        />
      </div>

      {/* Proctoring Notice Banner */}
      <ProctorBanner
        activeFlag={proctor.activeFlag}
        eventCount={proctor.eventCount}
      />

      {/* Grid: Quiz Card (Left) + Proctoring Camera (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Quiz Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#dbe7dc] shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-[#e2ede3] flex flex-wrap items-center justify-between gap-3 bg-[#f7faf7]">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{courseTitle}</h2>
              <p className="text-xs text-slate-500">Curriculum Topic Assessment</p>
            </div>
            {question && (
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-[#edf4ee] text-[#254d37] border border-[#c8dec9]">
                  {question.topic_name || 'CSE Core'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Difficulty: {question.difficulty.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-6 md:p-8 space-y-6">
            {loadingQuestion ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-[#2e5a44] animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-600">Loading next question from curriculum bank...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={() => loadNextQuestion()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : question ? (
              <>
                {/* Syllabus Alignment Context Panel */}
                {question.why && (
                  <div className="p-4 rounded-xl bg-[#f4f7f4] border border-[#dbe7dc] flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-[#e2ede4] text-[#2e5a44] shrink-0 mt-0.5">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#2e5a44] uppercase tracking-wider">
                        Syllabus Alignment & Diagnostic Focus
                      </h4>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {question.why}
                      </p>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {question.question_text}
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {Array.isArray(question.options) &&
                    question.options.map((opt: string, idx: number) => {
                      const isSelected = selectedOption === opt;
                      const isAnswered = result !== null;
                      const isCorrectOption = result?.correct_answer === opt;
                      const isSelectedWrong = isAnswered && isSelected && !result?.is_correct;

                      let optionClasses = 'border-slate-200 hover:border-[#3d6b52] hover:bg-[#f7faf7] text-slate-800';

                      if (isSelected && !isAnswered) {
                        optionClasses = 'border-[#2e5a44] bg-[#edf4ee] ring-2 ring-[#2e5a44]/20 text-[#1e3d2e] font-medium';
                      } else if (isAnswered) {
                        if (isCorrectOption) {
                          optionClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20';
                        } else if (isSelectedWrong) {
                          optionClasses = 'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/20';
                        } else {
                          optionClasses = 'opacity-50 border-slate-200 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswered || submitting}
                          onClick={() => setSelectedOption(opt)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between ${optionClasses}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-md border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 bg-white">
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
                    className={`p-4 rounded-xl border transition-all ${
                      result.is_correct
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {result.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2.5">
                        <div>
                          <h4
                            className={`text-xs font-bold ${
                              result.is_correct ? 'text-emerald-900' : 'text-rose-900'
                            }`}
                          >
                            {result.is_correct ? 'Correct Answer' : 'Incorrect Answer'}
                          </h4>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                            {result.explanation}
                          </p>
                        </div>

                        {/* Exponential Moving Average Trust Score Card */}
                        <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`p-1 rounded ${
                                result.is_correct
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {result.is_correct ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">
                                Topic Trust Score (EMA)
                              </span>
                              <span className="text-[11px] text-slate-500 ml-1.5">
                                {result.is_correct
                                  ? 'Mastery increased'
                                  : 'Score adjusted (adapting difficulty)'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {result.previous_trust_score !== undefined && (
                              <span className="text-slate-400 line-through">
                                {result.previous_trust_score.toFixed(3)}
                              </span>
                            )}
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span
                              className={`font-bold px-2 py-0.5 rounded ${
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
                      className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2e5a44] hover:bg-[#254937] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e5a44] disabled:opacity-50 transition shadow-xs"
                    >
                      {submitting ? 'Submitting...' : 'Submit Answer'}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextClick}
                      className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition shadow-xs"
                    >
                      {currentQuestionIndex >= TOTAL_QUIZ_QUESTIONS ? 'Finish Assessment' : 'Next Question'}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Right Column: Online Camera Proctoring */}
        <div className="space-y-4">
          <ProctorCamera
            onFlag={proctor.logEvent}
            eventCount={proctor.eventCount}
          />

          <div className="bg-[#f4f7f4] rounded-2xl border border-[#dbe7dc] p-4 text-xs space-y-2 text-[#2e5a44]">
            <div className="font-bold uppercase tracking-wider text-[10px] text-[#254d37]">Exam Proctoring Protocols</div>
            <ul className="text-[11px] leading-relaxed text-slate-600 space-y-1 list-disc list-inside">
              <li>Keep full face centered in frame</li>
              <li>Unauthorized devices (phones) trigger flags</li>
              <li>Eye diversion / gaze shifts are audited</li>
              <li>Zero automated failures — instructor reviewed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
