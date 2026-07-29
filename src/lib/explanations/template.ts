import { getDecisiveCriterion, outcomeCopy } from '@/lib/intake/results';
import type { Assessment } from '@/lib/rules/schema';

export interface Explanation {
  benefitId: string;
  mode: 'template' | 'llm' | 'fallback';
  text: string;
}

export function createTemplateExplanation(
  assessment: Assessment,
  mode: Explanation['mode'] = 'template',
): Explanation {
  const copy = outcomeCopy(assessment.outcome);
  const parts = [
    `${assessment.benefitName}: ${copy.label}.`,
    copy.description,
  ];

  const decisive = getDecisiveCriterion(assessment);
  if (decisive) {
    parts.push(`The main rule to review is: ${decisive.explanation}`);
  }

  if (assessment.outcome === 'insufficient_info' && assessment.missingAnswers.length > 0) {
    parts.push(`More answers are needed for: ${assessment.missingAnswers.join(', ')}.`);
  }

  if (assessment.recommendedEvidence.length > 0) {
    const evidence = assessment.recommendedEvidence
      .slice(0, 3)
      .map((item) => item.label)
      .join('; ');
    parts.push(`Useful evidence to gather may include: ${evidence}.`);
  }

  parts.push('This is not official advice. Check CPAG Welfare Rights, GOV.UK, or speak to a qualified adviser.');

  return {
    benefitId: assessment.benefitId,
    mode,
    text: parts.join(' '),
  };
}
