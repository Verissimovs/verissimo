import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `rules/` guarda os arquivos YAML de elegibilidade, lidos em runtime por
   * `src/lib/rules/load.ts`. Nenhum módulo os *importa* — são lidos do disco
   * via fs — então o file tracing do Next não tem referência para seguir e
   * não os incluiria no bundle serverless.
   *
   * Sem esta entrada o modo de falha é o pior possível: todos os testes
   * passam localmente e `loadBenefit` estoura em produção, com o erro
   * aparecendo só na demo ao vivo. A chave é um glob de rota; `'/*'` cobre
   * todas as rotas, e o valor resolve a partir da raiz do projeto.
   */
  outputFileTracingIncludes: {
    '/*': ['./rules/**/*'],
  },
};

export default nextConfig;
