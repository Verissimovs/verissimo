# Week 4 Explanation Layer Implementation Plan

**Goal:** Add deterministic template explanations and an optional bounded LLM paraphrase API for result cards.

**Architecture:** Explanation logic lives server-side/pure TypeScript. Template explanation always works. `POST /api/explain` accepts one `Assessment`, tries optional provider only if configured, validates output, and falls back to template on any failure. Client UI adds a per-card "Make this easier to read" action.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, existing rules engine types.

---

## Task 1: Template Explanation

**Files:**

- Create: `src/lib/explanations/template.ts`
- Test: `tests/explanations/template.test.ts`

**Steps:**

1. Write failing tests:
   - no forbidden absolute words in any template output;
   - `unlikely` explanation includes decisive failed criterion explanation;
   - `insufficient_info` explanation mentions missing answers;
   - output includes not-official-advice warning.
2. Run `npx vitest run tests/explanations/template.test.ts` and confirm red.
3. Implement `createTemplateExplanation(assessment)`.
4. Run same test and confirm green.

## Task 2: LLM Prompt And Validator

**Files:**

- Create: `src/lib/explanations/llm.ts`
- Test: `tests/explanations/llm.test.ts`

**Steps:**

1. Write failing tests:
   - prompt includes criterion IDs, source URLs, and "do not decide";
   - validator rejects forbidden words;
   - validator rejects GOV.UK URLs not in trace;
   - validator rejects output over 180 words;
   - validator accepts safe paraphrase.
2. Run test and confirm red.
3. Implement `buildExplanationPrompt(assessment)` and `validateLlmExplanation(text, assessment)`.
4. Run test and confirm green.

## Task 3: Explain API Route

**Files:**

- Create: `src/app/api/explain/route.ts`
- Test: `tests/explanations/explain-route.test.ts`

**Steps:**

1. Write failing tests:
   - valid assessment returns explanation text;
   - without API key, mode is `fallback`;
   - invalid payload returns `400`.
2. Run test and confirm red.
3. Implement `POST`.
4. Do not wire real provider yet unless key exists.
5. Run test and confirm green.

## Task 4: Result Card UI

**Files:**

- Modify: `src/components/assessment/AssessmentApp.tsx`
- Test: `tests/intake/assessment-app.test.ts`

**Steps:**

1. Extend component smoke test to assert "Make this easier to read" does not render on first question screen.
2. Add a pure exported child/helper only if needed for testability.
3. Implement per-result button and explanation panel inside each card.
4. Manual browser smoke through full wizard:
   - click explanation button;
   - see loading then simpler explanation panel.

## Task 5: Docs And Worklog

**Files:**

- Modify: `WORKLOG.md`

Add rows for:

- design/spec;
- implementation;
- verification/deploy if deployed.

## Task 6: Final Verification And Deploy

Run:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run test:coverage
npm run build
```

Then deploy:

```powershell
npx vercel --prod
```

Verify production:

- `/` returns 200 and includes `VERISSIMO`;
- `/api/explain` returns fallback explanation without API key.

