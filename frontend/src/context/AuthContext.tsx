import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logoutSession, refreshAccessToken, setAccessToken } from '../api';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    refreshAccessToken()
      .then((restoredToken) => {
        if (mounted) {
          setToken(restoredToken);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsInitialized(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = (newToken: string) => {
    setAccessToken(newToken);
    setToken(newToken);
  };

  const logout = async () => {
    await logoutSession();
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated, isInitialized }}>
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
