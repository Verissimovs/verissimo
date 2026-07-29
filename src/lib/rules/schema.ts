import { z } from 'zod';

/**
 * Os únicos operadores que uma regra pode usar.
 *
 * Deliberadamente pequeno e declarativo. As regras nunca contêm código
 * executável e nunca passam por eval: um arquivo de regras é dado, não
 * programa. Isso elimina risco de injeção e mantém cada critério legível
 * por quem não programa.
 */
export const OperatorSchema = z.enum(['gte', 'lte', 'eq', 'in', 'is_true']);
export type Operator = z.infer<typeof OperatorSchema>;

const AnswerValueSchema = z.union([z.string(), z.number(), z.boolean()]);

/**
 * Todos os objetos são strict: uma chave desconhecida é erro, não lixo
 * ignorado. Um arquivo de regras é artefato de auditoria, e `z.object`
 * comum descartaria `wieght:` em silêncio — o critério perderia o peso
 * sem que nada reclamasse.
 */
export const CriterionSchema = z
  .strictObject({
    id: z.string().min(1),
    /** Chave da resposta do usuário que este critério consulta. */
    answer: z.string().min(1),
    op: OperatorSchema,
    value: z.union([AnswerValueSchema, z.array(AnswerValueSchema)]).optional(),
    weight: z.enum(['mandatory', 'supporting']),
    /** Frase, em linguagem simples, que justifica o critério ao usuário. */
    explanation: z.string().min(1),
    /**
     * Âncora dentro da source_url do benefício. Precisa começar com '#'
     * porque o motor concatena source_url + source_anchor: sem o '#' a
     * citação vira uma URL quebrada, sem erro em lugar nenhum.
     */
    source_anchor: z.string().min(1).regex(/^#/, "source_anchor must start with '#'"),
  })
  /**
   * Concordância entre `op` e `value`. Isto roda no carregamento, não no
   * meio de uma avaliação: quem escreve regra não é programador, e o erro
   * precisa aparecer ao validar o arquivo, não na cara de um claimant.
   */
  .superRefine((c, ctx) => {
    if (c.op === 'is_true') {
      if (c.value !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: "criteria using 'is_true' must not define a value",
          path: ['value'],
        });
      }
      return;
    }

    if (c.value === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: "criteria using an operator other than 'is_true' must define a value",
        path: ['value'],
      });
      return;
    }

    if ((c.op === 'gte' || c.op === 'lte') && typeof c.value !== 'number') {
      ctx.addIssue({
        code: 'custom',
        message: `criteria using '${c.op}' must define value as a number`,
        path: ['value'],
      });
    }

    if (c.op === 'in' && !Array.isArray(c.value)) {
      ctx.addIssue({
        code: 'custom',
        message: "criteria using 'in' must define value as an array",
        path: ['value'],
      });
    }
  });

export const EvidenceSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  /** IDs de critério que, uma vez atendidos, tornam esta evidência relevante. */
  required_when: z.array(z.string()),
  why: z.string().min(1),
});

export const PathSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  criteria: z.array(z.string().min(1)).min(1),
});

export const ComplementarySourceSchema = z.strictObject({
  label: z.string().min(1),
  url: z.url(),
  description: z.string().min(1),
});

export const BenefitFileSchema = z
  .strictObject({
    benefit: z.strictObject({
      id: z.string().min(1),
      name: z.string().min(1),
      source_url: z.url(),
      complementary_sources: z.array(ComplementarySourceSchema).optional(),
      last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'last_verified must be YYYY-MM-DD'),
    }),
    criteria: z.array(CriterionSchema).min(1),
    evidence: z.array(EvidenceSchema),
    paths: z.array(PathSchema).optional(),
  })
  /**
   * IDs de critério únicos. `evidence.required_when` referencia critérios
   * por id; com ids repetidos a busca fica ambígua e uma evidência pode
   * acabar ligada ao critério errado.
   */
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    file.criteria.forEach((criterion, index) => {
      if (seen.has(criterion.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate criterion id '${criterion.id}'`,
          path: ['criteria', index, 'id'],
        });
      }
      seen.add(criterion.id);
    });

    const criterionIds = new Set(file.criteria.map((criterion) => criterion.id));
    const pathIds = new Set<string>();
    file.paths?.forEach((path, pathIndex) => {
      if (pathIds.has(path.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate path id '${path.id}'`,
          path: ['paths', pathIndex, 'id'],
        });
      }
      pathIds.add(path.id);

      path.criteria.forEach((criterionId, criterionIndex) => {
        if (!criterionIds.has(criterionId)) {
          ctx.addIssue({
            code: 'custom',
            message: `path '${path.id}' references unknown criterion '${criterionId}'`,
            path: ['paths', pathIndex, 'criteria', criterionIndex],
          });
        }
      });
    });
  });

export type Criterion = z.infer<typeof CriterionSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type AssessmentPathDefinition = z.infer<typeof PathSchema>;
export type ComplementarySource = z.infer<typeof ComplementarySourceSchema>;
export type BenefitFile = z.infer<typeof BenefitFileSchema>;

/** Os quatro estados possíveis. Note que não existe um "eligible" absoluto. */
export type Outcome = 'likely_eligible' | 'possibly_eligible' | 'unlikely' | 'insufficient_info';

export interface AssessedCriterion {
  id: string;
  met: boolean | null; // null = ainda não respondido
  weight: 'mandatory' | 'supporting';
  explanation: string;
  sourceUrl: string;
}

export interface Assessment {
  benefitId: string;
  benefitName: string;
  outcome: Outcome;
  criteria: AssessedCriterion[];
  missingAnswers: string[];
  recommendedEvidence: Evidence[];
  complementarySources?: ComplementarySource[];
  assessedAt: string;
  rulesVersion: string;
  path?: {
    id: string;
    label: string;
    outcome: Outcome;
  };
}

export type Answers = Record<string, string | number | boolean | undefined>;
