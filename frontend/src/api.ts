import { redirectToLogin } from './authRedirect';

const BASE_URL = process.env.REACT_APP_API_URL || '';
const IS_PUBLIC_APP = process.env.REACT_APP_IS_PUBLIC_APP === 'true';
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

const requestAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/refresh_token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const data: unknown = await response.json();
    if (
      typeof data !== 'object' ||
      data === null ||
      !('token' in data) ||
      typeof data.token !== 'string' ||
      data.token === ''
    ) {
      setAccessToken(null);
      return null;
    }

    setAccessToken(data.token);
    return data.token;
  } catch {
    setAccessToken(null);
    return null;
  }
};

export const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = requestAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const logoutSession = async (): Promise<void> => {
  try {
    await fetch(`${BASE_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });
  } finally {
    setAccessToken(null);
  }
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public data: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const fetchApi = async (path: string, options: RequestInit & { preload?: string } = {}): Promise<any> => {
  const { data } = await fetchWithResponse(path, options);
  return data;
};

export const fetchWithResponse = async (
  path: string,
  options: RequestInit & { preload?: string } = {},
  allowRefresh = true,
): Promise<{ data: any; response: Response }> => {
  let adjustedPath = path.startsWith('/') ? path : `/${path}`;

  if (IS_PUBLIC_APP && adjustedPath.startsWith('/api/') && !adjustedPath.startsWith('/api/public/')) {
    adjustedPath = adjustedPath.replace('/api/', '/api/public/');
  }

  const url = `${BASE_URL}${adjustedPath}`;

  const headers = new Headers(options.headers || {});

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (options.preload) {
    headers.set('Preload', options.preload);
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/ld+json');
  }
  if (!headers.has('Content-Type') && ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
    headers.set('Content-Type', options.method === 'PATCH' ? 'application/merge-patch+json' : 'application/ld+json');
  }

  const response = await fetch(url, { ...options, headers, credentials: 'include' });

  if (response.status === 204) {
    return { data: null, response };
  }

  if (response.status === 401 && !IS_PUBLIC_APP && path !== '/api/login_check') {
    if (allowRefresh && (await refreshAccessToken())) {
      return fetchWithResponse(path, options, false);
    }

    setAccessToken(null);
    redirectToLogin();
    return { data: null, response };
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorData = data || {};
    const message = errorData['hydra:description'] || `API error: ${response.statusText}`;
    throw new ApiError(message, response.status, response.statusText, errorData);
  }

  return { data, response };
};
