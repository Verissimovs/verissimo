import { describe, it, expect } from 'vitest';
import { assess, assessAll } from '@/lib/rules/engine';
import { loadBenefit } from '@/lib/rules/load';
import type { Answers } from '@/lib/rules/schema';

const eligible: Answers = {
  aa_reached_state_pension_age: true,
  has_disability_or_illness: true,
  needs_care_or_supervision: true,
  care_duration_months: 12,
  aa_in_great_britain_when_claiming: true,
  aa_lived_in_gb_2_of_last_3_years_or_exception: true,
  aa_habitually_resident_in_common_travel_area: true,
  aa_not_subject_to_immigration_control_or_exception: true,
  aa_lives_in_england_or_wales_when_applying: true,
  aa_not_getting_overlapping_disability_benefit: true,
  aa_not_local_authority_care_home_funded: true,
};

const endOfLifeEligible: Answers = {
  aa_reached_state_pension_age: true,
  aa_end_of_life_professional_said_12_months_or_less: true,
  aa_in_great_britain_when_claiming: true,
  aa_lived_in_gb_2_of_last_3_years_or_exception: true,
  aa_habitually_resident_in_common_travel_area: true,
  aa_not_subject_to_immigration_control_or_exception: true,
  aa_lives_in_england_or_wales_when_applying: true,
  aa_not_getting_overlapping_disability_benefit: true,
  aa_not_local_authority_care_home_funded: true,
};

const universalCreditEligible: Answers = {
  uc_low_income_or_needs_living_cost_help: true,
  uc_lives_in_uk: true,
  uc_age_18_or_exception_applies: true,
  uc_under_state_pension_age: true,
  uc_savings_and_investments: 500,
  uc_not_full_time_student_or_exception_applies: true,
};

const pipEligible: Answers = {
  pip_age: 40,
  pip_under_state_pension_age_or_recent_award: true,
  pip_has_long_term_condition: true,
  pip_has_daily_living_or_mobility_difficulty: true,
  pip_difficulties_expected_12_months: true,
  pip_lives_in_england_or_wales_when_applying: true,
  pip_lived_in_gb_2_of_last_3_years: true,
  pip_not_receiving_armed_forces_independence_payment: true,
};

const eligibleByBenefit: Record<string, Answers> = {
  'attendance-allowance': eligible,
  'universal-credit': universalCreditEligible,
  'personal-independence-payment': pipEligible,
};

describe('assess', () => {
  it('reports likely_eligible when every criterion is met', () => {
    const result = assess('attendance-allowance', eligible);
    expect(result.outcome).toBe('likely_eligible');
    expect(result.path?.id).toBe('ordinary');
  });

  it('uses the Attendance Allowance end-of-life path without requiring 6 months of care need', () => {
    const result = assess('attendance-allowance', endOfLifeEligible);

    expect(result.outcome).toBe('likely_eligible');
    expect(result.path).toEqual({
      id: 'end_of_life',
      label: 'Special rules for end of life',
      outcome: 'likely_eligible',
    });
    expect(result.criteria.map((criterion) => criterion.id)).toContain('aa-end-of-life-professional');
    expect(result.criteria.map((criterion) => criterion.id)).not.toContain('aa-duration');
    expect(result.recommendedEvidence.map((item) => item.id)).toContain('aa-ev-sr1');
  });

  it('needs the end-of-life medical-professional answer for the special-rules path', () => {
    const answers = { ...endOfLifeEligible };
    delete answers.aa_end_of_life_professional_said_12_months_or_less;

    const result = assess('attendance-allowance', answers);

    expect(result.outcome).toBe('insufficient_info');
    expect(result.path?.id).toBe('end_of_life');
    expect(result.missingAnswers).toContain('aa_end_of_life_professional_said_12_months_or_less');
  });

  it('reports unlikely when the claimant is under State Pension age', () => {
    expect(
      assess('attendance-allowance', { ...eligible, aa_reached_state_pension_age: false }).outcome,
    ).toBe('unlikely');
  });

  it('reports unlikely when the claimant already receives an overlapping disability benefit', () => {
    expect(
      assess('attendance-allowance', {
        ...eligible,
        aa_not_getting_overlapping_disability_benefit: false,
      }).outcome,
    ).toBe('unlikely');
  });

  it('reports insufficient_info when an answer is missing', () => {
    const rest = { ...eligible };
    delete rest.aa_reached_state_pension_age;
    expect(assess('attendance-allowance', rest).outcome).toBe('insufficient_info');
  });

  it('lists exactly which answers are missing', () => {
    const rest = { ...eligible };
    delete rest.aa_reached_state_pension_age;
    delete rest.aa_in_great_britain_when_claiming;
    expect(assess('attendance-allowance', rest).missingAnswers.sort())
      .toEqual(['aa_in_great_britain_when_claiming', 'aa_reached_state_pension_age']);
  });

  it('attaches a resolvable CPAG URL to every criterion', () => {
    for (const criterion of assess('attendance-allowance', eligible).criteria) {
      expect(criterion.sourceUrl).toMatch(/^https:\/\/cpag\.org\.uk\/.+#.+/);
    }
  });

  it('keeps GOV.UK as a complementary official source without replacing CPAG criterion URLs', () => {
    const result = assess('universal-credit', universalCreditEligible);

    expect(result.criteria.every((criterion) => criterion.sourceUrl.startsWith('https://cpag.org.uk/')))
      .toBe(true);
    expect(result.complementarySources).toEqual([
      {
        label: 'GOV.UK Universal Credit eligibility',
        url: 'https://www.gov.uk/universal-credit/eligibility',
        description: 'Official GOV.UK eligibility page used as a complementary check.',
      },
      {
        label: 'GOV.UK Universal Credit claim details',
        url: 'https://www.gov.uk/universal-credit/how-to-claim',
        description: 'Official GOV.UK claim information used to cross-check application details.',
      },
    ]);
  });

  /**
   * O expected vem do arquivo de regras carregado, não de uma lista literal.
   * Escrito com literais, este teste comparava um hardcode contra outro: um
   * motor que ignorasse o YAML e emitisse os IDs fixos passava. Derivando do
   * loader, a única forma de passar é o motor realmente ler o arquivo.
   */
  it('never invents a criterion that is not in the rules file', () => {
    const { file } = loadBenefit('attendance-allowance');
    const expected = file.paths?.find((path) => path.id === 'ordinary')?.criteria ?? [];

    expect(expected.length).toBeGreaterThan(0);
    expect(assess('attendance-allowance', eligible).criteria.map((c) => c.id)).toEqual(expected);
  });

  /**
   * A outra metade da mesma propriedade. O regex acima aceita qualquer URL
   * com forma de CPAG, inclusive uma que não aparece em lugar nenhum do
   * YAML — uma citação alucinada é tão danosa quanto um critério alucinado.
   * Aqui cada sourceUrl tem de ser exatamente source_url + source_anchor do
   * critério correspondente no arquivo.
   */
  it('only cites URLs that are derivable from the rules file', () => {
    for (const [benefitId, answers] of Object.entries(eligibleByBenefit)) {
      const { file } = loadBenefit(benefitId);
      const expectedIds = file.paths?.[0]
        ? assess(benefitId, answers).criteria.map((criterion) => criterion.id)
        : file.criteria.map((criterion) => criterion.id);
      const expected = new Map(
        file.criteria
          .filter((criterion) => expectedIds.includes(criterion.id))
          .map((c) => [c.id, `${file.benefit.source_url}${c.source_anchor}`]),
      );

      const assessed = assess(benefitId, answers).criteria;
      expect(assessed.length).toBe(expected.size);

      for (const criterion of assessed) {
        expect(criterion.sourceUrl).toBe(expected.get(criterion.id));
      }
    }
  });

  it('is deterministic: identical answers produce an identical assessment', () => {
    const a = assess('attendance-allowance', eligible);
    const b = assess('attendance-allowance', eligible);
    expect({ ...a, assessedAt: '' }).toEqual({ ...b, assessedAt: '' });
  });

  it('records the rules version so a result can be traced to the rules that produced it', () => {
    expect(assess('attendance-allowance', eligible).rulesVersion).toMatch(/^[0-9a-f]{12}$/);
  });

  it('recommends evidence when every trigger criterion for that evidence is met', () => {
    expect(assess('attendance-allowance', eligible).recommendedEvidence.map((e) => e.id))
      .toContain('aa-ev-condition-details');
  });

  it('does not recommend evidence while one of its trigger criteria is unanswered', () => {
    const answersWithoutCareNeed = { ...eligible };
    delete answersWithoutCareNeed.needs_care_or_supervision;
    expect(
      assess('attendance-allowance', answersWithoutCareNeed).recommendedEvidence.map((e) => e.id),
    ).not.toContain('aa-ev-condition-details');
  });

  it('assesses Universal Credit from its YAML rules', () => {
    const result = assess('universal-credit', universalCreditEligible);
    expect(result.outcome).toBe('likely_eligible');
    expect(result.criteria.map((c) => c.id)).toEqual(
      loadBenefit('universal-credit').file.criteria.map((c) => c.id),
    );
  });

  it('assesses Personal Independence Payment from its YAML rules', () => {
    const result = assess('personal-independence-payment', pipEligible);
    expect(result.outcome).toBe('likely_eligible');
    expect(result.criteria.map((c) => c.id)).toEqual(
      loadBenefit('personal-independence-payment').file.criteria.map((c) => c.id),
    );
  });
});

describe('assessAll', () => {
  it('assesses every benefit at once', () => {
    expect(assessAll(eligible).length).toBeGreaterThanOrEqual(1);
  });

  it('returns one assessment for each in-scope benefit', () => {
    const answers = { ...eligible, ...universalCreditEligible, ...pipEligible };
    expect(assessAll(answers).map((assessment) => assessment.benefitId).sort()).toEqual([
      'attendance-allowance',
      'personal-independence-payment',
      'universal-credit',
    ]);
  });
});
