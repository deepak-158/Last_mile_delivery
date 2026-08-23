import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserProfile } from '../services/authService';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  phone?: string;
  walletBalance?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role?: 'CUSTOMER' | 'AGENT' | 'ADMIN') => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'CUSTOMER' | 'AGENT' | 'ADMIN';
    vehicleType?: string;
    vehicleNumber?: string;
    zoneId?: string;
  }) => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Instant hydration from localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }

    // 2. Realtime listener to Firebase Auth state
    const unsubscribe = authService.onAuthStateChanged((profile) => {
      if (profile) {
        const u: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          phone: profile.phone,
          walletBalance: profile.walletBalance,
        };
        setUser(u);
        setToken('firebase-token');
      } else {
        // If not authenticated in Firebase Auth, keep local mock if present or clear
        if (!savedUser) {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: profile, token: newToken } = await authService.login(email, password);
    const u: User = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      walletBalance: profile.walletBalance,
    };
    setUser(u);
    setToken(newToken);
  };

  const loginWithGoogle = async (defaultRole: 'CUSTOMER' | 'AGENT' | 'ADMIN' = 'CUSTOMER') => {
    const { user: profile, token: newToken } = await authService.signInWithGoogle(defaultRole);
    const u: User = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      walletBalance: profile.walletBalance,
    };
    setUser(u);
    setToken(newToken);
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'CUSTOMER' | 'AGENT' | 'ADMIN';
    vehicleType?: string;
    vehicleNumber?: string;
    zoneId?: string;
  }) => {
    const { user: profile, token: newToken } = await authService.register(data);
    const u: User = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      walletBalance: profile.walletBalance,
    };
    setUser(u);
    setToken(newToken);
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    const updated = await authService.updateUserProfile(data);
    const u: User = {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      phone: updated.phone,
      walletBalance: updated.walletBalance,
    };
    setUser(u);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
