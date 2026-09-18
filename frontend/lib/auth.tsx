'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  picture: string;
  role: 'ADMIN' | 'USER';
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('mnf_user');
    return stored ? JSON.parse(stored) : null;
  });

  function login(user: User) {
    setUser(user);
    localStorage.setItem('mnf_user', JSON.stringify(user));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('mnf_user');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
