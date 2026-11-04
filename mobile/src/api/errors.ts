import type { ProblemDetails } from '@/types/restaurant';

/** Error thrown by API modules on non-ok responses, carrying the parsed ProblemDetails. */
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
