import { createGeminiExplanation, isGeminiConfigured } from '@/lib/explanations/gemini';
import { validateLlmExplanation } from '@/lib/explanations/llm';
import { createTemplateExplanation } from '@/lib/explanations/template';
import type { Assessment } from '@/lib/rules/schema';

export const runtime = 'nodejs';

interface ExplainPayload {
  assessment?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let payload: ExplainPayload;

  try {
    payload = (await request.json()) as ExplainPayload;
  } catch {
    return invalidPayload();
  }

  if (!isAssessmentLike(payload.assessment)) {
    return invalidPayload();
  }

  if (isGeminiConfigured()) {
    try {
      const text = await createGeminiExplanation(payload.assessment);
      const validation = validateLlmExplanation(text, payload.assessment);

      if (validation.valid) {
        return Response.json({
          explanation: {
            benefitId: payload.assessment.benefitId,
            mode: 'llm',
            text,
          },
        });
      }
    } catch {
      // Template fallback keeps the assessment usable when the LLM provider is unavailable.
    }
  }

  return Response.json({
    explanation: createTemplateExplanation(payload.assessment, 'fallback'),
  });
}

function invalidPayload(): Response {
  return Response.json({ error: 'Invalid assessment payload' }, { status: 400 });
}

function isAssessmentLike(value: unknown): value is Assessment {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<Assessment>;
  return (
    typeof candidate.benefitId === 'string' &&
    typeof candidate.benefitName === 'string' &&
    typeof candidate.outcome === 'string' &&
    Array.isArray(candidate.criteria) &&
    Array.isArray(candidate.missingAnswers) &&
    Array.isArray(candidate.recommendedEvidence)
  );
}
