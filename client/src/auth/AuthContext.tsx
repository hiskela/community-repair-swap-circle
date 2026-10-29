
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse } from '../services/api';

type UserRole = 'admin' | 'user';

type AuthContextValue = {
  token: string | null;
  role: UserRole | null;
  signIn: (result: AuthResponse) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem('accessToken'),
  );

  const [role, setRole] = useState<UserRole | null>(() => {
    const savedRole = sessionStorage.getItem('userRole');

    return savedRole === 'admin' || savedRole === 'user'
      ? savedRole
      : null;
  });

  function signIn(result: AuthResponse) {
    const userRole =
      result.user?.role === 'admin' ? 'admin' : 'user';

    setToken(result.accessToken);
    setRole(userRole);

    sessionStorage.setItem('accessToken', result.accessToken);
    sessionStorage.setItem('userRole', userRole);
  }

  function signOut() {
    setToken(null);
    setRole(null);

    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userRole');
  }

  return (
    <AuthContext.Provider value={{ token, role, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
