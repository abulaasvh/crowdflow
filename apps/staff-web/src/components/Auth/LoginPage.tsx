/**
 * Login Page — Staff Dashboard Authentication
 *
 * Features:
 * - Email/password login
 * - Google Sign-In via Firebase Auth
 * - Glassmorphism card design
 * - WCAG 2.1 AA accessible form
 * - Google Analytics event tracking
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { login, loginWithGoogle, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password');
      return;
    }

    await login(email, password);
    navigate('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    await loginWithGoogle();
    navigate('/dashboard');
  };

  return (
    <div className="login-page" role="main">
      <div className="login-card glass-card" aria-label="Staff Login">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon" aria-hidden="true">CF</div>
          <span className="login-logo-text text-gradient">CrowdFlow</span>
        </div>

        <p className="login-subtitle">Staff Dashboard — Manage your venue in real-time</p>

        {/* Error Display */}
        {(error || localError) && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              background: 'var(--status-critical-bg)',
              color: 'var(--status-critical)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-sm)',
              marginBottom: 'var(--space-4)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {error || localError}
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="login-email" className="input-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="staff@venue.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-required="true"
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password" className="input-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              aria-required="true"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            id="login-submit-btn"
            style={{ width: '100%' }}
          >
            {isLoading ? (
              <span className="animate-pulse">Signing in...</span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider" style={{ margin: 'var(--space-5) 0' }}>
          <span>or continue with</span>
        </div>

        {/* Google Sign-In Button */}
        <button
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          id="google-signin-btn"
          type="button"
          aria-label="Sign in with Google"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {/* Demo Section */}
        <div style={{
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
            Quick Demo Access:
          </p>
          <button
            onClick={() => login('staff@crowdflow.io', 'staff_secret_123')}
            className="btn btn-secondary"
            style={{ fontSize: 'var(--font-xs)', padding: 'var(--space-2) var(--space-4)' }}
          >
            Sign in as Demo Staff
          </button>
        </div>
      </div>
    </div>
  );
}
