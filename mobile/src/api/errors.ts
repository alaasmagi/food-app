import type { ProblemDetails } from '@/types/restaurant';

/**
 * Error thrown by API modules when the backend returns a non-ok response.
 * Carries the parsed RFC 7807 ProblemDetails fields so callers (and React
 * Query) can surface a meaningful message.
 */
export class ProblemDetailsError extends Error {
  constructor(
    readonly title: string,
    readonly detail: string,
    readonly status: number,
  ) {
    super(detail || title || `Request failed with status ${status}`);
    this.name = 'ProblemDetailsError';
  }
}

/**
 * Reads a ProblemDetails body from a non-ok response and returns a typed error.
 * Falls back gracefully when the body is missing or not JSON.
 */
export async function parseProblemDetails(res: Response): Promise<ProblemDetailsError> {
  let body: Partial<ProblemDetails> = {};
  try {
    body = (await res.json()) as Partial<ProblemDetails>;
  } catch {
    // Non-JSON or empty body — fall back to status only.
  }
  return new ProblemDetailsError(
    body.title ?? 'Request failed',
    body.detail ?? '',
    body.status ?? res.status,
  );
}
