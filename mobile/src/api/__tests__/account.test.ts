import { getCurrentUser, updateNotificationPreferences } from '@/api/account';
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
    json: async () => ({ title: 'Nope', detail: 'bad', status }),
  } as Response;
}

function initOf(call: number): RequestInit {
  return (mockApiFetch.mock.calls[call][1] ?? {}) as RequestInit;
}

describe('account api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the current user via GET /account/me', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'u1', sendNotifications: true }));
    const user = await getCurrentUser();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/account/me');
    expect(user).toEqual({ id: 'u1', sendNotifications: true });
  });

  it('updates preferences via PATCH with the two fields', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'u1' }));
    await updateNotificationPreferences(true, 'e1');
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/account/notification-preferences',
      expect.any(Object),
    );
    expect(initOf(0).method).toBe('PATCH');
    expect(JSON.parse(initOf(0).body as string)).toEqual({
      sendNotifications: true,
      notificationEnvironmentId: 'e1',
    });
  });

  it('sends null notificationEnvironmentId for "all environments"', async () => {
    mockApiFetch.mockResolvedValue(okJson({ id: 'u1' }));
    await updateNotificationPreferences(false, null);
    expect(JSON.parse(initOf(0).body as string)).toEqual({
      sendNotifications: false,
      notificationEnvironmentId: null,
    });
  });

  it('throws ProblemDetailsError on a non-ok response', async () => {
    mockApiFetch.mockResolvedValue(errorResponse(500));
    await expect(getCurrentUser()).rejects.toBeInstanceOf(ProblemDetailsError);
  });
});
