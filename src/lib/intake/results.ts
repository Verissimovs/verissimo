import type {
  Answers,
  Assessment,
  AssessedCriterion,
  ComplementarySource,
  Evidence,
  Outcome,
} from '@/lib/rules/schema';

export interface OutcomeCopy {
  label: string;
  description: string;
}

export interface PrintableCriterion {
  id: string;
  status: string;
  explanation: string;
  sourceUrl: string;
}

export interface PrintableReport {
  title: string;
  benefitName: string;
  outcomeLabel: string;
  outcomeDescription: string;
  pathLabel?: string;
  explanation?: string;
  generatedAt: string;
  rulesVersion: string;
  missingAnswers: string[];
  evidence: Evidence[];
  complementarySources: ComplementarySource[];
  criteria: PrintableCriterion[];
}

export interface UsabilitySessionExport {
  schemaVersion: 1;
  exportedAt: string;
  purpose: 'scenario-based-usability-testing';
  containsPersonalData: false;
  answers: Answers;
  assessments: Array<{
    benefitId: string;
    benefitName: string;
    outcome: Outcome;
    path?: {
      id: string;
      label: string;
    };
    missingAnswerCount: number;
    recommendedEvidenceIds: string[];
    criteria: Array<{
      id: string;
      met: boolean | null;
      weight: 'mandatory' | 'supporting';
    }>;
    rulesVersion: string;
  }>;
}

const OUTCOME_COPY: Record<Outcome, OutcomeCopy> = {
  likely_eligible: {
    label: 'Worth exploring',
    description: 'Your answers match the current rule file well enough to look at this benefit next.',
  },
  possibly_eligible: {
    label: 'May be relevant',
    description: 'Some supporting details need care, but this benefit may still be useful to review.',
  },
  insufficient_info: {
    label: 'Need more answers',
    description: 'The rule file needs more information before this benefit can be assessed.',
  },
  unlikely: {
    label: 'Not a match',
    description: 'One or more required rules did not match your answers.',
  },
};

const OUTCOME_PRIORITY: Record<Outcome, number> = {
  likely_eligible: 0,
  possibly_eligible: 1,
  insufficient_info: 2,
  unlikely: 3,
};

export function outcomeCopy(outcome: Outcome): OutcomeCopy {
  return OUTCOME_COPY[outcome];
}

export function outcomeTone(outcome: Outcome): 'positive' | 'neutral' | 'warning' | 'negative' {
  if (outcome === 'likely_eligible') return 'positive';
  if (outcome === 'possibly_eligible') return 'neutral';
  if (outcome === 'insufficient_info') return 'warning';
  return 'negative';
}

export function getDecisiveCriterion(assessment: Assessment): AssessedCriterion | undefined {
  return assessment.criteria.find(
    (criterion) => criterion.weight === 'mandatory' && criterion.met === false,
  );
}

export function sortAssessmentsForDisplay(assessments: Assessment[]): Assessment[] {
  return [...assessments].sort(
    (a, b) => OUTCOME_PRIORITY[a.outcome] - OUTCOME_PRIORITY[b.outcome],
  );
}

export function buildPrintableReport(
  assessment: Assessment,
  explanation?: string,
): PrintableReport {
  const copy = outcomeCopy(assessment.outcome);

  return {
    title: `${assessment.benefitName} report`,
    benefitName: assessment.benefitName,
    outcomeLabel: copy.label,
    outcomeDescription: copy.description,
    pathLabel: assessment.path?.label,
    explanation: explanation || undefined,
    generatedAt: formatAssessmentDate(assessment.assessedAt),
    rulesVersion: assessment.rulesVersion,
    missingAnswers: assessment.missingAnswers,
    evidence: assessment.recommendedEvidence,
    complementarySources: assessment.complementarySources ?? [],
    criteria: assessment.criteria.map((criterion) => ({
      id: criterion.id,
      status: criterionStatus(criterion),
      explanation: criterion.explanation,
      sourceUrl: criterion.sourceUrl,
    })),
  };
}

export function buildUsabilitySessionExport({
  answers,
  assessments,
  exportedAt,
}: {
  answers: Answers;
  assessments: Assessment[];
  exportedAt: string;
}): UsabilitySessionExport {
  return {
    schemaVersion: 1,
    exportedAt,
    purpose: 'scenario-based-usability-testing',
    containsPersonalData: false,
    answers: stripUndefinedAnswers(answers),
    assessments: assessments.map((assessment) => ({
      benefitId: assessment.benefitId,
      benefitName: assessment.benefitName,
      outcome: assessment.outcome,
      path: assessment.path
        ? {
            id: assessment.path.id,
            label: assessment.path.label,
          }
        : undefined,
      missingAnswerCount: assessment.missingAnswers.length,
      recommendedEvidenceIds: assessment.recommendedEvidence.map((evidence) => evidence.id),
      criteria: assessment.criteria.map((criterion) => ({
        id: criterion.id,
        met: criterion.met,
        weight: criterion.weight,
      })),
      rulesVersion: assessment.rulesVersion,
    })),
  };
}

function stripUndefinedAnswers(answers: Answers): Answers {
  return Object.fromEntries(
    Object.entries(answers).filter(([, value]) => value !== undefined),
  ) as Answers;
}

function criterionStatus(criterion: AssessedCriterion): string {
  if (criterion.met === true) return 'Met';
  if (criterion.met === false) return 'Not met';
  return 'Missing';
}

function formatAssessmentDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(value));
}
