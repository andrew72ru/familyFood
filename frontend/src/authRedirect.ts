const DEFAULT_AUTHENTICATED_PATH = '/';

export const getCurrentRelativeUrl = (): string =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

export const buildLoginUrl = (returnTo: string = getCurrentRelativeUrl()): string => {
  const searchParams = new URLSearchParams({ next: returnTo });

  return `/login?${searchParams.toString()}`;
};

export const redirectToLogin = (): void => {
  if (window.location.pathname === '/login') {
    return;
  }

  window.location.replace(buildLoginUrl());
};

export const getSafeReturnPath = (returnTo: string | null): string => {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  try {
    const url = new URL(returnTo, window.location.origin);

    if (url.origin !== window.location.origin || url.pathname === '/login') {
      return DEFAULT_AUTHENTICATED_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }
};
