
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse } from '../services/api';

type AuthContextValue = {
  token: string | null;
  signIn: (result: AuthResponse) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  function signIn(result: AuthResponse) {
    setToken(result.accessToken);
    sessionStorage.setItem('accessToken', result.accessToken);
  }

  function signOut() {
    setToken(null);
    sessionStorage.removeItem('accessToken');
  }

  return (
    <AuthContext.Provider value={{ token, signIn, signOut }}>
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
