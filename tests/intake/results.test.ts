import { describe, expect, it } from 'vitest';
import {
  buildUsabilitySessionExport,
  buildPrintableReport,
  getDecisiveCriterion,
  outcomeCopy,
  sortAssessmentsForDisplay,
} from '@/lib/intake/results';
import type { Assessment, AssessedCriterion, Outcome } from '@/lib/rules/schema';

const criterion = (patch: Partial<AssessedCriterion>): AssessedCriterion => ({
  id: 'criterion',
  met: true,
  weight: 'mandatory',
  explanation: 'Plain explanation',
  sourceUrl: 'https://cpag.org.uk/welfare-rights#source',
  ...patch,
});

const assessment = (outcome: Outcome, criteria: AssessedCriterion[] = []): Assessment => ({
  benefitId: outcome,
  benefitName: outcome,
  outcome,
  criteria,
  missingAnswers: ['missing_answer'],
  recommendedEvidence: [
    {
      id: 'evidence-1',
      label: 'Evidence label',
      why: 'Evidence reason',
      required_when: ['criterion'],
    },
  ],
  complementarySources: [
    {
      label: 'GOV.UK benefit guidance',
      url: 'https://www.gov.uk/example',
      description: 'Official GOV.UK page used as a complementary check.',
    },
  ],
  assessedAt: '2026-07-19T00:00:00.000Z',
  rulesVersion: '123456abcdef',
  path: {
    id: 'end_of_life',
    label: 'Special rules for end of life',
    outcome,
  },
});

describe('result presentation helpers', () => {
  it('maps likely_eligible to safe user-facing wording', () => {
    expect(outcomeCopy('likely_eligible').label).toBe('Worth exploring');
  });

  it('keeps unlikely outcome badges short enough for result cards', () => {
    expect(outcomeCopy('unlikely').label).toBe('Not a match');
  });

  it('never uses absolute eligibility wording in outcome copy', () => {
    const forbidden = /\b(eligible|guaranteed|approved|entitled)\b/i;

    for (const outcome of [
      'likely_eligible',
      'possibly_eligible',
      'insufficient_info',
      'unlikely',
    ] satisfies Outcome[]) {
      const copy = outcomeCopy(outcome);
      expect(`${copy.label} ${copy.description}`).not.toMatch(forbidden);
    }
  });

  it('returns the first failed mandatory criterion as decisive', () => {
    const firstFailed = criterion({ id: 'first-failed', met: false, weight: 'mandatory' });
    const secondFailed = criterion({ id: 'second-failed', met: false, weight: 'mandatory' });

    expect(getDecisiveCriterion(assessment('unlikely', [firstFailed, secondFailed]))).toBe(
      firstFailed,
    );
  });

  it('does not return supporting failed criteria as decisive', () => {
    expect(
      getDecisiveCriterion(
        assessment('possibly_eligible', [
          criterion({ id: 'supporting', met: false, weight: 'supporting' }),
        ]),
      ),
    ).toBeUndefined();
  });

  it('sorts assessments by the approved display priority', () => {
    expect(
      sortAssessmentsForDisplay([
        assessment('unlikely'),
        assessment('insufficient_info'),
        assessment('likely_eligible'),
        assessment('possibly_eligible'),
      ]).map((item) => item.outcome),
    ).toEqual(['likely_eligible', 'possibly_eligible', 'insufficient_info', 'unlikely']);
  });

  it('builds printable report metadata from the assessment trace', () => {
    const report = buildPrintableReport(
      assessment('insufficient_info', [criterion({ id: 'criterion', met: null })]),
      'Plain explanation for printing.',
    );

    expect(report.title).toBe('insufficient_info report');
    expect(report.outcomeLabel).toBe('Need more answers');
    expect(report.pathLabel).toBe('Special rules for end of life');
    expect(report.generatedAt).toBe('19 Jul 2026, 00:00');
    expect(report.rulesVersion).toBe('123456abcdef');
    expect(report.explanation).toBe('Plain explanation for printing.');
    expect(report.missingAnswers).toEqual(['missing_answer']);
    expect(report.evidence[0].label).toBe('Evidence label');
    expect(report.complementarySources?.[0].url).toBe('https://www.gov.uk/example');
    expect(report.criteria[0]).toMatchObject({
      id: 'criterion',
      status: 'Missing',
      sourceUrl: 'https://cpag.org.uk/welfare-rights#source',
    });
  });

  it('builds an anonymised usability export without participant identifiers or free-text notes', () => {
    const exported = buildUsabilitySessionExport({
      answers: {
        age: 74,
        needs_care_or_supervision: true,
        ignored_empty: undefined,
      },
      assessments: [
        assessment('likely_eligible', [
          criterion({ id: 'aa-age', met: true }),
          criterion({ id: 'aa-care-need', met: true }),
        ]),
      ],
      exportedAt: '2026-07-19T12:00:00.000Z',
    });

    expect(exported).toEqual({
      schemaVersion: 1,
      exportedAt: '2026-07-19T12:00:00.000Z',
      purpose: 'scenario-based-usability-testing',
      containsPersonalData: false,
      answers: {
        age: 74,
        needs_care_or_supervision: true,
      },
      assessments: [
        {
          benefitId: 'likely_eligible',
          benefitName: 'likely_eligible',
          outcome: 'likely_eligible',
          path: {
            id: 'end_of_life',
            label: 'Special rules for end of life',
          },
          missingAnswerCount: 1,
          recommendedEvidenceIds: ['evidence-1'],
          criteria: [
            { id: 'aa-age', met: true, weight: 'mandatory' },
            { id: 'aa-care-need', met: true, weight: 'mandatory' },
          ],
          rulesVersion: '123456abcdef',
        },
      ],
    });

    expect(JSON.stringify(exported)).not.toMatch(/participantCode|email|notes|comments|freeText/i);
  });
});
