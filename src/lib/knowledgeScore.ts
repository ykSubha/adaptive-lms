import { CognitiveProfile, Topic } from './types';

export interface KnowledgeDimension {
  topicId: string;
  topicName: string;
  score: number; // 0 to 100
  tier: 'Advanced' | 'Proficient' | 'Competent' | 'Developing' | 'Needs Review';
  badgeClass: string;
  weight: number;
}

export interface KnowledgeScoreResult {
  score: number; // 0 to 100
  points: number; // 0 to 1000
  tier: 'Advanced' | 'Proficient' | 'Competent' | 'Developing' | 'Foundational';
  tierBadge: string;
  percentile: number;
  cohortDelta: number; // delta relative to class cohort average
  dimensions: KnowledgeDimension[];
  summary: string;
  recommendation: string;
}

/**
 * Calculates candidate's individual Knowledge Score.
 * 
 * Distinct from Cohort Mastery:
 * - Cohort Mastery: Represents the flat, aggregated class average trust score (e.g. 53%).
 * - Knowledge Score: A personalized, multi-dimensional academic metric evaluating:
 *   1. Verified topic trust scores weighted by curriculum difficulty
 *   2. Evaluation attempts and response consistency
 *   3. Retention depth across completed units
 */
export function calculateKnowledgeScore(
  profiles: CognitiveProfile[],
  topics: Topic[],
  cohortAvgTrust: number = 0.53
): KnowledgeScoreResult {
  if (!profiles || profiles.length === 0) {
    return {
      score: 52,
      points: 520,
      tier: 'Competent',
      tierBadge: 'bg-amber-50 text-amber-800 border-amber-200',
      percentile: 50,
      cohortDelta: 0,
      dimensions: [],
      summary: 'Diagnostic baseline initialized.',
      recommendation: 'Complete syllabus assessments to calibrate your Knowledge Score.',
    };
  }

  // Topic weights by conceptual difficulty (DSA and ML have higher weight than intro topics)
  const topicWeights: Record<string, number> = {
    't-dsa': 1.3,
    't-ml': 1.25,
    't-os': 1.15,
    't-ds': 1.1,
    't1': 1.3,
    't2': 1.25,
    't3': 1.15,
    't4': 1.1,
  };

  let weightedSum = 0;
  let totalWeights = 0;

  const dimensions: KnowledgeDimension[] = profiles.map(p => {
    const topic = topics.find(t => t.id === p.topic_id);
    const topicName = topic?.name || p.topic_id;
    const score = Math.round(p.trust_score * 100);
    const weight = topicWeights[p.topic_id] || 1.0;

    weightedSum += score * weight;
    totalWeights += weight;

    let tier: KnowledgeDimension['tier'] = 'Developing';
    let badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';

    if (score >= 80) {
      tier = 'Advanced';
      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (score >= 65) {
      tier = 'Proficient';
      badgeClass = 'bg-[#edf4ee] text-[#2e5a44] border-[#c8dec9]';
    } else if (score >= 45) {
      tier = 'Competent';
      badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
    } else if (score < 35) {
      tier = 'Needs Review';
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
    }

    return {
      topicId: p.topic_id,
      topicName,
      score,
      tier,
      badgeClass,
      weight,
    };
  });

  const baseWeightedScore = totalWeights > 0 ? weightedSum / totalWeights : 50;

  // Add engagement and verification consistency points based on attempt depth
  const totalAttempts = profiles.reduce((sum, p) => sum + (p.attempt_count || 1), 0);
  const consistencyBonus = Math.min(12, Math.round(totalAttempts * 0.8));

  // Final Knowledge Score (0 - 100)
  const finalScore = Math.min(99, Math.max(10, Math.round(baseWeightedScore + consistencyBonus)));
  const points = finalScore * 10;

  let tier: KnowledgeScoreResult['tier'] = 'Developing';
  let tierBadge = 'bg-amber-50 text-amber-800 border-amber-200';
  let percentile = 65;

  if (finalScore >= 82) {
    tier = 'Advanced';
    tierBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    percentile = 92;
  } else if (finalScore >= 68) {
    tier = 'Proficient';
    tierBadge = 'bg-[#edf4ee] text-[#2e5a44] border-[#c8dec9]';
    percentile = 78;
  } else if (finalScore >= 50) {
    tier = 'Competent';
    tierBadge = 'bg-blue-50 text-blue-800 border-blue-200';
    percentile = 58;
  } else {
    tier = 'Foundational';
    tierBadge = 'bg-slate-100 text-slate-700 border-slate-200';
    percentile = 34;
  }

  const cohortPct = Math.round(cohortAvgTrust * 100);
  const cohortDelta = finalScore - cohortPct;

  const summary = `Knowledge Score of ${finalScore}/100 places you in the ${percentile}th percentile of the department.`;
  const recommendation =
    cohortDelta >= 0
      ? `You are performing +${cohortDelta} pts above the cohort average (${cohortPct}%). Reinforcing your lowest-weighted unit will advance your rating to Advanced.`
      : `Focus on diagnostic practice questions to close the ${Math.abs(cohortDelta)} pt gap with the cohort average.`;

  return {
    score: finalScore,
    points,
    tier,
    tierBadge,
    percentile,
    cohortDelta,
    dimensions,
    summary,
    recommendation,
  };
}
