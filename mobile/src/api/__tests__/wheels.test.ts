import { createWheel, deleteWheel, getWheels, updateWheel } from '@/api/wheels';
import { getPublicWheel } from '@/api/publicWheels';
import { apiFetch, publicFetch } from '@/api/client';
import { ProblemDetailsError } from '@/api/errors';

jest.mock('@/api/client', () => ({ apiFetch: jest.fn(), publicFetch: jest.fn() }));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;

function okJson(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({ title: 'Nope', detail: 'bad', status }),
  } as Response;
}

/** Both apiFetch and publicFetch mocks share this call-record shape. */
type CallRecorder = { mock: { calls: unknown[][] } };

function initOf(mock: CallRecorder, call: number): RequestInit {
  return (mock.mock.calls[call][1] ?? {}) as RequestInit;
}

function headerOf(mock: CallRecorder, call: number, name: string): string | null {
  return new Headers(initOf(mock, call).headers).get(name);
}

describe('wheels api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists wheels via GET', async () => {
    mockApiFetch.mockResolvedValue(okJson([{ id: 'w1' }]));
    await getWheels();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/user-wheels');
  });

  it('creates via POST with a JSON body', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'w1' }));
    await createWheel({ name: 'Lunch', restaurantNames: ['A', 'B'], isPublic: true });
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/user-wheels', expect.any(Object));
    expect(initOf(mockApiFetch, 0).method).toBe('POST');
    expect(JSON.parse(initOf(mockApiFetch, 0).body as string)).toEqual({
      name: 'Lunch',
      restaurantNames: ['A', 'B'],
      isPublic: true,
    });
  });

  it('updates via PUT sending If-Match and id in the body', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'w1' }));
    await updateWheel('w1', { name: 'X', restaurantNames: ['A'], isPublic: false }, 'tok-1');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/user-wheels/w1', expect.any(Object));
    expect(initOf(mockApiFetch, 0).method).toBe('PUT');
    expect(headerOf(mockApiFetch, 0, 'If-Match')).toBe('tok-1');
    expect(JSON.parse(initOf(mockApiFetch, 0).body as string)).toEqual({
      id: 'w1',
      name: 'X',
      restaurantNames: ['A'],
      isPublic: false,
    });
  });

  it('deletes via DELETE sending If-Match', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 204 } as Response);
    await deleteWheel('w1', 'tok-2');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/user-wheels/w1', expect.any(Object));
    expect(initOf(mockApiFetch, 0).method).toBe('DELETE');
    expect(headerOf(mockApiFetch, 0, 'If-Match')).toBe('tok-2');
  });

  it('throws ProblemDetailsError on a non-ok response', async () => {
    mockApiFetch.mockResolvedValue(errorResponse(409));
    await expect(getWheels()).rejects.toBeInstanceOf(ProblemDetailsError);
  });
});

describe('public wheels api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches via the unauthenticated path without an Authorization header', async () => {
    mockPublicFetch.mockResolvedValue(okJson({ name: 'Lunch', restaurantNames: ['A'] }));
    const result = await getPublicWheel('w1');
    expect(mockPublicFetch).toHaveBeenCalledWith('/api/v1/public/wheels/w1', expect.any(Object));
    expect(headerOf(mockPublicFetch, 0, 'Authorization')).toBeNull();
    expect(result).toEqual({ name: 'Lunch', restaurantNames: ['A'] });
  });

  it('returns null on 404', async () => {
    mockPublicFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(getPublicWheel('missing')).resolves.toBeNull();
  });

  it('rejects on a non-404 failure', async () => {
    mockPublicFetch.mockResolvedValue(errorResponse(500));
    await expect(getPublicWheel('w1')).rejects.toBeInstanceOf(ProblemDetailsError);
  });
});
