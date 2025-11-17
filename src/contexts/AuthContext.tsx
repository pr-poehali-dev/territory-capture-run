import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '@/config/api';

interface User {
  id: number;
  email?: string;
  phone?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (emailOrPhone: string, password: string, name?: string, isPhone?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (savedToken: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token: savedToken })
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(savedToken);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrPhone: string, password: string) => {
    const isPhone = /^\+?\d+$/.test(emailOrPhone);
    const body: any = { action: 'login', password };
    
    if (isPhone) {
      body.phone = emailOrPhone;
    } else {
      body.email = emailOrPhone;
    }

    const response = await fetch(API_ENDPOINTS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка входа');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('authToken', data.token);
  };

  const register = async (emailOrPhone: string, password: string, name?: string, isPhone?: boolean) => {
    const body: any = { action: 'register', password, name };
    
    if (isPhone) {
      body.phone = emailOrPhone;
    } else {
      body.email = emailOrPhone;
    }

    const response = await fetch(API_ENDPOINTS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка регистрации');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('authToken', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!user, 
      isLoading,
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
