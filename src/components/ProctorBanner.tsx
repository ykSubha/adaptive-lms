'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

interface ProctorBannerProps {
  activeFlag?: 'tab_switch' | 'focus_loss' | null;
  eventCount?: number;
}

export default function ProctorBanner({ activeFlag, eventCount = 0 }: ProctorBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 mb-6 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-amber-900">
              Continuous Proctoring Session Active
            </h4>
            {eventCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                <AlertTriangle className="h-3 w-3" />
                {eventCount} {eventCount === 1 ? 'flag logged' : 'flags logged'}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-800 mt-1">
            Tab switches are logged and reviewed by your instructor. Please keep this browser window focused throughout your assessment. You will never be auto-failed.
          </p>

          {activeFlag && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-950 border border-amber-300">
              <Eye className="h-3.5 w-3.5" />
              <span>
                Recent event logged: {activeFlag === 'tab_switch' ? 'Tab switch detected (Confidence: 85%)' : 'Window focus lost (Confidence: 60%)'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
