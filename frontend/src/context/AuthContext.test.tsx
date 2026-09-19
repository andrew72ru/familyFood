import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { refreshAccessToken } from '../api';

jest.mock('../api', () => ({
  logoutSession: jest.fn().mockResolvedValue(undefined),
  refreshAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
}));

const mockedRefreshAccessToken = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;

const AuthenticationState = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  return <span>{`${isInitialized ? 'ready' : 'loading'}:${isAuthenticated ? 'authenticated' : 'anonymous'}`}</span>;
};

test('restores the session from the HttpOnly refresh cookie on startup', async () => {
  mockedRefreshAccessToken.mockResolvedValue('restored-access-token');

  render(
    <AuthProvider>
      <AuthenticationState />
    </AuthProvider>,
  );

  expect(screen.getByText('loading:anonymous')).toBeInTheDocument();
  expect(await screen.findByText('ready:authenticated')).toBeInTheDocument();
});

test('finishes initialization as anonymous when no refresh session exists', async () => {
  mockedRefreshAccessToken.mockResolvedValue(null);

  render(
    <AuthProvider>
      <AuthenticationState />
    </AuthProvider>,
  );

  expect(await screen.findByText('ready:anonymous')).toBeInTheDocument();
});
