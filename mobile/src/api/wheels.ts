import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { UserWheel } from '@/types/wheel';

/** User-wheels API; update/delete send the concurrency token as If-Match. */

const WHEELS = '/api/v1/user-wheels';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface WheelInput {
  name: string;
  restaurantNames: string[];
  isPublic: boolean;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as T;
}

async function expectOk(res: Response): Promise<void> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
}

export async function getWheels(): Promise<UserWheel[]> {
  const res = await apiFetch(WHEELS);
  return unwrap<UserWheel[]>(res);
}

export async function createWheel(input: WheelInput): Promise<UserWheel> {
  const res = await apiFetch(WHEELS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return unwrap<UserWheel>(res);
}

export async function updateWheel(
  id: string,
  input: WheelInput,
  concurrencyToken: string,
): Promise<UserWheel> {
  const res = await apiFetch(`${WHEELS}/${id}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, 'If-Match': concurrencyToken },
    body: JSON.stringify({ id, ...input }),
  });
  return unwrap<UserWheel>(res);
}

export async function deleteWheel(id: string, concurrencyToken: string): Promise<void> {
  const res = await apiFetch(`${WHEELS}/${id}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  });
  await expectOk(res);
}
