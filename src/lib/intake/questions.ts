import type { Answers } from '@/lib/rules/schema';

export type QuestionSection = 'about' | 'health' | 'money' | 'residence';
export type QuestionType = 'boolean' | 'number';

export interface QuestionConfig {
  id: string;
  section: QuestionSection;
  answerKey: keyof Answers & string;
  type: QuestionType;
  label: string;
  helperText: string;
  min?: number;
  max?: number;
}

export const SECTION_ORDER: QuestionSection[] = ['about', 'health', 'money', 'residence'];

export const SECTION_LABELS: Record<QuestionSection, string> = {
  about: 'About you',
  health: 'Health and care',
  money: 'Money and work',
  residence: 'Where you live',
};

export const QUESTIONS: QuestionConfig[] = [
  {
    id: 'aa-state-pension-age',
    section: 'about',
    answerKey: 'aa_reached_state_pension_age',
    type: 'boolean',
    label: 'Have you reached State Pension age?',
    helperText: 'Attendance Allowance is for people who have reached State Pension age.',
  },
  {
    id: 'uc-age-or-exception',
    section: 'about',
    answerKey: 'uc_age_18_or_exception_applies',
    type: 'boolean',
    label: 'Are you 18 or over, or does a Universal Credit exception for 16 or 17 year olds apply?',
    helperText: 'Some 16 or 17 year olds can claim Universal Credit in specific situations.',
  },
  {
    id: 'pip-age',
    section: 'about',
    answerKey: 'pip_age',
    type: 'number',
    label: 'What age should be used for a Personal Independence Payment check?',
    helperText: 'PIP usually starts from age 16.',
    min: 0,
    max: 130,
  },
  {
    id: 'uc-under-state-pension-age',
    section: 'about',
    answerKey: 'uc_under_state_pension_age',
    type: 'boolean',
    label: 'Are you under State Pension age for Universal Credit?',
    helperText: 'Universal Credit is usually for people under State Pension age.',
  },
  {
    id: 'pip-under-state-pension-age-or-recent-award',
    section: 'about',
    answerKey: 'pip_under_state_pension_age_or_recent_award',
    type: 'boolean',
    label: 'Are you under State Pension age, or did you have a recent PIP or Adult Disability Payment award?',
    helperText: 'There is a limited exception for some recent awards.',
  },
  {
    id: 'has-disability-or-illness',
    section: 'health',
    answerKey: 'has_disability_or_illness',
    type: 'boolean',
    label: 'Do you have a physical disability, mental health condition, or long-term illness?',
    helperText: 'This is used for Attendance Allowance.',
  },
  {
    id: 'aa-end-of-life-professional',
    section: 'health',
    answerKey: 'aa_end_of_life_professional_said_12_months_or_less',
    type: 'boolean',
    label: 'Has a doctor or medical professional said you might have 12 months or less to live?',
    helperText: 'These are the special rules for end of life. A medical professional can support this kind of claim.',
  },
  {
    id: 'needs-care-or-supervision',
    section: 'health',
    answerKey: 'needs_care_or_supervision',
    type: 'boolean',
    label: 'Do you need help with personal care or supervision to keep you safe?',
    helperText: 'This helps assess Attendance Allowance care needs.',
  },
  {
    id: 'care-duration-months',
    section: 'health',
    answerKey: 'care_duration_months',
    type: 'number',
    label: 'How many months have you needed that help?',
    helperText: 'Attendance Allowance usually looks for a need lasting at least 6 months.',
    min: 0,
    max: 240,
  },
  {
    id: 'pip-long-term-condition',
    section: 'health',
    answerKey: 'pip_has_long_term_condition',
    type: 'boolean',
    label: 'Do you have a long-term physical or mental health condition or disability?',
    helperText: 'PIP is based on how a long-term condition affects daily living or mobility.',
  },
  {
    id: 'pip-daily-living-or-mobility',
    section: 'health',
    answerKey: 'pip_has_daily_living_or_mobility_difficulty',
    type: 'boolean',
    label: 'Does your condition make daily living or getting around difficult?',
    helperText: 'PIP looks at daily tasks and getting around.',
  },
  {
    id: 'pip-expected-duration',
    section: 'health',
    answerKey: 'pip_difficulties_expected_12_months',
    type: 'boolean',
    label: 'Are these difficulties expected to last at least 12 months from when they started?',
    helperText: 'This follows the PIP duration rule in the current rule file.',
  },
  {
    id: 'aa-overlapping-disability-benefit',
    section: 'health',
    answerKey: 'aa_not_getting_overlapping_disability_benefit',
    type: 'boolean',
    label: 'Are you not getting another disability payment?',
    helperText: 'This includes DLA, PIP, Adult Disability Payment, SADLA and AFIP.',
  },
  {
    id: 'pip-no-afip',
    section: 'health',
    answerKey: 'pip_not_receiving_armed_forces_independence_payment',
    type: 'boolean',
    label: 'Are you not receiving Armed Forces Independence Payment?',
    helperText: 'PIP cannot be paid at the same time as Armed Forces Independence Payment.',
  },
  {
    id: 'uc-living-cost-help',
    section: 'money',
    answerKey: 'uc_low_income_or_needs_living_cost_help',
    type: 'boolean',
    label: 'Do you need help with living costs because of low income, no work, or being unable to work?',
    helperText: 'Universal Credit is designed to help with living costs.',
  },
  {
    id: 'uc-savings',
    section: 'money',
    answerKey: 'uc_savings_and_investments',
    type: 'number',
    label: 'How much do you have in savings and investments?',
    helperText: 'For Universal Credit, savings are usually capped at 16000 pounds.',
    min: 0,
  },
  {
    id: 'uc-student-rules',
    section: 'money',
    answerKey: 'uc_not_full_time_student_or_exception_applies',
    type: 'boolean',
    label: 'Are you not a full-time student, or does a Universal Credit student exception apply?',
    helperText: 'Full-time students usually cannot claim unless one of the listed exceptions applies.',
  },
  {
    id: 'aa-in-great-britain-when-claiming',
    section: 'residence',
    answerKey: 'aa_in_great_britain_when_claiming',
    type: 'boolean',
    label: 'Will you be in Great Britain when you claim Attendance Allowance?',
    helperText: 'You must usually be in Great Britain when you claim, unless an exception applies.',
  },
  {
    id: 'aa-gb-residence-history',
    section: 'residence',
    answerKey: 'aa_lived_in_gb_2_of_last_3_years_or_exception',
    type: 'boolean',
    label: 'Have you been in Great Britain for at least 2 of the last 3 years, or does a refugee or humanitarian protection exception apply?',
    helperText: 'This is one of the Attendance Allowance residence rules.',
  },
  {
    id: 'aa-habitual-residence',
    section: 'residence',
    answerKey: 'aa_habitually_resident_in_common_travel_area',
    type: 'boolean',
    label: 'Are you habitually resident in the UK, Ireland, Isle of Man or the Channel Islands?',
    helperText: 'This checks where you normally live.',
  },
  {
    id: 'aa-immigration-control',
    section: 'residence',
    answerKey: 'aa_not_subject_to_immigration_control_or_exception',
    type: 'boolean',
    label: 'Are you not subject to immigration control, or does the sponsored immigrant exception apply?',
    helperText: 'This rule can affect Attendance Allowance.',
  },
  {
    id: 'aa-england-or-wales',
    section: 'residence',
    answerKey: 'aa_lives_in_england_or_wales_when_applying',
    type: 'boolean',
    label: 'Do you live in England or Wales for this Attendance Allowance claim?',
    helperText: 'If you live in Scotland, Pension Age Disability Payment is usually the relevant route instead.',
  },
  {
    id: 'aa-care-home-funding',
    section: 'residence',
    answerKey: 'aa_not_local_authority_care_home_funded',
    type: 'boolean',
    label: 'If you live in a care home, is your care not paid for by your local authority?',
    helperText: 'You can still claim if you pay all care home costs yourself.',
  },
  {
    id: 'uc-lives-in-uk',
    section: 'residence',
    answerKey: 'uc_lives_in_uk',
    type: 'boolean',
    label: 'Do you live in the UK?',
    helperText: 'You must usually live in the UK.',
  },
  {
    id: 'pip-england-or-wales',
    section: 'residence',
    answerKey: 'pip_lives_in_england_or_wales_when_applying',
    type: 'boolean',
    label: 'Do you live in England or Wales when applying for PIP?',
    helperText: 'Scotland uses Adult Disability Payment instead of PIP for new claims.',
  },
  {
    id: 'pip-residence-history',
    section: 'residence',
    answerKey: 'pip_lived_in_gb_2_of_last_3_years',
    type: 'boolean',
    label: 'Have you lived in England, Scotland or Wales for at least 2 of the last 3 years?',
    helperText: 'This is the usual PIP residence check.',
  },
];

export function getAnsweredValue(answers: Answers, answerKey: string): Answers[string] {
  return answers[answerKey];
}
