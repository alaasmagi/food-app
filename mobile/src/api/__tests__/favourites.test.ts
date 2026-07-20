import { createFavourite, getFavourites, updateFavourite } from '@/api/favourites';
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

function initOf(call: number): RequestInit {
  return (mockApiFetch.mock.calls[call][1] ?? {}) as RequestInit;
}

function headerOf(call: number, name: string): string | null {
  return new Headers(initOf(call).headers).get(name);
}

describe('favourites api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists favourites via GET', async () => {
    mockApiFetch.mockResolvedValue(okJson([{ id: 'f1' }]));
    const result = await getFavourites();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/favourites');
    expect(result).toEqual([{ id: 'f1' }]);
  });

  it('creates via POST with a JSON body', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'f1' }));
    await createFavourite({ restaurantId: 'r1', rating: 4, note: null });
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/favourites', expect.any(Object));
    expect(initOf(0).method).toBe('POST');
    expect(JSON.parse(initOf(0).body as string)).toEqual({
      restaurantId: 'r1',
      rating: 4,
      note: null,
    });
  });

  it('updates via PUT sending If-Match and the id in the body', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'f1' }));
    await updateFavourite('f1', { restaurantId: 'r1', rating: 5, note: 'great' }, 'tok-1');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/favourites/f1', expect.any(Object));
    expect(initOf(0).method).toBe('PUT');
    expect(headerOf(0, 'If-Match')).toBe('tok-1');
    expect(JSON.parse(initOf(0).body as string)).toEqual({
      id: 'f1',
      restaurantId: 'r1',
      rating: 5,
      note: 'great',
    });
  });

  it('throws ProblemDetailsError on a non-ok response (e.g. 403)', async () => {
    mockApiFetch.mockResolvedValue(errorResponse(403));
    await expect(getFavourites()).rejects.toBeInstanceOf(ProblemDetailsError);
  });
});
