const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/ld+json');
  }
  if (!headers.has('Content-Type') && ['POST', 'PUT', 'PATCH'].includes(options.method || '')) {
    headers.set('Content-Type', options.method === 'PATCH' ? 'application/merge-patch+json' : 'application/ld+json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData['hydra:description'] || `API error: ${response.statusText}`);
  }

  return response.json();
};
