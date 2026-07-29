import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const mockAssessments = [
  {
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
  },
  {
    benefitId: 'attendance-allowance',
    benefitName: 'Attendance Allowance',
    outcome: 'unlikely',
    criteria: [
      {
        id: 'aa-age',
        met: false,
        weight: 'mandatory',
        explanation: 'You must be State Pension age or over.',
        sourceUrl: 'https://cpag.org.uk/welfare-rights#online-handbooks',
      },
    ],
    missingAnswers: [],
    recommendedEvidence: [],
    complementarySources: [
      {
        label: 'GOV.UK Attendance Allowance eligibility',
        url: 'https://www.gov.uk/attendance-allowance/eligibility',
        description: 'Official GOV.UK eligibility page used as a complementary check.',
      },
    ],
    assessedAt: '2026-07-19T00:00:00.000Z',
    rulesVersion: 'abcdef123456',
  },
];

test('initial assessment screen has no automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'VERISSIMO' })).toBeVisible();

  const results = await scanPage(page);

  expect(results.violations).toEqual([]);
});

test('results screen has no automated accessibility violations', async ({ page }) => {
  await page.route('**/api/assess', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ assessments: mockAssessments }),
    });
  });

  await page.goto('/');
  await completeWizardWithUnknownAnswers(page);
  await expect(page.getByRole('heading', { name: 'Benefits worth reviewing' })).toBeVisible();

  const results = await scanPage(page);

  expect(results.violations).toEqual([]);
});

async function completeWizardWithUnknownAnswers(page: Page) {
  for (let step = 0; step < 40; step += 1) {
    if (await page.getByRole('heading', { name: 'Benefits worth reviewing' }).isVisible()) {
      return;
    }

    const numericUnknown = page.getByRole('button', { name: 'I am not sure' });
    if (await numericUnknown.isVisible()) {
      await numericUnknown.click();
    } else {
      await page.getByRole('button', { name: 'Not sure' }).click();
    }

    const seeResults = page.getByRole('button', { name: 'See results' });
    if (await seeResults.isVisible()) {
      await seeResults.click();
      await expect(page.getByRole('heading', { name: 'Benefits worth reviewing' })).toBeVisible();
      return;
    }

    await page.getByRole('button', { name: 'Continue' }).click();
  }

  throw new Error('Wizard did not reach the results screen');
}

async function scanPage(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}
