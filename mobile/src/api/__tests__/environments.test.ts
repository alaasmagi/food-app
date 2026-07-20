import {
  addRestaurantToEnvironment,
  createEnvironment,
  deleteEnvironment,
  getEnvironmentRestaurants,
  getEnvironments,
  removeRestaurantFromEnvironment,
  updateEnvironment,
} from '@/api/environments';
import { apiFetch } from '@/api/client';
import { ProblemDetailsError } from '@/api/errors';

jest.mock('@/api/client', () => ({ apiFetch: jest.fn() }));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function okJson(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({ title: 'Nope', detail: 'forbidden', status }),
  } as Response;
}

/** The RequestInit passed to apiFetch on a given call. */
function initOf(call: number): RequestInit {
  return (mockApiFetch.mock.calls[call][1] ?? {}) as RequestInit;
}

function headerOf(call: number, name: string): string | null {
  return new Headers(initOf(call).headers).get(name);
}

describe('environments api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists environments via GET', async () => {
    mockApiFetch.mockResolvedValue(okJson([{ id: 'e1' }]));
    const result = await getEnvironments();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/dining-environments');
    expect(result).toEqual([{ id: 'e1' }]);
  });

  it('creates via POST with a JSON body', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'e1' }));
    await createEnvironment({ name: 'Lunch', description: null });
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/dining-environments', expect.any(Object));
    expect(initOf(0).method).toBe('POST');
    expect(JSON.parse(initOf(0).body as string)).toEqual({ name: 'Lunch', description: null });
  });

  it('updates via PUT sending If-Match and the id in the body', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'e1' }));
    await updateEnvironment('e1', { name: 'Renamed', description: 'x' }, 'tok-1');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/dining-environments/e1', expect.any(Object));
    expect(initOf(0).method).toBe('PUT');
    expect(headerOf(0, 'If-Match')).toBe('tok-1');
    expect(JSON.parse(initOf(0).body as string)).toEqual({
      id: 'e1',
      name: 'Renamed',
      description: 'x',
    });
  });

  it('deletes via DELETE sending If-Match', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 204 } as Response);
    await deleteEnvironment('e1', 'tok-2');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/dining-environments/e1', expect.any(Object));
    expect(initOf(0).method).toBe('DELETE');
    expect(headerOf(0, 'If-Match')).toBe('tok-2');
  });

  it('lists memberships via GET', async () => {
    mockApiFetch.mockResolvedValue(okJson([{ id: 'm1' }]));
    await getEnvironmentRestaurants();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/environment-restaurants');
  });

  it('adds a membership via POST with environmentId and restaurantId', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'm1', environmentId: 'e1', restaurantId: 'r1' }));
    const created = await addRestaurantToEnvironment('e1', 'r1');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/environment-restaurants', expect.any(Object));
    expect(initOf(0).method).toBe('POST');
    expect(JSON.parse(initOf(0).body as string)).toEqual({ environmentId: 'e1', restaurantId: 'r1' });
    expect(created.id).toBe('m1');
  });

  it('removes a membership via DELETE on the join row with If-Match', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 204 } as Response);
    await removeRestaurantFromEnvironment('m1', 'tok-3');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/environment-restaurants/m1', expect.any(Object));
    expect(initOf(0).method).toBe('DELETE');
    expect(headerOf(0, 'If-Match')).toBe('tok-3');
  });

  it('throws ProblemDetailsError on a non-ok response (e.g. 403)', async () => {
    mockApiFetch.mockResolvedValue(errorResponse(403));
    await expect(getEnvironments()).rejects.toBeInstanceOf(ProblemDetailsError);
  });
});
