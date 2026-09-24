import { expect, test, type Locator, type Page } from '@playwright/test';

const mockAssessments = [
  {
    benefitId: 'attendance-allowance',
    benefitName: 'Attendance Allowance',
    outcome: 'insufficient_info',
    criteria: [
      {
        id: 'aa-age',
        met: null,
        weight: 'mandatory',
        explanation: 'State Pension age must be checked.',
        sourceUrl: 'https://cpag.org.uk/welfare-rights#online-handbooks',
      },
    ],
    missingAnswers: ['aa_is_state_pension_age_or_over'],
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

test('guided assessment can be completed with keyboard input only', async ({ page }) => {
  // Walks every question by Tab key presses, so it needs more time than the default 30s.
  test.setTimeout(120_000);

  await page.route('**/api/assess', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ assessments: mockAssessments }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'VERISSIMO' })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to assessment' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#assessment-content$/);

  for (let step = 0; step < 40; step += 1) {
    if (await page.getByRole('heading', { name: 'Benefits worth reviewing' }).isVisible()) {
      break;
    }

    const numericInput = page.getByLabel('Enter a number');
    if (await numericInput.isVisible()) {
      await focusByTab(page, numericInput);
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type('1');
    } else {
      const notSure = page.getByRole('button', { name: 'Not sure' });
      await focusByTab(page, notSure);
      await page.keyboard.press('Enter');
      await expect(notSure).toHaveAttribute('aria-pressed', 'true');
    }

    const next = (await page.getByRole('button', { name: 'See results' }).isVisible())
      ? page.getByRole('button', { name: 'See results' })
      : page.getByRole('button', { name: 'Continue' });
    const nextLabel = (await next.textContent())?.trim();
    await focusByTab(page, next);
    await page.keyboard.press('Enter');

    if (nextLabel === 'See results') {
      await expect(page.getByRole('heading', { name: 'Benefits worth reviewing' })).toBeVisible();
      break;
    }
  }

  await expect(page.getByRole('heading', { name: 'Benefits worth reviewing' })).toBeVisible();
  await focusByTab(page, page.getByRole('button', { name: 'Export anonymised usability session JSON' }));
  await expect(page.getByRole('button', { name: 'Export anonymised usability session JSON' })).toBeFocused();
});

async function focusByTab(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isFocused(target)) return;
    await page.keyboard.press('Tab');
  }

  throw new Error('Target was not reachable through Tab navigation');
}

async function isFocused(target: Locator): Promise<boolean> {
  return target.evaluate((element) => element === document.activeElement).catch(() => false);
}
