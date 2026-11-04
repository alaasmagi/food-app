import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { DiningEnvironment, EnvironmentRestaurant } from '@/types/environment';

/** Dining-environment and membership API; update/delete send the concurrency token as If-Match. */

const ENVIRONMENTS = '/api/v1/dining-environments';
const MEMBERSHIPS = '/api/v1/environment-restaurants';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface EnvironmentInput {
  name: string;
  description: string | null;
  autoFillLatitude?: number | null;
  autoFillLongitude?: number | null;
  autoFillRadiusMeters?: number | null;
}

// Auto-fill is additive, so totalMembers can exceed the number of in-radius matches.
export interface DiningEnvironmentAutoFillResult {
  added: number;
  alreadyPresent: number;
  totalMembers: number;
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

export async function getEnvironments(): Promise<DiningEnvironment[]> {
  const res = await apiFetch(ENVIRONMENTS);
  return unwrap<DiningEnvironment[]>(res);
}

export async function createEnvironment(input: EnvironmentInput): Promise<DiningEnvironment> {
  const res = await apiFetch(ENVIRONMENTS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return unwrap<DiningEnvironment>(res);
}

export async function updateEnvironment(
  id: string,
  input: EnvironmentInput,
  concurrencyToken: string,
): Promise<DiningEnvironment> {
  const res = await apiFetch(`${ENVIRONMENTS}/${id}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, 'If-Match': concurrencyToken },
    body: JSON.stringify({ id, ...input }),
  });
  return unwrap<DiningEnvironment>(res);
}

export async function deleteEnvironment(id: string, concurrencyToken: string): Promise<void> {
  const res = await apiFetch(`${ENVIRONMENTS}/${id}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  });
  await expectOk(res);
}

export async function autoFillEnvironment(id: string): Promise<DiningEnvironmentAutoFillResult> {
  const res = await apiFetch(`${ENVIRONMENTS}/${id}/auto-fill`, { method: 'POST' });
  return unwrap<DiningEnvironmentAutoFillResult>(res);
}

export async function getEnvironmentRestaurants(): Promise<EnvironmentRestaurant[]> {
  const res = await apiFetch(MEMBERSHIPS);
  return unwrap<EnvironmentRestaurant[]>(res);
}

export async function addRestaurantToEnvironment(
  environmentId: string,
  restaurantId: string,
): Promise<EnvironmentRestaurant> {
  const res = await apiFetch(MEMBERSHIPS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ environmentId, restaurantId }),
  });
  return unwrap<EnvironmentRestaurant>(res);
}

export async function removeRestaurantFromEnvironment(
  joinId: string,
  concurrencyToken: string,
): Promise<void> {
  const res = await apiFetch(`${MEMBERSHIPS}/${joinId}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  });
  await expectOk(res);
}
