import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/explain/route';
import type { Assessment } from '@/lib/rules/schema';

const assessment: Assessment = {
  benefitId: 'universal-credit',
  benefitName: 'Universal Credit',
  outcome: 'insufficient_info',
  criteria: [],
  missingAnswers: ['uc_savings_and_investments'],
  recommendedEvidence: [],
  assessedAt: '2026-07-19T00:00:00.000Z',
  rulesVersion: '123456abcdef',
};

const requestWithJson = (body: unknown) =>
  new Request('http://localhost/api/explain', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

describe('POST /api/explain', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns fallback explanation text for a valid assessment without an API key', async () => {
    const response = await POST(requestWithJson({ assessment }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.explanation.mode).toBe('fallback');
    expect(json.explanation.text).toContain('Universal Credit');
  });

  it('returns LLM explanation when Gemini is configured and the output is valid', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output_text:
            'Universal Credit needs more information from these answers. The savings question is still missing. This is not official advice.',
        }),
      }),
    );

    const response = await POST(requestWithJson({ assessment }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.explanation.mode).toBe('llm');
    expect(json.explanation.text).toContain('savings question');
  });

  it('falls back when Gemini output fails guardrails', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output_text: 'You are eligible and approved.',
        }),
      }),
    );

    const response = await POST(requestWithJson({ assessment }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.explanation.mode).toBe('fallback');
  });

  it('rejects an invalid payload', async () => {
    const response = await POST(requestWithJson({ assessment: null }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid assessment payload');
  });
});
