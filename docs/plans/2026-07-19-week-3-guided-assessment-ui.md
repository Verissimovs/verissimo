# Week 3 Guided Assessment UI Implementation Plan

**Goal:** Replace the default Next.js page with an accessible guided assessment UI that collects answers, calls the deterministic rules engine, and shows summary-first results for AA, UC, and PIP.

**Architecture:** Keep rules logic server-side. The interactive UI is a Client Component that stores answers locally and posts them to `app/api/assess/route.ts`; the Route Handler calls `assessAll`. Presentation helpers stay in pure TypeScript so they can be tested without a React test harness.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, existing YAML/Zod rules engine.

---

## Constraints

- No LLM decision-making.
- No account, database, or PII persistence.
- No absolute eligibility wording.
- No blue/purple AI-gradient visual system.
- No git commits; update `WORKLOG.md` instead.
- Use TDD for behavior changes.

---

## Task 1: Intake Question Config

**Files:**

- Create: `src/lib/intake/questions.ts`
- Test: `tests/intake/questions.test.ts`

**Step 1: Write failing tests**

Create tests that assert:

- all questions have unique IDs;
- all answer keys are unique;
- question config covers every rule `answer` key used by AA, UC, and PIP YAML;
- section order is `about`, `health`, `money`, `residence`;
- every question has non-empty label and helper text.

Run:

```powershell
npx vitest run tests/intake/questions.test.ts
```

Expected: fail because module does not exist.

**Step 2: Implement minimal config**

Create `questions.ts` with:

- `QuestionSection = 'about' | 'health' | 'money' | 'residence'`
- `QuestionType = 'boolean' | 'number'`
- `QuestionConfig`
- `QUESTIONS`
- `SECTION_LABELS`
- `getAnsweredValue`

Model `Not sure` by deleting/omitting that answer key, not by storing a string. This preserves engine `missingAnswers` behavior.

**Step 3: Verify**

Run:

```powershell
npx vitest run tests/intake/questions.test.ts
```

Expected: pass.

---

## Task 2: Result Presentation Helpers

**Files:**

- Create: `src/lib/intake/results.ts`
- Test: `tests/intake/results.test.ts`

**Step 1: Write failing tests**

Assert:

- `outcomeCopy('likely_eligible')` returns "Worth exploring";
- no outcome copy contains `eligible`, `guaranteed`, `approved`, or `entitled`;
- `getDecisiveCriterion` returns first failed mandatory criterion;
- `getDecisiveCriterion` returns `undefined` if no mandatory criterion failed;
- `sortAssessmentsForDisplay` puts `likely_eligible`, `possibly_eligible`, `insufficient_info`, `unlikely` in that order.

Run:

```powershell
npx vitest run tests/intake/results.test.ts
```

Expected: fail because module does not exist.

**Step 2: Implement helpers**

Create helpers:

- `outcomeCopy(outcome)`
- `outcomeTone(outcome)`
- `getDecisiveCriterion(assessment)`
- `sortAssessmentsForDisplay(assessments)`

Use existing `Assessment` and `Outcome` types.

**Step 3: Verify**

Run:

```powershell
npx vitest run tests/intake/results.test.ts
```

Expected: pass.

---

## Task 3: Assessment API Route

**Files:**

- Create: `src/app/api/assess/route.ts`
- Test: `tests/intake/assess-route.test.ts`

**Step 1: Write failing tests**

Import `POST` from the route. Construct a `Request` with JSON body:

```ts
new Request('http://localhost/api/assess', {
  method: 'POST',
  body: JSON.stringify({ answers: { age: 70 } }),
});
```

Assert:

- status `200`;
- response has `assessments`;
- response contains exactly three benefit IDs;
- bad JSON shape returns `400`.

Run:

```powershell
npx vitest run tests/intake/assess-route.test.ts
```

Expected: fail because route does not exist.

**Step 2: Implement route**

Create `POST(request: Request)`.

- Parse JSON.
- Validate that `answers` is an object.
- Call `assessAll(answers as Answers)`.
- Return `Response.json({ assessments })`.
- On bad input return `Response.json({ error: 'Invalid answers payload' }, { status: 400 })`.

**Step 3: Verify**

Run:

```powershell
npx vitest run tests/intake/assess-route.test.ts
```

Expected: pass.

---

## Task 4: Guided Assessment UI

**Files:**

- Create: `src/components/assessment/AssessmentApp.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Implement client app**

`AssessmentApp.tsx`:

- starts at question index 0;
- renders disclaimer;
- renders section progress;
- renders one question;
- Back/Continue buttons;
- answer controls;
- on final continue, POSTs to `/api/assess`;
- renders loading state while pending;
- renders result summary after API response;
- reset session clears state.

Use semantic HTML:

- `<main>`
- `<section>`
- `<fieldset>` + `<legend>` for answer groups;
- visible labels;
- buttons with clear text.

**Step 2: Replace default page**

`page.tsx` imports and renders `<AssessmentApp />`.

`layout.tsx` metadata:

- title `VERISSIMO - Benefits eligibility assistant`
- description `Guided UK benefits eligibility and evidence assistant`

**Step 3: Manual smoke**

Run:

```powershell
npm run dev
```

Open local app. Verify:

- first question visible;
- answer then Continue works;
- Back works;
- final results show three benefit cards;
- reset works.

---

## Task 5: Sage Visual System

**Files:**

- Modify: `src/app/globals.css`
- Modify: `src/components/assessment/AssessmentApp.tsx`

**Step 1: Add tokens**

Define CSS variables:

- `--color-primary: #365a44`
- `--color-primary-action: #3f7d55`
- `--color-background: #f4f7f2`
- `--color-surface: #ffffff`
- `--color-foreground: #14251a`
- `--color-muted: #5e7163`
- `--color-border: #dce7d8`
- `--color-warning: #92400e`
- `--color-destructive: #b91c1c`

**Step 2: Apply UI polish**

- cards radius max 8px;
- 44px+ button/input height;
- clear focus ring;
- no horizontal scroll at 320px;
- no gradient/orb decoration.

---

## Task 6: Documentation And Worklog

**Files:**

- Modify: `WORKLOG.md`
- Optional modify: `PLANO-SEMANA-2.md` only if implementation changes affect Week 2 docs.

Add one row:

- category `Implementation`;
- describe Week 3 guided UI, internal assess API, sage design, summary-first results;
- hours `_confirm_`.

---

## Task 7: Final Verification And Deploy

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

Expected:

- all tests pass;
- TypeScript clean;
- lint clean;
- coverage stays above 80%;
- build passes;
- production URL loads new UI.

Update `WORKLOG.md` with deploy evidence if production deploy succeeds.

