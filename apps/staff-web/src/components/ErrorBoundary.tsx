/**
 * Error Boundary — Graceful runtime error handling
 *
 * Catches React rendering errors and displays a premium error UI
 * instead of crashing the entire application. Includes retry
 * functionality and error logging.
 *
 * This is a Class component because React Error Boundaries
 * require componentDidCatch / getDerivedStateFromError.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for observability
    console.error('[CrowdFlow Error Boundary]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg-primary, #0f0f14)',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: 500,
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '3rem 2.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Error Icon */}
            <div style={{
              width: 64, height: 64, margin: '0 auto 1.5rem',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
            }}>
              ⚠️
            </div>

            {/* Title */}
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}>
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>

            {/* Message */}
            <p style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}>
              An unexpected error occurred in the CrowdFlow dashboard.
              Your data is safe — try refreshing or retrying.
            </p>

            {/* Error Details (collapsible in dev) */}
            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <summary style={{ color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Technical Details
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 150,
                  overflow: 'auto',
                }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                id="error-retry-btn"
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ↻ Try Again
              </button>
              <button
                onClick={this.handleReload}
                id="error-reload-btn"
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
