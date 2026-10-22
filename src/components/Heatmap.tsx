'use client';

import React from 'react';
import { Topic, CognitiveProfile } from '@/lib/types';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
      {topics.map((topic, idx) => {
        const cp = cognitiveProfiles.find(p => p.topic_id === topic.id);
        const trust = cp ? cp.trust_score : 0.500;
        const attempts = cp ? cp.attempt_count : 0;
        const trustPct = Math.round(trust * 100);

        // Thresholds
        let bgGradient = 'from-rose-50 to-rose-50/60';
        let borderColor = 'border-rose-200';
        let barColor = 'bg-gradient-to-r from-rose-500 to-rose-400';
        let ringColor = 'ring-rose-200';
        let badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
        let statusLabel = 'Needs Work';
        let Icon = AlertCircle;
        let iconColor = 'text-rose-500';
        let TrendIcon = TrendingDown;
        let trendColor = 'text-rose-500';

        if (trust >= 0.70) {
          bgGradient = 'from-emerald-50 to-emerald-50/60';
          borderColor = 'border-emerald-200';
          barColor = 'bg-gradient-to-r from-emerald-500 to-emerald-400';
          ringColor = 'ring-emerald-200';
          badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          statusLabel = 'Mastered';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
          TrendIcon = TrendingUp;
          trendColor = 'text-emerald-500';
        } else if (trust >= 0.40) {
          bgGradient = 'from-amber-50 to-amber-50/60';
          borderColor = 'border-amber-200';
          barColor = 'bg-gradient-to-r from-amber-500 to-amber-400';
          ringColor = 'ring-amber-200';
          badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
          statusLabel = 'Developing';
          Icon = Clock;
          iconColor = 'text-amber-500';
          TrendIcon = Minus;
          trendColor = 'text-amber-500';
        }

        // SVG circle progress
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (trustPct / 100) * circumference;

        return (
          <div
            key={topic.id}
            className={`animate-fade-in-up relative p-4 rounded-2xl border bg-gradient-to-b ${bgGradient} ${borderColor} hover:shadow-md transition-all group overflow-hidden`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Subtle corner decoration */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 bg-current" />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}>
                {statusLabel}
              </span>
              <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
            </div>

            {/* Topic name */}
            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-1">{topic.name}</h4>
            <p className="text-[11px] text-slate-500 mb-4">
              {attempts === 0 ? 'No attempts yet' : `${attempts} question${attempts === 1 ? '' : 's'} completed`}
            </p>

            {/* Trust progress ring + bar */}
            <div className="flex items-center gap-3">
              {/* Mini ring */}
              <div className="relative shrink-0">
                <svg width="54" height="54" className="-rotate-90">
                  <circle cx="27" cy="27" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
                  <circle
                    cx="27" cy="27" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={`${iconColor} transition-all duration-700`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-800">{trustPct}%</span>
                </div>
              </div>

              {/* Score details */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-500 mb-1">Trust Score (EMA)</div>
                <div className="text-sm font-bold text-slate-900">{trust.toFixed(3)}</div>
                <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{trust >= 0.70 ? 'Strong' : trust >= 0.40 ? 'Average' : 'Below avg'}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} bar-animated`}
                style={{ width: `${trustPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
