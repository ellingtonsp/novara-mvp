import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  nickname?: string;
  confidence_meds?: number;
  confidence_costs?: number;
  confidence_overall?: number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('novara_token');
        const storedUser = localStorage.getItem('novara_user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        localStorage.removeItem('novara_token');
        localStorage.removeItem('novara_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (email: string, authToken: string, userData: User) => {
    setToken(authToken);
    setUser(userData);
    
    localStorage.setItem('novara_token', authToken);
    localStorage.setItem('novara_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    localStorage.removeItem('novara_token');
    localStorage.removeItem('novara_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('novara_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};