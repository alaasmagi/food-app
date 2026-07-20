import { apiFetch, ApiError } from '@/api/client';
import { getAccessToken } from '@/auth/tokenStorage';
import { refreshAccessToken, signOut } from '@/auth/session';

jest.mock('@/auth/tokenStorage', () => ({
  getAccessToken: jest.fn(),
}));
jest.mock('@/auth/session', () => ({
  refreshAccessToken: jest.fn(),
  signOut: jest.fn(),
}));

const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockRefresh = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

function response(status: number): Response {
  return { status, ok: status >= 200 && status < 300 } as Response;
}

function authHeader(call: number): string | null {
  const init = (global.fetch as jest.Mock).mock.calls[call][1] as RequestInit;
  return new Headers(init.headers).get('Authorization');
}

describe('apiFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockSignOut.mockResolvedValue(undefined);
  });

  it('attaches the bearer token', async () => {
    mockGetAccessToken.mockResolvedValue('access-1');
    (global.fetch as jest.Mock).mockResolvedValue(response(200));

    const res = await apiFetch('/api/v1/restaurants');

    expect(res.status).toBe(200);
    expect(authHeader(0)).toBe('Bearer access-1');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('silently refreshes and retries once on 401', async () => {
    mockGetAccessToken.mockResolvedValue('stale');
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200));
    mockRefresh.mockResolvedValue('fresh');

    const res = await apiFetch('/api/v1/restaurants');

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(authHeader(0)).toBe('Bearer stale');
    expect(authHeader(1)).toBe('Bearer fresh');
    expect(res.status).toBe(200);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('logs out when the refresh fails', async () => {
    mockGetAccessToken.mockResolvedValue('stale');
    (global.fetch as jest.Mock).mockResolvedValueOnce(response(401));
    mockRefresh.mockRejectedValue(new Error('refresh failed'));

    await expect(apiFetch('/api/v1/restaurants')).rejects.toBeInstanceOf(ApiError);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    // No retry beyond the single refresh attempt.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
