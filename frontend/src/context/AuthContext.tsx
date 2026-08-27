import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(api.getToken());
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setError('Session expired. Please sign in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authTokens = await api.login(email, password);
      setToken(authTokens.access_token);

      // Construct user info from email (since login returns token)
      const userProfile: User = {
        id: 1, // session bound
        name: email.split('@')[0],
        email: email,
        is_active: true,
      };
      setUser(userProfile);
      api.setStoredUser(userProfile);
    } catch (err: any) {
      const msg =
        err instanceof ApiError ? err.message : 'Invalid email or password.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await api.register(name, email, password);
      // Automatically log in after registration
      const authTokens = await api.login(email, password);
      setToken(authTokens.access_token);
      setUser(newUser);
      api.setStoredUser(newUser);
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Registration failed. Please verify your details.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
