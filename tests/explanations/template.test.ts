import { describe, expect, it } from 'vitest';
import { createTemplateExplanation } from '@/lib/explanations/template';
import type { Assessment } from '@/lib/rules/schema';

const baseAssessment: Assessment = {
  benefitId: 'attendance-allowance',
  benefitName: 'Attendance Allowance',
  outcome: 'unlikely',
  criteria: [
    {
      id: 'aa-age',
      met: false,
      weight: 'mandatory',
      explanation: 'You must be State Pension age or over.',
      sourceUrl: 'https://www.gov.uk/attendance-allowance/eligibility#eligibility',
    },
  ],
  missingAnswers: [],
  recommendedEvidence: [],
  assessedAt: '2026-07-19T00:00:00.000Z',
  rulesVersion: '123456abcdef',
};

describe('template explanations', () => {
  it('never uses absolute decision wording', () => {
    const forbidden = /\b(eligible|guaranteed|approved|entitled)\b/i;

    for (const outcome of ['likely_eligible', 'possibly_eligible', 'insufficient_info', 'unlikely'] as const) {
      expect(createTemplateExplanation({ ...baseAssessment, outcome }).text).not.toMatch(forbidden);
    }
  });

  it('mentions the decisive failed criterion for unlikely outcomes', () => {
    expect(createTemplateExplanation(baseAssessment).text).toContain(
      'You must be State Pension age or over.',
    );
  });

  it('mentions missing answers for insufficient information', () => {
    const explanation = createTemplateExplanation({
      ...baseAssessment,
      outcome: 'insufficient_info',
      missingAnswers: ['age', 'lives_in_great_britain'],
      criteria: [],
    });

    expect(explanation.text).toContain('age');
    expect(explanation.text).toContain('lives_in_great_britain');
  });

  it('keeps the official-advice warning', () => {
    expect(createTemplateExplanation(baseAssessment).text).toContain('not official advice');
  });
});
