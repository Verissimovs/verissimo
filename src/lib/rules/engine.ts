import { loadBenefit, loadAllBenefits, type LoadedBenefit } from './load';
import { applyOperator } from './operators';
import { deriveOutcome } from './outcome';
import type {
  Answers,
  Assessment,
  AssessmentPathDefinition,
  AssessedCriterion,
  Evidence,
  Outcome,
} from './schema';

const OUTCOME_RANK: Record<Outcome, number> = {
  likely_eligible: 0,
  possibly_eligible: 1,
  insufficient_info: 2,
  unlikely: 3,
};

/**
 * Avalia as respostas do usuário contra um benefício.
 *
 * Puro e síncrono: sem rede, sem LLM, sem aleatoriedade. As mesmas
 * respostas produzem sempre o mesmo Assessment. É essa propriedade que
 * torna o resultado auditável e a demo reproduzível.
 */
export function assess(benefitId: string, answers: Answers): Assessment {
  return assessLoaded(loadBenefit(benefitId), answers);
}

/** Avalia as respostas contra todos os benefícios conhecidos. */
export function assessAll(answers: Answers): Assessment[] {
  return loadAllBenefits().map((benefit) => assessLoaded(benefit, answers));
}

function assessLoaded({ file, rulesVersion }: LoadedBenefit, answers: Answers): Assessment {
  const allCriteria: AssessedCriterion[] = file.criteria.map((criterion) => ({
    id: criterion.id,
    met: applyOperator(criterion.op, answers[criterion.answer], criterion.value),
    weight: criterion.weight,
    explanation: criterion.explanation,
    sourceUrl: `${file.benefit.source_url}${criterion.source_anchor}`,
  }));

  const selectedPath = selectPath(file.paths, allCriteria);
  const selectedCriterionIds = new Set(
    selectedPath?.definition.criteria ?? file.criteria.map((criterion) => criterion.id),
  );
  const criteria = allCriteria.filter((criterion) => selectedCriterionIds.has(criterion.id));

  const missingAnswers = file.criteria
    .filter((criterion) => selectedCriterionIds.has(criterion.id))
    .filter((criterion) => allCriteria.find((assessed) => assessed.id === criterion.id)?.met === null)
    .map((criterion) => criterion.answer);

  const metCriteria = new Set(criteria.filter((criterion) => criterion.met === true).map((c) => c.id));
  const recommendedEvidence: Evidence[] = file.evidence.filter((evidence) =>
    evidence.required_when.every(
      (criterionId) => selectedCriterionIds.has(criterionId) && metCriteria.has(criterionId),
    ),
  );
  const outcome = deriveOutcome(criteria);

  return {
    benefitId: file.benefit.id,
    benefitName: file.benefit.name,
    outcome,
    criteria,
    missingAnswers: [...new Set(missingAnswers)],
    recommendedEvidence,
    complementarySources: file.benefit.complementary_sources ?? [],
    assessedAt: new Date().toISOString(),
    rulesVersion,
    path: selectedPath
      ? {
          id: selectedPath.definition.id,
          label: selectedPath.definition.label,
          outcome: selectedPath.outcome,
        }
      : undefined,
  };
}

function selectPath(
  paths: AssessmentPathDefinition[] | undefined,
  allCriteria: AssessedCriterion[],
): { definition: AssessmentPathDefinition; outcome: Outcome; missingCount: number } | undefined {
  if (!paths || paths.length === 0) return undefined;

  const criteriaById = new Map(allCriteria.map((criterion) => [criterion.id, criterion]));

  return paths
    .map((definition) => {
      const criteria = definition.criteria
        .map((criterionId) => criteriaById.get(criterionId))
        .filter((criterion): criterion is AssessedCriterion => Boolean(criterion));
      return {
        definition,
        outcome: deriveOutcome(criteria),
        missingCount: criteria.filter((criterion) => criterion.met === null).length,
      };
    })
    .sort(
      (a, b) =>
        OUTCOME_RANK[a.outcome] - OUTCOME_RANK[b.outcome] ||
        a.missingCount - b.missingCount,
    )[0];
}
