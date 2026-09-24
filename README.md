# VERISSIMO — AI-Assisted UK Welfare Benefits Decision-Support Platform

VERISSIMO is a prototype web platform developed as part of a BSc (Hons) Computing dissertation project at Southampton Solent University (Module QHO656). It combines a deterministic, rule-based eligibility assessment engine with a constrained AI-assisted explanation layer, helping users understand potential UK welfare benefit eligibility, the evidence they may need, and the reasoning behind each assessment.

**This is a research prototype.** It does not make official eligibility decisions and is not a replacement for professional welfare advice.

## How it works

1. A guided questionnaire collects the user's circumstances.
2. A deterministic rules engine (criteria defined in `rules/*.yaml`) evaluates the answers and produces an assessment outcome, including missing information and recommended evidence.
3. The Gemini API is used only to explain the assessment trace in plain language. It does not decide eligibility, and its output is validated before being shown to the user (no unsupported claims, unknown sources or prohibited decision wording).

## Project structure

- `src/app` — Next.js App Router pages and API routes (`/api/assess`, `/api/explain`)
- `src/components` — assessment UI (guided questionnaire)
- `src/lib/rules` — deterministic rules engine, YAML loader, operators, schema
- `src/lib/explanations` — Gemini API integration and response validation
- `src/lib/intake` — question definitions, readability checks, results formatting
- `rules/*.yaml` — benefit eligibility criteria (Attendance Allowance, PIP, Universal Credit)
- `tests/` — automated unit and integration tests (Vitest)
- `tests/e2e/` — accessibility and keyboard-navigation tests (Playwright)
- `docs/ethics/` — supporting research ethics documentation (consent form, participant information sheet, etc.)

## Getting started

### 1. Install Node.js

This project requires Node.js (LTS recommended) — https://nodejs.org

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and add your own Gemini API key:

```bash
cp .env.local.example .env.local
```

```
GEMINI_API_KEY=your-own-api-key-here
```

A key can be obtained from Google AI Studio (https://aistudio.google.com/). `GOOGLE_API_KEY` is also accepted as an alternative variable name. No API key is included in this repository for security reasons, and `.env.local` is excluded from version control by `.gitignore`.

The key is optional: without it, the rules engine and the whole assessment flow still work, and the "Make this easier to read" action falls back to deterministic template explanations.

### 4. Run the development server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Running the tests

```bash
npm test            # automated unit/integration tests (Vitest)
npm run test:coverage  # tests with coverage report
npm run test:a11y   # accessibility and keyboard-navigation tests (Playwright)
```

At the time of submission, all 119 automated tests passed across 14 test files, and all 3 Playwright accessibility/keyboard tests passed with no automated accessibility violations detected on the tested screens.

## Building for production

```bash
npm run build
npm run start
```

## Source code

The source code is available at: https://github.com/Verissimovs/verissimo

## Live deployment

A deployed version of the prototype is available at: https://verissimo-tawny.vercel.app

## Author

Viviane Veríssimo dos Santos — Student ID 10332487
Southampton Solent University, BSc (Hons) Computing, QHO656 Dissertation Project
Supervisors: Dr Edita Gashi and Chathurika Goonawardane
