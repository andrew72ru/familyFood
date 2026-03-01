const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

export const fetchApi = async (path: string, options: RequestInit = {}): Promise<any> => {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers || {});

  const token = localStorage.getItem('jwt_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/ld+json');
  }
  if (!headers.has('Content-Type') && ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
    headers.set(
      'Content-Type',
      options.method === 'PATCH' ? 'application/merge-patch+json' : 'application/ld+json',
    );
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401 && path !== '/api/login_check') {
    if (path !== '/api/refresh_token') {
      const getCookie = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };

      const refreshToken = getCookie('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${BASE_URL}/api/refresh_token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/ld+json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.token) {
              localStorage.setItem('jwt_token', refreshData.token);
              if (refreshData.refresh_token && refreshData.refresh_token_expiration) {
                document.cookie = `refresh_token=${refreshData.refresh_token}; Max-Age=${refreshData.refresh_token_expiration}; path=/; SameSite=Strict; Secure`;
              }
              // Retry the original request
              return fetchApi(path, options);
            }
          } else if (refreshResponse.status === 403) {
            // If we receive a 403 when trying to refresh, redirect to login
            localStorage.removeItem('jwt_token');
            document.cookie = 'refresh_token=; Max-Age=0; path=/;';
            window.location.href = '/login';
            return;
          }
        } catch (e) {
          console.error('Failed to refresh token', e);
        }
      }
    }

    localStorage.removeItem('jwt_token');
    document.cookie = 'refresh_token=; Max-Age=0; path=/;';
    window.location.href = '/login';
    return;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorData = data || {};
    const message = errorData['hydra:description'] || `API error: ${response.statusText}`;
    throw new ApiError(message, response.status, response.statusText, errorData);
  }

  return data;
};
