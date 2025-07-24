// contexts/AuthContext.tsx - HMR-Compatible Version

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  nickname: string;
  confidence_meds: number;
  confidence_costs: number;
  confidence_overall: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, authToken: string, userData: User) => void;
  logout: () => void;
  signup: (userData: any) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV 
    ? 'http://localhost:3002' 
    : 'https://novara-mvp-production.up.railway.app');

// Cache for decoded tokens to prevent repeated parsing and memory leaks
const tokenCache = new Map<string, { payload: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

// Helper function to safely decode JWT token with caching
const decodeTokenSafely = (token: string | null | undefined): any | null => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.payload;
  }

  try {
    // Validate token format (must have 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Validate required JWT fields
    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }

    // Cache the result (limit cache size to prevent memory leaks)
    if (tokenCache.size > 10) {
      const firstKey = tokenCache.keys().next().value;
      tokenCache.delete(firstKey);
    }
    tokenCache.set(token, { payload, timestamp: Date.now() });

    return payload;
  } catch (error) {
    console.warn('JWT decode error:', error);
    return null;
  }
};

// Helper function to decode JWT and check expiration
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  const payload = decodeTokenSafely(token);
  if (!payload) {
    return true; // If we can't decode, consider it expired
  }

  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

// Helper function to check if token expires soon (within 1 hour)
const isTokenExpiringSoon = (token: string | null): boolean => {
  if (!token) return true;
  const payload = decodeTokenSafely(token);
  if (!payload) {
    return true;
  }

  const currentTime = Date.now() / 1000;
  const oneHour = 60 * 60; // 1 hour in seconds
  return payload.exp < (currentTime + oneHour);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token') || null;
        const storedUser = localStorage.getItem('user') || null;
        
        if (token && storedUser) {
          // In development, be less aggressive about token refresh to avoid HMR conflicts
          if (import.meta.env.DEV) {
            // Only check if token is completely expired, not expiring soon
            if (isTokenExpired(token)) {
              console.log('🔄 Token expired, clearing auth state');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            } else {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              console.log('✅ Existing token valid (dev mode)');
            }
          } else {
            // Production: full token refresh logic
            if (isTokenExpired(token)) {
              const refreshed = await refreshToken();
              if (!refreshed) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              } else {
                const userData = JSON.parse(storedUser);
                setUser(userData);
              }
            } else {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token (disabled in development to avoid HMR conflicts)
  useEffect(() => {
    if (!user || import.meta.env.DEV) return;

    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token') || null;
      if (token && isTokenExpiringSoon(token)) {
        console.log('🔄 Token expiring soon, refreshing...');
        refreshToken();
      }
    };

    // Check every 30 minutes (only in production)
    const interval = setInterval(checkTokenExpiration, 30 * 60 * 1000);
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [user]);

  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentUser = localStorage.getItem('user');
      if (!currentUser) return false;

      const userData = JSON.parse(currentUser);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData.email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          console.log('✅ Token refreshed successfully');
          return true;
        }
      }
      
      console.error('❌ Token refresh failed:', response.status);
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  };

  const login = (_email: string, authToken: string, userData: User) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    console.log('✅ User logged in successfully');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('👋 User logged out');
  };

  const signup = async (_userData: any) => {
    throw new Error('Use apiClient.createUser() directly for signup');
  };

  const checkTokenExpired = (): boolean => {
    const token = localStorage.getItem('token');
    return !token || isTokenExpired(token);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    refreshToken,
    isTokenExpired: checkTokenExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Consistent export for HMR compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};