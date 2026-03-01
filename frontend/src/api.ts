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

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers || {});
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData['hydra:description'] || `API error: ${response.statusText}`;
    throw new ApiError(message, response.status, response.statusText, errorData);
  }

  return response.json();
};
