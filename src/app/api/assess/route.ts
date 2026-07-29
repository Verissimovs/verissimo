import { assessAll } from '@/lib/rules/engine';
import type { Answers } from '@/lib/rules/schema';

export const runtime = 'nodejs';

interface AssessPayload {
  answers?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let payload: AssessPayload;

  try {
    payload = (await request.json()) as AssessPayload;
  } catch {
    return invalidPayload();
  }

  if (!payload.answers || typeof payload.answers !== 'object' || Array.isArray(payload.answers)) {
    return invalidPayload();
  }

  return Response.json({
    assessments: assessAll(payload.answers as Answers),
  });
}

function invalidPayload(): Response {
  return Response.json({ error: 'Invalid answers payload' }, { status: 400 });
}
