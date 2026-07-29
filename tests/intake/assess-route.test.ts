import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/assess/route';

const requestWithJson = (body: unknown) =>
  new Request('http://localhost/api/assess', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

describe('POST /api/assess', () => {
  it('returns three assessments for a valid answers payload', async () => {
    const response = await POST(
      requestWithJson({
        answers: {
          age: 70,
          uc_low_income_or_needs_living_cost_help: true,
          pip_age: 40,
        },
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.assessments.map((item: { benefitId: string }) => item.benefitId).sort()).toEqual([
      'attendance-allowance',
      'personal-independence-payment',
      'universal-credit',
    ]);
  });

  it('rejects a payload without an answers object', async () => {
    const response = await POST(requestWithJson({ answers: null }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid answers payload');
  });
});
