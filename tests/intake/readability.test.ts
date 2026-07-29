import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '@/lib/intake/questions';
import { outcomeCopy } from '@/lib/intake/results';
import { auditReadability, scoreReadability } from '@/lib/intake/readability';
import type { Outcome } from '@/lib/rules/schema';

const DISCLAIMER =
  'This is not official advice. VERISSIMO is a study tool. Always check CPAG Welfare Rights, GOV.UK, or a qualified adviser before acting on a benefits decision.';

describe('readability checks', () => {
  it('scores simple plain English as easy to read', () => {
    const score = scoreReadability('The form asks simple questions. You can stop at any time.');

    expect(score.wordCount).toBe(11);
    expect(score.fleschReadingEase).toBeGreaterThan(70);
    expect(score.fleschKincaidGrade).toBeLessThan(7);
  });

  it('keeps critical user-facing copy under the approved reading-level threshold', () => {
    const outcomes: Outcome[] = [
      'likely_eligible',
      'possibly_eligible',
      'insufficient_info',
      'unlikely',
    ];
    const texts = [
      ...QUESTIONS.flatMap((question) => [
        { id: `${question.id}:label`, text: question.label },
        { id: `${question.id}:helper`, text: question.helperText },
      ]),
      ...outcomes.flatMap((outcome) => {
        const copy = outcomeCopy(outcome);
        return [
          { id: `${outcome}:label`, text: copy.label },
          { id: `${outcome}:description`, text: copy.description },
        ];
      }),
      { id: 'disclaimer', text: DISCLAIMER },
    ];

    const failures = auditReadability(texts, { maxFleschKincaidGrade: 12, minWordCount: 8 }).filter(
      (item) => !item.passes,
    );

    expect(failures).toEqual([]);
  });
});
