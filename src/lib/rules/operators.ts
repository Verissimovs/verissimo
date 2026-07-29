import type { Operator } from './schema';

type AnswerValue = string | number | boolean;
type ExpectedValue = AnswerValue | AnswerValue[] | undefined;

/**
 * Avalia um único critério.
 *
 * Devolve null quando a pergunta ainda não foi respondida — um estado
 * legítimo, que o motor traduz em insufficient_info. Lança erro quando o
 * tipo da resposta não bate com o operador, porque isso é defeito do
 * código e não estado do usuário.
 */
export function applyOperator(
  op: Operator,
  answer: AnswerValue | undefined,
  expected: ExpectedValue,
): boolean | null {
  if (answer === undefined || answer === null || answer === '') return null;

  switch (op) {
    case 'gte':
    case 'lte': {
      if (typeof answer !== 'number' || typeof expected !== 'number') {
        throw new TypeError(
          `operator '${op}' expects numbers, received ${typeof answer} and ${typeof expected}`,
        );
      }
      return op === 'gte' ? answer >= expected : answer <= expected;
    }

    case 'eq':
      return answer === expected;

    case 'in': {
      if (!Array.isArray(expected)) {
        throw new TypeError("operator 'in' expects an array of allowed values");
      }
      return expected.includes(answer);
    }

    case 'is_true': {
      if (typeof answer !== 'boolean') {
        throw new TypeError(`operator 'is_true' expects a boolean, received ${typeof answer}`);
      }
      return answer;
    }
  }
}
