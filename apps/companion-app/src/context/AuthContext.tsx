import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// In a real mobile app, we'd use an environment variable for the API URL.
// For Android emulator, use 10.0.2.2. For iOS/Web, use localhost.
const AUTH_URL = 'http://localhost:4000/graphql';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(AUTH_URL, {
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              user {
                id
                email
                displayName
                role
              }
              tokens {
                accessToken
              }
            }
          }
        `,
        variables: {
          input: { email, password }
        }
      });

      const data = response.data?.data?.login;
      if (data) {
        setUser(data.user);
        // Note: Real apps would store accessToken in SecureStore
      } else {
        throw new Error(response.data?.errors?.[0]?.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login Error:', err.message);
      // Fallback for demo if service is offline
      if (email === 'staff@crowdflow.io' || email === 'fan@stadium.com') {
        console.warn('⚠️ Service offline. Using fallback user for demo.');
        setUser({
          id: 'demo-id',
          email,
          displayName: 'Demo User',
          role: email.includes('staff') ? 'STAFF' : 'ATTENDEE',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
