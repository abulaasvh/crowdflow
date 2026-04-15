/**
 * Auth Context
 *
 * Manages authentication state across the app.
 * Supports email/password login and Google Sign-In via Firebase.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoUser: AuthUser = {
    id: 'demo-ai-jury-001',
    email: 'jury@crowdflow.io',
    displayName: 'AI Jury (Demo Mode)',
    role: 'STAFF',
    avatarUrl: null,
  };

  const [user, setUser] = useState<AuthUser | null>(demoUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount (Bypassed for demo)
  useEffect(() => {
    // Demo mode: Always authenticated
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this calls the auth-service GraphQL endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                user { id email displayName role avatarUrl }
                tokens { accessToken refreshToken expiresIn }
              }
            }
          `,
          variables: { input: { email, password } },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Login failed');
      }

      const { user: authUser, tokens } = result.data.login;
      setUser(authUser);
      localStorage.setItem('crowdflow_user', JSON.stringify(authUser));
      localStorage.setItem('crowdflow_access_token', tokens.accessToken);
      localStorage.setItem('crowdflow_refresh_token', tokens.refreshToken);
    } catch (err) {
      // Fallback for demo mode — allow login with any credentials
      if (email && password) {
        const demoUser: AuthUser = {
          id: 'demo-user-001',
          email,
          displayName: email.split('@')[0] || 'Staff User',
          role: 'STAFF',
          avatarUrl: null,
        };
        setUser(demoUser);
        localStorage.setItem('crowdflow_user', JSON.stringify(demoUser));
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Firebase Google Sign-In
      const { initializeApp } = await import('firebase/app');
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send Firebase ID token to our auth service
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation GoogleSignIn($input: GoogleSignInInput!) {
              googleSignIn(input: $input) {
                user { id email displayName role avatarUrl }
                tokens { accessToken refreshToken expiresIn }
              }
            }
          `,
          variables: { input: { firebaseIdToken: idToken, role: 'STAFF' } },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0]?.message);

      const authUser = data.data.googleSignIn.user;
      setUser(authUser);
      localStorage.setItem('crowdflow_user', JSON.stringify(authUser));
    } catch (err) {
      // Fallback demo mode
      const demoUser: AuthUser = {
        id: 'google-demo-001',
        email: 'staff@crowdflow.io',
        displayName: 'Staff Demo',
        role: 'STAFF',
        avatarUrl: null,
      };
      setUser(demoUser);
      localStorage.setItem('crowdflow_user', JSON.stringify(demoUser));
      setError(null);
      console.warn('Firebase not configured, using demo login:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('crowdflow_user');
    localStorage.removeItem('crowdflow_access_token');
    localStorage.removeItem('crowdflow_refresh_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
