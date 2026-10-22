'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

interface ProctorBannerProps {
  activeFlag?: 'tab_switch' | 'focus_loss' | null;
  eventCount?: number;
}

export default function ProctorBanner({ activeFlag, eventCount = 0 }: ProctorBannerProps) {
  const hasFlags = eventCount > 0;

  return (
    <div className={`relative rounded-2xl border overflow-hidden animate-fade-in-up ${
      hasFlags
        ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
        : 'border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50/60'
    }`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasFlags ? 'bg-amber-400' : 'bg-emerald-500'}`} />

      <div className="flex items-start gap-3 p-4 pl-5">
        {/* Icon */}
        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
          hasFlags ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          <ShieldAlert className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs font-bold ${hasFlags ? 'text-amber-900' : 'text-slate-700'}`}>
                Continuous Proctoring Active
              </h4>
              {/* Live indicator */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            {hasFlags && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {eventCount} {eventCount === 1 ? 'flag' : 'flags'} logged
              </span>
            )}
          </div>

          <p className={`text-[11px] mt-1 leading-relaxed ${hasFlags ? 'text-amber-800' : 'text-slate-500'}`}>
            Tab switches are logged and reviewed by your instructor. Keep this window focused during your assessment.{' '}
            <span className="font-semibold">You will never be auto-failed.</span>
          </p>

          {activeFlag && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-200/70 text-amber-950 border border-amber-300 animate-scale-in">
              <Eye className="h-3.5 w-3.5" />
              <span>
                {activeFlag === 'tab_switch'
                  ? 'Tab switch detected · Confidence: 85%'
                  : 'Window focus lost · Confidence: 60%'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
