import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AssessmentApp, BenefitResultCard, ResultsView } from '@/components/assessment/AssessmentApp';
import type { Assessment } from '@/lib/rules/schema';

const assessment: Assessment = {
  benefitId: 'universal-credit',
  benefitName: 'Universal Credit',
  outcome: 'insufficient_info',
  criteria: [
    {
      id: 'uc-savings',
      met: null,
      weight: 'mandatory',
      explanation: 'Savings must be checked.',
      sourceUrl: 'https://cpag.org.uk/welfare-rights/key-topics/universal-credit/universal-credit-basics#who-can-get-universal-credit',
    },
  ],
  missingAnswers: ['uc_savings_and_investments'],
  recommendedEvidence: [],
  complementarySources: [
    {
      label: 'GOV.UK Universal Credit eligibility',
      url: 'https://www.gov.uk/universal-credit/eligibility',
      description: 'Official GOV.UK eligibility page used as a complementary check.',
    },
  ],
  assessedAt: '2026-07-19T00:00:00.000Z',
  rulesVersion: '123456abcdef',
};

describe('AssessmentApp', () => {
  it('renders the guided assessment entry screen with the persistent disclaimer', () => {
    const html = renderToStaticMarkup(React.createElement(AssessmentApp));

    expect(html).toContain('This is not official advice');
    expect(html).toContain('Decision lab');
    expect(html).toContain('Your guide to UK welfare benefits');
    expect(html).toContain('AI-assisted explanations');
    expect(html).toContain('Start a new assessment');
    expect(html).toContain('Benefits we currently cover');
    expect(html).toContain('More benefits planned');
    expect(html).toContain('Rule engine active');
    expect(html).toContain('CPAG primary source');
    expect(html).toContain('GOV.UK complementary check');
    expect(html).toContain('Have you reached State Pension age?');
    expect(html).toContain('About you');
  });

  it('associates question helper text and answer state with accessible controls', () => {
    const html = renderToStaticMarkup(React.createElement(AssessmentApp));

    expect(html).toContain('aria-describedby="aa-state-pension-age-helper"');
    expect(html).toContain('id="aa-state-pension-age-helper"');
    expect(html).toContain('aria-pressed="false"');
  });

  it('renders overall progress as an accessible progress bar', () => {
    const html = renderToStaticMarkup(React.createElement(AssessmentApp));

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Assessment progress"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="26"');
  });

  it('does not render the simpler explanation action on the first question screen', () => {
    const html = renderToStaticMarkup(React.createElement(AssessmentApp));

    expect(html).not.toContain('Make this easier to read');
    expect(html).not.toContain('Print report');
  });

  it('renders the simpler explanation action on result cards', () => {
    const html = renderToStaticMarkup(React.createElement(BenefitResultCard, { assessment }));

    expect(html).toContain('Make this easier to read');
  });

  it('renders printable report content on result cards', () => {
    const html = renderToStaticMarkup(React.createElement(BenefitResultCard, { assessment }));

    expect(html).toContain('Print report');
    expect(html).toContain('Printable report');
    expect(html).toContain('Rules version');
    expect(html).toContain('123456abcdef');
    expect(html).toContain('uc-savings');
  });

  it('gives repeated result-card actions benefit-specific accessible names', () => {
    const html = renderToStaticMarkup(React.createElement(BenefitResultCard, { assessment }));

    expect(html).toContain('aria-label="Assessment outcome: Need more answers"');
    expect(html).toContain('aria-label="Make Universal Credit result easier to read"');
    expect(html).toContain('aria-label="Print Universal Credit report"');
    expect(html).toContain('Show Universal Credit CPAG rule trace and GOV.UK complementary sources');
    expect(html).toContain('Complementary official source');
    expect(html).toContain('GOV.UK Universal Credit eligibility');
  });

  it('renders an anonymised usability export action on the results screen', () => {
    const html = renderToStaticMarkup(
      React.createElement(ResultsView, {
        answers: { uc_savings_and_investments: 1000 },
        assessments: [assessment],
        onReset: () => undefined,
      }),
    );

    expect(html).toContain('Export study JSON');
    expect(html).toContain('aria-label="Export anonymised usability session JSON"');
  });
});
