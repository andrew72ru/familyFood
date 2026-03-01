import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  login: (token: string, refreshToken: string, refreshTokenExpiration?: number) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(getCookie('refresh_token'));

  const login = (newToken: string, newRefreshToken: string, expiration?: number) => {
    localStorage.setItem('jwt_token', newToken);
    // Set cookie with expiration from backend or fallback to 7 days
    const maxAge = expiration || 7 * 24 * 60 * 60;
    document.cookie = `refresh_token=${newRefreshToken}; Max-Age=${maxAge}; path=/; SameSite=Strict; Secure`;

    setToken(newToken);
    setRefreshToken(newRefreshToken);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    document.cookie = 'refresh_token=; Max-Age=0; path=/;';
    setToken(null);
    setRefreshToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, refreshToken, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
