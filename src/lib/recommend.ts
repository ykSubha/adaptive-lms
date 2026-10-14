/**
 * Topic Recommendation Engine for Adaptive Tenant LMS
 *
 * Implements lightweight text tokenization and TF-IDF / term-frequency cosine
 * similarity over question texts and topic keywords to recommend practice items
 * for the student's weakest topic without relying on external paid AI APIs.
 */

export interface QuestionItem {
  id: string;
  course_id: string;
  topic_id: string;
  question_text: string;
  options: string[] | any;
  correct_answer?: string;
  explanation?: string;
  difficulty: number;
}

export interface RecommendationResult {
  question: QuestionItem;
  score: number;
  reason: string;
}

// Common English stopwords to filter during tokenization
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'that', 'this',
  'these', 'those', 'it', 'its', 'as'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOPWORDS.has(token));
}

function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize
  tf.forEach((v, k) => {
    tf.set(k, v / tokens.length);
  });
  return tf;
}

/**
 * Recommends practice questions for a course's weakest topic.
 *
 * @param questions All questions belonging to the course
 * @param weakestTopicId The UUID of the topic with the lowest trust score
 * @param topicName Optional human-readable name of the topic
 * @param targetDifficulty Optional target difficulty calibrated to student mastery
 * @returns Sorted list of recommended questions with computed relevance score
 */
export function recommend(
  questions: QuestionItem[],
  weakestTopicId: string,
  topicName: string = '',
  targetDifficulty: number = 0.40
): RecommendationResult[] {
  if (!questions || questions.length === 0) {
    return [];
  }

  // 1. Separate questions into target topic questions and related course questions
  const topicQuestions = questions.filter(q => q.topic_id === weakestTopicId);

  // Build target topic corpus for similarity matching
  const topicTokens = tokenize(
    topicName + ' ' + topicQuestions.map(q => q.question_text).join(' ')
  );
  const topicTF = computeTF(topicTokens);

  const results: RecommendationResult[] = [];

  // Evaluate candidate questions
  for (const q of questions) {
    const qTokens = tokenize(q.question_text);
    if (qTokens.length === 0) continue;

    const qTF = computeTF(qTokens);

    // Compute token overlap similarity with topic corpus
    let overlapScore = 0;
    qTF.forEach((weight, token) => {
      if (topicTF.has(token)) {
        overlapScore += weight * (topicTF.get(token) || 0);
      }
    });

    // Direct topic bonus
    const isDirectTopic = q.topic_id === weakestTopicId;
    const baseScore = isDirectTopic ? 0.70 : 0.20;

    // Difficulty proximity bonus (prefer questions near target difficulty)
    const diffDiff = Math.abs((q.difficulty || 0.5) - targetDifficulty);
    const difficultyAffinity = Math.max(0, 1 - diffDiff);

    const totalRelevance = baseScore + (overlapScore * 10) + (difficultyAffinity * 0.15);

    let reason = '';
    if (isDirectTopic) {
      reason = `Core topic question calibrated for foundational reinforcement (Difficulty: ${q.difficulty.toFixed(2)})`;
    } else {
      reason = `Cross-topic related concept matching keywords from your weakest topic`;
    }

    results.push({
      question: q,
      score: Math.min(0.99, Number(totalRelevance.toFixed(3))),
      reason
    });
  }

  // Sort by score descending (highest priority first)
  return results.sort((a, b) => b.score - a.score);
}
