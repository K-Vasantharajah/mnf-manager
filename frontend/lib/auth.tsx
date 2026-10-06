'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { hasAccess } from './access';
import { isDemo } from './demo';

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
    const wasDemo = isDemo();
    setUser(null);
    localStorage.removeItem('mnf_user');

    if (wasDemo || !hasAccess()) {
      // A full reload, not router.push: it clears React Query's cache, so no data
      // from the signed-out session is shown
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/access';
    }
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
