import { buildExplanationPrompt } from '@/lib/explanations/llm';
import type { Assessment } from '@/lib/rules/schema';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_MODEL = 'gemini-3.5-flash';

type EnvLike = Record<string, string | undefined>;

interface GeminiOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  env?: EnvLike;
}

interface GeminiTextBlock {
  text?: string | { text?: string };
  type?: string;
}

interface GeminiModelOutput {
  content?: GeminiTextBlock[];
}

interface GeminiStep {
  content?: GeminiTextBlock[];
  type?: string;
  modelOutput?: GeminiModelOutput;
  model_output?: GeminiModelOutput;
}

interface GeminiResponse {
  output_text?: string;
  outputText?: string;
  steps?: GeminiStep[];
}

export function isGeminiConfigured(env: EnvLike = process.env): boolean {
  return Boolean(env.GEMINI_API_KEY || env.GOOGLE_API_KEY);
}

export async function createGeminiExplanation(
  assessment: Assessment,
  options: GeminiOptions = {},
): Promise<string> {
  const env = options.env ?? process.env;
  const apiKey = options.apiKey ?? env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: options.model ?? env.GEMINI_MODEL ?? DEFAULT_MODEL,
      system_instruction:
        'You explain deterministic benefit assessment traces. You never make eligibility decisions.',
      input: buildExplanationPrompt(assessment),
      generation_config: {
        temperature: 0.2,
        thinking_level: 'low',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(payload);

  if (!text) {
    throw new Error('Gemini response did not include text');
  }

  return text;
}

function extractGeminiText(payload: GeminiResponse): string {
  if (typeof payload.output_text === 'string') return payload.output_text.trim();
  if (typeof payload.outputText === 'string') return payload.outputText.trim();

  const blocks =
    payload.steps?.flatMap(
      (step) => step.content ?? step.modelOutput?.content ?? step.model_output?.content ?? [],
    ) ?? [];

  return blocks
    .filter((block) => block.type !== 'thought')
    .map((block) => {
      if (typeof block.text === 'string') return block.text;
      if (typeof block.text?.text === 'string') return block.text.text;
      return '';
    })
    .join('\n')
    .trim();
}
