import { describe, expect, it } from 'vitest';
import { loadAllBenefits } from '@/lib/rules/load';
import { QUESTIONS, SECTION_ORDER } from '@/lib/intake/questions';

describe('intake question config', () => {
  it('uses unique question ids', () => {
    const ids = QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses unique answer keys', () => {
    const answerKeys = QUESTIONS.map((question) => question.answerKey);
    expect(new Set(answerKeys).size).toBe(answerKeys.length);
  });

  it('covers every answer key used by the rules files', () => {
    const configured = new Set(QUESTIONS.map((question) => question.answerKey));
    const required = new Set(
      loadAllBenefits().flatMap(({ file }) => file.criteria.map((criterion) => criterion.answer)),
    );

    expect([...configured].sort()).toEqual([...required].sort());
  });

  it('uses direct Attendance Allowance questions for GOV.UK residence and overlapping-benefit rules', () => {
    const aaKeys = QUESTIONS.map((question) => question.answerKey).filter((key) =>
      key.startsWith('aa_'),
    );

    expect(aaKeys).toEqual([
      'aa_reached_state_pension_age',
      'aa_end_of_life_professional_said_12_months_or_less',
      'aa_not_getting_overlapping_disability_benefit',
      'aa_in_great_britain_when_claiming',
      'aa_lived_in_gb_2_of_last_3_years_or_exception',
      'aa_habitually_resident_in_common_travel_area',
      'aa_not_subject_to_immigration_control_or_exception',
      'aa_lives_in_england_or_wales_when_applying',
      'aa_not_local_authority_care_home_funded',
    ]);
  });

  it('keeps the approved grouped section order', () => {
    expect(SECTION_ORDER).toEqual(['about', 'health', 'money', 'residence']);
  });

  it('gives every question visible copy and helper text', () => {
    for (const question of QUESTIONS) {
      expect(question.label.trim(), question.id).not.toBe('');
      expect(question.helperText.trim(), question.id).not.toBe('');
    }
  });
});
