import { describe, expect, it } from 'vitest';
import { buildExplanationPrompt, validateLlmExplanation } from '@/lib/explanations/llm';
import type { Assessment } from '@/lib/rules/schema';

const assessment: Assessment = {
  benefitId: 'attendance-allowance',
  benefitName: 'Attendance Allowance',
  outcome: 'unlikely',
  criteria: [
    {
      id: 'aa-age',
      met: false,
      weight: 'mandatory',
      explanation: 'You must be State Pension age or over.',
      sourceUrl: 'https://cpag.org.uk/welfare-rights#online-handbooks',
    },
  ],
  missingAnswers: [],
  recommendedEvidence: [],
  complementarySources: [
    {
      label: 'GOV.UK Attendance Allowance eligibility',
      url: 'https://www.gov.uk/attendance-allowance/eligibility',
      description: 'Official GOV.UK eligibility page used as a complementary check.',
    },
  ],
  assessedAt: '2026-07-19T00:00:00.000Z',
  rulesVersion: '123456abcdef',
  path: {
    id: 'end_of_life',
    label: 'Special rules for end of life',
    outcome: 'unlikely',
  },
};

describe('LLM explanation guardrails', () => {
  it('builds a prompt with the trace, source URLs and decision boundary', () => {
    const prompt = buildExplanationPrompt(assessment);

    expect(prompt).toContain('aa-age');
    expect(prompt).toContain('Assessment path: Special rules for end of life');
    expect(prompt).toContain('https://cpag.org.uk/welfare-rights#online-handbooks');
    expect(prompt).toContain('Complementary official sources');
    expect(prompt).toContain('https://www.gov.uk/attendance-allowance/eligibility');
    expect(prompt).toMatch(/do not decide/i);
  });

  it('rejects forbidden absolute decision wording', () => {
    expect(validateLlmExplanation('You are eligible and approved.', assessment).valid).toBe(false);
  });

  it('rejects CPAG URLs that are not in the trace', () => {
    expect(
      validateLlmExplanation(
        'Read https://cpag.org.uk/welfare-rights/key-topics/universal-credit for more.',
        assessment,
      ).valid,
    ).toBe(false);
  });

  it('allows GOV.UK URLs that are present as complementary sources', () => {
    expect(
      validateLlmExplanation(
        'This is not official advice. You can also review https://www.gov.uk/attendance-allowance/eligibility with an adviser.',
        assessment,
      ).valid,
    ).toBe(true);
  });

  it('rejects text over 180 words', () => {
    const longText = Array.from({ length: 181 }, () => 'word').join(' ');
    expect(validateLlmExplanation(longText, assessment).valid).toBe(false);
  });

  it('accepts a safe paraphrase', () => {
    expect(
      validateLlmExplanation(
        'Attendance Allowance is probably not the best match from these answers. The rule to check is State Pension age. This is not official advice.',
        assessment,
      ).valid,
    ).toBe(true);
  });
});
