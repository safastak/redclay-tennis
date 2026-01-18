'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { User, AppRole } from '@/types';

/**
 * Auth state interface
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Auth context value interface
 */
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Signup data interface
 */
export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

/**
 * Auth API response interfaces
 */
interface AuthSuccessResponse {
  success: true;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  message: string;
}

interface AuthErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

interface MeSuccessResponse {
  success: true;
  data: {
    user: User;
  };
}

const TOKEN_KEY = 'redclay_auth_token';

/**
 * Create the auth context with undefined default
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Wraps the app and provides authentication state and actions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /**
   * Store token in localStorage
   */
  const storeToken = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }, []);

  /**
   * Remove token from localStorage
   */
  const removeToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  /**
   * Get token from localStorage
   */
  const getStoredToken = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }, []);

  /**
   * Fetch current user from API
   */
  const fetchUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data: MeSuccessResponse = await response.json();
      return data.data.user;
    } catch {
      return null;
    }
  }, []);

  /**
   * Login action
   */
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data: AuthSuccessResponse | AuthErrorResponse = await response.json();

        if (!response.ok) {
          const errorData = data as AuthErrorResponse;
          setState((prev) => ({ ...prev, isLoading: false }));
          return {
            success: false,
            error: errorData.error || 'Login failed',
          };
        }

        const successData = data as AuthSuccessResponse;
        const { user, access_token } = successData.data;

        storeToken(access_token);

        setState({
          user,
          token: access_token,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
      }
    },
    [storeToken]
  );

  /**
   * Signup action
   */
  const signup = useCallback(
    async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupData),
        });

        const data: AuthSuccessResponse | AuthErrorResponse = await response.json();

        if (!response.ok) {
          const errorData = data as AuthErrorResponse;
          setState((prev) => ({ ...prev, isLoading: false }));

          // Handle field-specific errors
          if (errorData.details) {
            const firstError = Object.values(errorData.details)[0];
            if (firstError && firstError.length > 0) {
              return { success: false, error: firstError[0] };
            }
          }

          return {
            success: false,
            error: errorData.error || 'Signup failed',
          };
        }

        const successData = data as AuthSuccessResponse;
        const { user, access_token } = successData.data;

        storeToken(access_token);

        setState({
          user,
          token: access_token,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
      }
    },
    [storeToken]
  );

  /**
   * Logout action
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint if token exists
      const token = getStoredToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch {
      // Ignore logout API errors
    } finally {
      removeToken();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [getStoredToken, removeToken]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    const user = await fetchUser(token);

    if (user) {
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      // Token is invalid, clear it
      removeToken();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [getStoredToken, fetchUser, removeToken]);

  /**
   * Auto-load user on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      const user = await fetchUser(token);

      if (user) {
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        // Token is invalid, clear it
        removeToken();
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initAuth();
  }, [getStoredToken, fetchUser, removeToken]);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 * Access auth state and actions from any component
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Helper to check if user has required role
 */
export function hasRole(user: User | null, requiredRole: AppRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<AppRole, number> = {
    user: 1,
    trainer: 2,
    admin: 3,
  };

  return roleHierarchy[user.app_role] >= roleHierarchy[requiredRole];
}
