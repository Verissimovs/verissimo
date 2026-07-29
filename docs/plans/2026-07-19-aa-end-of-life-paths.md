# Attendance Allowance End-Of-Life Paths Implementation Plan

**Goal:** Add path-aware Attendance Allowance ordinary and end-of-life flows.

**Architecture:** Add optional `paths` to rule files, evaluate every path, return selected path metadata in `Assessment`, and render path label in prompt/report/UI.

**Tech Stack:** Next.js 16, TypeScript, Zod, YAML, Vitest, Playwright/axe.

---

1. Add failing schema/load/engine/intake/report/prompt tests.
2. Implement schema and loader validation for `paths`.
3. Implement engine path selection and selected-path assessment output.
4. Update AA YAML and intake question.
5. Update report/prompt/card rendering.
6. Run full gate and deploy.
