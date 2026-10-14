'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from './supabase/client';
import { INITIAL_PROCTORING_EVENTS } from './mockData';

interface UseProctoringOptions {
  courseId: string;
  studentId?: string;
  tenantId?: string;
  enabled?: boolean;
}

interface ProctoringState {
  eventCount: number;
  lastEvent: string | null;
  activeFlag: 'tab_switch' | 'focus_loss' | null;
}

/**
 * useProctoring Hook
 *
 * Listens to document visibility changes and window blur/focus events.
 * Inserts events into proctoring_events without selecting or returning data (due to student RLS).
 * Debounces events to avoid duplicate flooding.
 */
export function useProctoring({
  courseId,
  studentId,
  tenantId,
  enabled = true,
}: UseProctoringOptions) {
  const [state, setState] = useState<ProctoringState>({
    eventCount: 0,
    lastEvent: null,
    activeFlag: null,
  });

  const lastLoggedRef = useRef<{ time: number; type: string }>({ time: 0, type: '' });
  const DEBOUNCE_MS = 2500;

  const logEvent = useCallback(
    async (flagType: 'tab_switch' | 'focus_loss', confidence: number, severity: 'low' | 'medium' | 'high') => {
      if (!enabled || !courseId) return;

      const now = Date.now();
      // Debounce identical or close events
      if (now - lastLoggedRef.current.time < DEBOUNCE_MS && lastLoggedRef.current.type === flagType) {
        return;
      }

      lastLoggedRef.current = { time: now, type: flagType };

      setState(prev => ({
        eventCount: prev.eventCount + 1,
        lastEvent: new Date().toLocaleTimeString(),
        activeFlag: flagType,
      }));

      // In-memory demo record for local instructor review
      const demoEvent = {
        id: 'flag-' + Math.random().toString(36).substring(2, 9),
        tenant_id: tenantId || '11111111-1111-1111-1111-111111111111',
        course_id: courseId,
        student_id: studentId || '33333333-3333-3333-3333-333333333331',
        flag_type: flagType,
        confidence,
        severity,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        student: { full_name: 'Alice Student', email: 'student@alpha.test' },
        course: { title: 'Data Structures & Algorithms', code: 'CS-201' },
      };
      INITIAL_PROCTORING_EVENTS.unshift(demoEvent);

      // Attempt live Supabase insert if credentials are provided
      const isLive = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
      if (isLive && studentId && tenantId) {
        try {
          const supabase = createClient();
          // IMPORTANT: Do NOT use .select() or RETURNING because student RLS only allows INSERT.
          await supabase.from('proctoring_events').insert({
            tenant_id: tenantId,
            course_id: courseId,
            student_id: studentId,
            flag_type: flagType,
            confidence,
            severity,
            status: 'pending',
          });
        } catch (err) {
          console.warn('Failed to insert proctoring event to Supabase:', err);
        }
      }
    },
    [courseId, studentId, tenantId, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logEvent('tab_switch', 0.85, 'high');
      }
    };

    const handleBlur = () => {
      logEvent('focus_loss', 0.60, 'medium');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, logEvent]);

  return {
    ...state,
    logEvent,
  };
}
