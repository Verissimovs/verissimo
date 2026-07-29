import { describe, it, expect } from 'vitest';
import { deriveOutcome } from '@/lib/rules/outcome';
import type { AssessedCriterion } from '@/lib/rules/schema';

const c = (
  id: string,
  met: boolean | null,
  weight: 'mandatory' | 'supporting' = 'mandatory',
): AssessedCriterion => ({
  id, met, weight, explanation: 'because', sourceUrl: 'https://www.gov.uk/x#y',
});

describe('deriveOutcome', () => {
  it('is unlikely when a mandatory criterion fails', () => {
    expect(deriveOutcome([c('a', true), c('b', false)])).toBe('unlikely');
  });

  it('prefers unlikely over insufficient_info when a mandatory criterion has already failed', () => {
    expect(deriveOutcome([c('a', false), c('b', null)])).toBe('unlikely');
  });

  it('is insufficient_info when a mandatory criterion is unanswered and none have failed', () => {
    expect(deriveOutcome([c('a', true), c('b', null)])).toBe('insufficient_info');
  });

  it('is likely_eligible when every criterion is met', () => {
    expect(deriveOutcome([c('a', true), c('b', true, 'supporting')])).toBe('likely_eligible');
  });

  it('is possibly_eligible when all mandatory are met but a supporting one is not', () => {
    expect(deriveOutcome([c('a', true), c('b', false, 'supporting')])).toBe('possibly_eligible');
  });

  it('is possibly_eligible when all mandatory are met but a supporting one is unanswered', () => {
    expect(deriveOutcome([c('a', true), c('b', null, 'supporting')])).toBe('possibly_eligible');
  });

  it('is likely_eligible when all mandatory are met and there are no supporting criteria', () => {
    expect(deriveOutcome([c('a', true)])).toBe('likely_eligible');
  });

  it('is insufficient_info for an empty assessment', () => {
    expect(deriveOutcome([])).toBe('insufficient_info');
  });
});
