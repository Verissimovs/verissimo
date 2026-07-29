import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { BenefitFileSchema, type BenefitFile } from './schema';

/**
 * Localiza o diretório `rules/`, tentando dois candidatos nesta ordem.
 *
 * Nenhuma das duas estratégias basta sozinha, e cada uma cobre exatamente
 * o buraco da outra:
 *
 *   1. **Relativo ao módulo.** Este arquivo vive em `src/lib/rules/`, então
 *      a raiz do projeto está três níveis acima. Funciona sob o Vitest e em
 *      `next dev`, e independe de onde o processo foi iniciado — um caminho
 *      via `process.cwd()` sozinho quebra ao rodar de outro diretório
 *      (por exemplo `vitest --root verissimo` a partir da pasta pai).
 *   2. **Relativo ao cwd.** Quando o Next empacota este módulo para
 *      serverless, o código passa a viver em `.next/server/...` e o cálculo
 *      relativo ao módulo aponta para o lugar errado. Nesse ambiente o cwd
 *      é a raiz do projeto, então o candidato 2 é o que resolve.
 *
 * Cuidado: isto resolve o *caminho*, não o *empacotamento*. `rules/` é um
 * diretório de dados que nenhum módulo importa, então o file tracing do Next
 * não tem referência para seguir e pode não incluí-lo no bundle. Por isso o
 * `next.config.ts` declara `outputFileTracingIncludes`. Sem essa entrada,
 * nenhuma estratégia de caminho salva: o arquivo simplesmente não está lá.
 *
 * Calculado por chamada, e não uma vez no topo do módulo, para que os testes
 * de independência de cwd possam mockar `process.cwd()`: fixado numa
 * constante de módulo, a captura aconteceria antes do mock e o teste passaria
 * à toa.
 */
function rulesDir(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(moduleDir, '..', '..', '..', 'rules'),
    path.join(process.cwd(), 'rules'),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (found) return found;

  throw new Error(
    `Could not locate the rules directory. Tried:\n  ${candidates.join('\n  ')}\n` +
      'In a serverless build this usually means rules/ was not traced into the bundle — ' +
      'check outputFileTracingIncludes in next.config.ts.',
  );
}

export interface LoadedBenefit {
  file: BenefitFile;
  /** Hash curto do YAML bruto. Torna todo Assessment rastreável até a versão exata da regra. */
  rulesVersion: string;
}

export function loadBenefit(benefitId: string): LoadedBenefit {
  const filePath = path.join(rulesDir(), `${benefitId}.yaml`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`No rules file found for benefit '${benefitId}' at ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = BenefitFileSchema.parse(parse(raw));

  const knownCriteria = new Set(parsed.criteria.map((c) => c.id));
  for (const evidence of parsed.evidence) {
    for (const ref of evidence.required_when) {
      if (!knownCriteria.has(ref)) {
        throw new Error(
          `Evidence '${evidence.id}' in ${benefitId}.yaml requires unknown criterion '${ref}'`,
        );
      }
    }
  }

  return {
    file: parsed,
    rulesVersion: crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12),
  };
}

export function loadAllBenefits(): LoadedBenefit[] {
  return fs
    .readdirSync(rulesDir())
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => loadBenefit(path.basename(name, '.yaml')));
}
