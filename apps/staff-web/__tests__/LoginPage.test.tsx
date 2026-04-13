/**
 * Staff Dashboard — Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../src/components/Auth/LoginPage';
import { AuthProvider } from '../src/context/AuthContext';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>,
  );
}

describe('LoginPage', () => {
  it('should render the login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render Google Sign-In button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('should have accessible form labels', () => {
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(emailInput).toHaveAttribute('aria-required', 'true');
    expect(passwordInput).toHaveAttribute('aria-required', 'true');
  });

  it('should have the CrowdFlow branding', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('CrowdFlow')).toBeInTheDocument();
    expect(screen.getByText(/staff dashboard/i)).toBeInTheDocument();
  });
});
