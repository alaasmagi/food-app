import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { DiningEnvironment, EnvironmentRestaurant } from '@/types/environment';

/**
 * Dining-environment API module. Every call goes through the shared
 * authenticated `apiFetch` (bearer + 401 refresh/retry). On ok the body is the
 * bare payload; on error we throw the parsed ProblemDetails, which React Query
 * surfaces without crashing the screen (including the user-scoped 403 case).
 *
 * Update and both delete operations round-trip the entity's concurrency token
 * as the `If-Match` header, matching the backend's optimistic-concurrency
 * requirement. Membership is a first-class join row on `/environment-restaurants`.
 */

const ENVIRONMENTS = '/api/v1/dining-environments';
const MEMBERSHIPS = '/api/v1/environment-restaurants';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface EnvironmentInput {
  name: string;
  description: string | null;
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

/** GET /api/v1/dining-environments — the current user's environments. */
export async function getEnvironments(): Promise<DiningEnvironment[]> {
  const res = await apiFetch(ENVIRONMENTS);
  return unwrap<DiningEnvironment[]>(res);
}

/** POST /api/v1/dining-environments — create an environment. */
export async function createEnvironment(input: EnvironmentInput): Promise<DiningEnvironment> {
  const res = await apiFetch(ENVIRONMENTS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return unwrap<DiningEnvironment>(res);
}

/** PUT /api/v1/dining-environments/{id} — rename/update, sending If-Match. */
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

/** DELETE /api/v1/dining-environments/{id} — delete, sending If-Match. */
export async function deleteEnvironment(id: string, concurrencyToken: string): Promise<void> {
  const res = await apiFetch(`${ENVIRONMENTS}/${id}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  });
  await expectOk(res);
}

/** GET /api/v1/environment-restaurants — the user's membership join rows. */
export async function getEnvironmentRestaurants(): Promise<EnvironmentRestaurant[]> {
  const res = await apiFetch(MEMBERSHIPS);
  return unwrap<EnvironmentRestaurant[]>(res);
}

/** POST /api/v1/environment-restaurants — add a restaurant to an environment. */
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

/** DELETE /api/v1/environment-restaurants/{joinId} — remove, sending If-Match. */
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
