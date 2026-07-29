# Week 5 Printable Report Implementation Plan

**Goal:** Add a browser-printable report for each benefit result card.

**Architecture:** Keep report formatting deterministic and client-side. A pure helper prepares report rows from `Assessment`; the result card renders a hidden/revealable print section and calls `window.print()`. CSS `@media print` hides non-report UI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, CSS print media.

---

## Task 1: Report Data Helper

**Files:**

- Modify: `src/lib/intake/results.ts`
- Test: `tests/intake/results.test.ts`

**Steps:**

1. Write failing tests for report content:
   - includes benefit name, outcome label, rules version and timestamp;
   - includes criterion status strings and GOV.UK URLs;
   - includes missing answers and evidence labels.
2. Run `npm test -- tests/intake/results.test.ts` and confirm red.
3. Implement `buildPrintableReport(assessment, explanation?)`.
4. Run the same test and confirm green.

## Task 2: Result Card Print UI

**Files:**

- Modify: `src/components/assessment/AssessmentApp.tsx`
- Test: `tests/intake/assessment-app.test.ts`

**Steps:**

1. Write failing component tests:
   - first question screen does not show `Print report`;
   - result card shows `Print report`;
   - rendered report includes `rulesVersion`.
2. Run `npm test -- tests/intake/assessment-app.test.ts` and confirm red.
3. Add print action and report markup to `BenefitResultCard`.
4. Run the same test and confirm green.

## Task 3: Print CSS

**Files:**

- Modify: `src/app/globals.css`

**Steps:**

1. Add screen styles for report section.
2. Add `@media print` styles that hide `.no-print` and non-selected content, then show `.print-report`.
3. Run build and inspect for CSS errors.

## Task 4: Worklog, Verification, Deploy

**Files:**

- Modify: `../WORKLOG.md`

**Commands:**

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run test:coverage
npm run build
npx vitest run --root verissimo
npx vercel --prod
```

Production smoke:

- `/` returns 200 and includes `VERISSIMO`;
- `/api/assess` returns three assessments.
