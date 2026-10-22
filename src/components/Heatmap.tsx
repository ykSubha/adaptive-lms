'use client';

import React from 'react';
import { Topic, CognitiveProfile } from '@/lib/types';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface HeatmapProps {
  topics: Topic[];
  cognitiveProfiles: CognitiveProfile[];
}

export default function Heatmap({ topics, cognitiveProfiles }: HeatmapProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No topics configured for this course yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {topics.map(topic => {
        const cp = cognitiveProfiles.find(p => p.topic_id === topic.id);
        const trust = cp ? cp.trust_score : 0.500;
        const attempts = cp ? cp.attempt_count : 0;
        const trustPct = Math.round(trust * 100);

        // Green / Yellow / Red thresholding
        let cardBg = 'bg-rose-50/50 border-rose-200 text-rose-950';
        let barColor = 'bg-rose-500';
        let badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
        let statusLabel = 'Weakest';
        let Icon = AlertCircle;

        if (trust >= 0.70) {
          cardBg = 'bg-[#edf5ee] border-[#c8dec9] text-[#1e3d2c]';
          barColor = 'bg-[#3d6b52]';
          badgeColor = 'bg-[#deecdf] text-[#234832] border-[#b6d6b8]';
          statusLabel = 'Mastered';
          Icon = CheckCircle2;
        } else if (trust >= 0.40) {
          cardBg = 'bg-amber-50/50 border-amber-200 text-amber-950';
          barColor = 'bg-amber-500';
          badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
          statusLabel = 'Developing';
          Icon = Clock;
        }

        return (
          <div
            key={topic.id}
            className={`p-4 rounded-xl border transition flex flex-col justify-between shadow-2xs ${cardBg}`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeColor}`}>
                  {statusLabel}
                </span>
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
              </div>
              <h4 className="text-xs font-bold line-clamp-1">{topic.name}</h4>
              <p className="text-[11px] opacity-75 mt-0.5">
                {attempts} completed question{attempts === 1 ? '' : 's'}
              </p>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Trust Score</span>
                <span>{trust.toFixed(3)} ({trustPct}%)</span>
              </div>
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${trustPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
