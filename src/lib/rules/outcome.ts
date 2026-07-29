import type { AssessedCriterion, Outcome } from './schema';

/**
 * Deriva o resultado a partir dos critérios avaliados.
 *
 * Precedência, e a razão de cada passo:
 *
 *   1. Um critério obrigatório reprovado é decisivo — nenhuma resposta
 *      futura reverte isso. Vira unlikely mesmo que outros estejam em branco.
 *   2. Um critério obrigatório em branco significa que ainda não sabemos.
 *      Nunca inferir a favor nem contra: insufficient_info.
 *   3. Todos os obrigatórios atendidos e nenhum acessório pendente
 *      ou reprovado: likely_eligible.
 *   4. Todos os obrigatórios atendidos, mas algum acessório reprovado ou
 *      em branco: possibly_eligible.
 *
 * Não existe um estado "eligible" absoluto. O sistema é decision support:
 * a decisão final é do claimant e da autoridade pública, e a interface do
 * tipo Outcome torna impossível o código afirmar o contrário.
 */
export function deriveOutcome(criteria: AssessedCriterion[]): Outcome {
  if (criteria.length === 0) return 'insufficient_info';

  const mandatory = criteria.filter((c) => c.weight === 'mandatory');
  const supporting = criteria.filter((c) => c.weight === 'supporting');

  if (mandatory.some((c) => c.met === false)) return 'unlikely';
  if (mandatory.some((c) => c.met === null)) return 'insufficient_info';

  return supporting.every((c) => c.met === true) ? 'likely_eligible' : 'possibly_eligible';
}
