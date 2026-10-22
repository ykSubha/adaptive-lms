'use client';

import React from 'react';
import { ProctorFlagType } from '@/lib/types';
import { ShieldCheck, AlertTriangle, Eye } from 'lucide-react';

interface ProctorBannerProps {
  activeFlag?: ProctorFlagType | null;
  eventCount?: number;
}

export default function ProctorBanner({ activeFlag, eventCount = 0 }: ProctorBannerProps) {
  const hasFlags = eventCount > 0;

  const flagDescription: Record<ProctorFlagType, string> = {
    tab_switch: 'Tab switch detected · Confidence: 85%',
    focus_loss: 'Window focus lost · Confidence: 60%',
    mobile_detected: 'Mobile device detected in camera · Confidence: 94%',
    eye_diversion: 'Gaze deviation / eye diversion detected · Confidence: 82%',
    multiple_faces: 'Multiple persons detected in camera · Confidence: 95%',
    face_missing: 'Face not detected in camera frame · Confidence: 88%',
  };

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all ${
        hasFlags
          ? 'border-amber-200 bg-amber-50/70'
          : 'border-[#dbe7dc] bg-[#f4f7f4]'
      }`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasFlags ? 'bg-amber-500' : 'bg-[#4a7c59]'}`} />

      <div className="flex items-start gap-3 p-4 pl-5">
        {/* Icon */}
        <div
          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            hasFlags ? 'bg-amber-100 text-amber-800' : 'bg-[#e4efe5] text-[#2e5a44]'
          }`}
        >
          {hasFlags ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs font-bold ${hasFlags ? 'text-amber-900' : 'text-[#2e5a44]'}`}>
                Session Proctoring Active
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#dbe7dc] text-[#3a5a40]">
                Institutional Compliance
              </span>
            </div>
            {hasFlags && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {eventCount} {eventCount === 1 ? 'flag' : 'flags'} logged
              </span>
            )}
          </div>

          <p className={`text-[11px] mt-1 leading-relaxed ${hasFlags ? 'text-amber-800' : 'text-slate-600'}`}>
            Tab switching, window blur, and visual camera proctoring are monitored for instructor audit. Keep this window active during the assessment.{' '}
            <span className="font-semibold text-slate-700">You will never be auto-failed.</span>
          </p>

          {activeFlag && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300">
              <Eye className="h-3.5 w-3.5 text-amber-800" />
              <span>{flagDescription[activeFlag] || 'Event recorded'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
