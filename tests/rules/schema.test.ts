import { describe, it, expect } from 'vitest';
import { BenefitFileSchema } from '@/lib/rules/schema';

const validFile = {
  benefit: {
    id: 'test-benefit',
    name: 'Test Benefit',
    source_url: 'https://cpag.org.uk/welfare-rights/test',
    last_verified: '2026-07-19',
  },
  criteria: [
    {
      id: 'test-age',
      answer: 'age',
      op: 'gte',
      value: 66,
      weight: 'mandatory',
      explanation: 'You must be 66 or over.',
      source_anchor: '#eligibility',
    },
  ],
  evidence: [],
};

describe('BenefitFileSchema', () => {
  it('accepts a well-formed benefit file', () => {
    expect(() => BenefitFileSchema.parse(validFile)).not.toThrow();
  });

  it('rejects a criterion without an explanation', () => {
    const file = structuredClone(validFile);
    delete (file.criteria[0] as Record<string, unknown>).explanation;
    expect(() => BenefitFileSchema.parse(file)).toThrow();
  });

  it('rejects a criterion without a source_anchor', () => {
    const file = structuredClone(validFile);
    delete (file.criteria[0] as Record<string, unknown>).source_anchor;
    expect(() => BenefitFileSchema.parse(file)).toThrow();
  });

  it('rejects an unknown operator', () => {
    const file = structuredClone(validFile);
    (file.criteria[0] as Record<string, unknown>).op = 'regex';
    expect(() => BenefitFileSchema.parse(file)).toThrow();
  });

  it('rejects a source_url that is not a URL', () => {
    const file = structuredClone(validFile);
    file.benefit.source_url = 'not-a-url';
    expect(() => BenefitFileSchema.parse(file)).toThrow();
  });

  it('accepts GOV.UK as a complementary official source', () => {
    const file = {
      ...structuredClone(validFile),
      benefit: {
        ...validFile.benefit,
        complementary_sources: [
          {
            label: 'GOV.UK Universal Credit eligibility',
            url: 'https://www.gov.uk/universal-credit/eligibility',
            description: 'Official GOV.UK eligibility page used as a complementary check.',
          },
        ],
      },
    };

    expect(BenefitFileSchema.parse(file).benefit.complementary_sources?.[0]).toMatchObject({
      label: 'GOV.UK Universal Credit eligibility',
      url: 'https://www.gov.uk/universal-credit/eligibility',
    });
  });

  it('requires a value for comparison operators', () => {
    const file = structuredClone(validFile);
    delete (file.criteria[0] as Record<string, unknown>).value;
    expect(() => BenefitFileSchema.parse(file)).toThrow();
  });

  it('does not require a value for is_true', () => {
    const file = structuredClone(validFile);
    file.criteria[0] = {
      ...file.criteria[0],
      op: 'is_true',
      value: undefined,
    } as never;
    expect(() => BenefitFileSchema.parse(file)).not.toThrow();
  });
});

/**
 * Helpers para os testes de integridade. `parse` aceita `unknown`, então
 * montar o objeto solto evita casts espalhados pelos testes.
 */
const validCriterion = validFile.criteria[0];
const fileWith = (patch: Record<string, unknown>): unknown => ({
  ...structuredClone(validFile),
  ...patch,
});
const fileWithCriteria = (...criteria: unknown[]): unknown => fileWith({ criteria });

describe('BenefitFileSchema — integrity guards', () => {
  describe('unknown keys are rejected, not silently dropped', () => {
    it('rejects an unknown key on the benefit block', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWith({ benefit: { ...validFile.benefit, sauce_url: 'https://www.gov.uk/typo' } }),
        ),
      ).toThrow();
    });

    it('rejects an unknown key on a criterion', () => {
      expect(() =>
        BenefitFileSchema.parse(fileWithCriteria({ ...validCriterion, wieght: 'mandatory' })),
      ).toThrow();
    });

    it('rejects an unknown key on an evidence item', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWith({
            evidence: [
              {
                id: 'ev-1',
                label: 'A medical report',
                required_when: ['test-age'],
                why: 'Confirms the condition.',
                whu: 'typo of why',
              },
            ],
          }),
        ),
      ).toThrow();
    });
  });

  describe('source_anchor must be a real fragment', () => {
    it('rejects a source_anchor that does not start with #', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWithCriteria({ ...validCriterion, source_anchor: 'eligibility' }),
        ),
      ).toThrow();
    });

    it('accepts a source_anchor that starts with #', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWithCriteria({ ...validCriterion, source_anchor: '#how-to-claim' }),
        ),
      ).not.toThrow();
    });
  });

  describe('value must agree with op', () => {
    it('rejects gte with a non-numeric value', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWithCriteria({ ...validCriterion, op: 'gte', value: 'sixty-six' }),
        ),
      ).toThrow();
    });

    it('rejects lte with a non-numeric value', () => {
      expect(() =>
        BenefitFileSchema.parse(fileWithCriteria({ ...validCriterion, op: 'lte', value: true })),
      ).toThrow();
    });

    it('rejects is_true carrying a value', () => {
      expect(() =>
        BenefitFileSchema.parse(fileWithCriteria({ ...validCriterion, op: 'is_true', value: true })),
      ).toThrow();
    });

    it('rejects in with a value that is not an array', () => {
      expect(() =>
        BenefitFileSchema.parse(fileWithCriteria({ ...validCriterion, op: 'in', value: 'england' })),
      ).toThrow();
    });

    it('accepts in with an array value', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWithCriteria({ ...validCriterion, op: 'in', value: ['england', 'wales'] }),
        ),
      ).not.toThrow();
    });
  });

  describe('criterion ids must be unique', () => {
    it('rejects two criteria sharing an id', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWithCriteria(validCriterion, { ...validCriterion, answer: 'other_age' }),
        ),
      ).toThrow(/duplicate/i);
    });

    it('accepts two criteria with distinct ids', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWithCriteria(validCriterion, {
            ...validCriterion,
            id: 'test-residence',
            answer: 'lives_in_great_britain',
            op: 'is_true',
            value: undefined,
          }),
        ),
      ).not.toThrow();
    });
  });

  describe('assessment paths', () => {
    it('accepts paths that reference criteria by id', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWith({
            paths: [
              {
                id: 'ordinary',
                label: 'Ordinary rules',
                criteria: ['test-age'],
              },
            ],
          }),
        ),
      ).not.toThrow();
    });

    it('rejects a path that references an unknown criterion', () => {
      expect(() =>
        BenefitFileSchema.parse(
          fileWith({
            paths: [
              {
                id: 'ordinary',
                label: 'Ordinary rules',
                criteria: ['not-real'],
              },
            ],
          }),
        ),
      ).toThrow(/unknown criterion/i);
    });
  });
});
