import { describe, expect, it, vi } from 'vitest';
import { createGeminiExplanation, isGeminiConfigured } from '@/lib/explanations/gemini';
import type { Assessment } from '@/lib/rules/schema';

const assessment: Assessment = {
  benefitId: 'attendance-allowance',
  benefitName: 'Attendance Allowance',
  outcome: 'unlikely',
  criteria: [
    {
      id: 'aa-age',
      met: false,
      weight: 'mandatory',
      explanation: 'You must be State Pension age or over.',
      sourceUrl: 'https://www.gov.uk/attendance-allowance/eligibility#eligibility',
    },
  ],
  missingAnswers: [],
  recommendedEvidence: [],
  assessedAt: '2026-07-19T00:00:00.000Z',
  rulesVersion: '123456abcdef',
};

describe('Gemini explanation adapter', () => {
  it('is configured only when a Gemini API key is present', () => {
    expect(isGeminiConfigured({})).toBe(false);
    expect(isGeminiConfigured({ GEMINI_API_KEY: 'secret' })).toBe(true);
    expect(isGeminiConfigured({ GOOGLE_API_KEY: 'secret' })).toBe(true);
  });

  it('posts the guarded prompt to Gemini Interactions API and returns output text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text:
          'Attendance Allowance may not match these answers. The age rule needs review. This is not official advice.',
      }),
    });

    const text = await createGeminiExplanation(assessment, {
      apiKey: 'secret',
      fetchImpl,
    });

    expect(text).toContain('Attendance Allowance may not match');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': 'secret',
        },
      }),
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({
      model: 'gemini-3.5-flash',
      generation_config: {
        temperature: 0.2,
        thinking_level: 'low',
      },
    });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).input).toContain('aa-age');
  });

  it('extracts text from Gemini REST interaction steps', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: [
          {
            content: [{ text: 'internal thought', type: 'thought' }],
            type: 'model_output',
          },
          {
            content: [
              {
                text: 'Attendance Allowance may not match. This is not official advice.',
                type: 'text',
              },
            ],
            type: 'model_output',
          },
        ],
      }),
    });

    await expect(
      createGeminiExplanation(assessment, { apiKey: 'secret', fetchImpl }),
    ).resolves.toBe('Attendance Allowance may not match. This is not official advice.');
  });

  it('throws when Gemini returns no text', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(
      createGeminiExplanation(assessment, { apiKey: 'secret', fetchImpl }),
    ).rejects.toThrow('Gemini response did not include text');
  });
});
