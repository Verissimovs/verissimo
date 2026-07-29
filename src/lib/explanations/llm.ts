import type { Assessment } from '@/lib/rules/schema';

const FORBIDDEN_WORDS = /\b(eligible|guaranteed|approved|entitled)\b/i;
const SOURCE_URL_PATTERN = /https:\/\/(?:www\.gov\.uk|cpag\.org\.uk)\/[^\s),]+/g;
const CRITERION_ID_PATTERN = /\b[a-z]{2,4}-[a-z0-9-]+\b/g;
const MAX_WORDS = 180;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function buildExplanationPrompt(assessment: Assessment): string {
  const trace = assessment.criteria
    .map(
      (criterion) =>
        `- ${criterion.id}: met=${String(criterion.met)}; ${criterion.explanation}; source=${criterion.sourceUrl}`,
    )
    .join('\n');

  const evidence = assessment.recommendedEvidence
    .map((item) => `- ${item.label}: ${item.why}`)
    .join('\n');

  const complementarySources = (assessment.complementarySources ?? [])
    .map((source) => `- ${source.label}: ${source.url}; ${source.description}`)
    .join('\n');

  return [
    'Rewrite this benefit assessment in simpler words.',
    'Do not decide eligibility.',
    'Do not add rules, benefits, sources, URLs, or facts not present below.',
    'Do not use final decision wording such as eligible, approved, guaranteed, or entitled.',
    'Use about age-12 reading level and include that this is not official advice.',
    `Benefit: ${assessment.benefitName}`,
    `Assessment path: ${assessment.path?.label ?? 'none'}`,
    `Outcome: ${assessment.outcome}`,
    `Missing answers: ${assessment.missingAnswers.join(', ') || 'none'}`,
    'Criteria trace:',
    trace || 'none',
    'Recommended evidence:',
    evidence || 'none',
    'Complementary official sources:',
    complementarySources || 'none',
  ].join('\n');
}

export function validateLlmExplanation(text: string, assessment: Assessment): ValidationResult {
  if (wordCount(text) > MAX_WORDS) {
    return { valid: false, reason: 'too_long' };
  }

  if (FORBIDDEN_WORDS.test(text)) {
    return { valid: false, reason: 'forbidden_word' };
  }

  const allowedUrls = new Set([
    ...assessment.criteria.map((criterion) => criterion.sourceUrl),
    ...(assessment.complementarySources ?? []).map((source) => source.url),
  ]);
  for (const url of text.match(SOURCE_URL_PATTERN) ?? []) {
    if (!allowedUrls.has(url)) {
      return { valid: false, reason: 'unknown_url' };
    }
  }

  const allowedCriteria = new Set(assessment.criteria.map((criterion) => criterion.id));
  for (const id of text.match(CRITERION_ID_PATTERN) ?? []) {
    if (!allowedCriteria.has(id)) {
      return { valid: false, reason: 'unknown_criterion' };
    }
  }

  return { valid: true };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
