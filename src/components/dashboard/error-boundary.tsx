// Error Boundary for Dashboard Components
// Catches React errors and provides fallback UI with cached data support

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class DashboardErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console
    console.error('[DashboardErrorBoundary] Caught an error:', error, errorInfo);

    // Log error to API (if available)
    this.logErrorToAPI(error, errorInfo);
  }

  private async logErrorToAPI(
    error: Error,
    errorInfo: { componentStack: string }
  ): Promise<void> {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'frontend_error',
          error: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (loggingError) {
      console.error('[DashboardErrorBoundary] Failed to log error:', loggingError);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.props.showDetails && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// API ERROR BOUNDARY WITH FALLBACK
// ============================================

interface APIErrorBoundaryProps {
  children: ReactNode;
  fallbackData?: unknown;
  onRetry?: () => void;
  showCachedWarning?: boolean;
}

interface APIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isUsingCachedData: boolean;
}

export class APIErrorBoundary extends Component<
  APIErrorBoundaryProps,
  APIErrorBoundaryState
> {
  constructor(props: APIErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isUsingCachedData: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<APIErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error): void {
    console.error('[APIErrorBoundary] API Error:', error);

    // If fallback data is available, use it
    if (this.props.fallbackData) {
      this.setState({
        isUsingCachedData: true,
      });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      isUsingCachedData: false,
    });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If we have fallback data, show it with a warning
      if (this.props.fallbackData && this.state.isUsingCachedData) {
        return (
          <div className="relative">
            {this.props.showCachedWarning && (
              <div className="mb-4 flex items-center space-x-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                <svg
                  className="h-4 w-4 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-yellow-700">
                  Showing cached data - API unavailable
                </p>
              </div>
            )}
            {this.props.children}
          </div>
        );
      }

      // Otherwise show error state
      return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              API Error
            </h3>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Failed to fetch data from API'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// HOOK FOR ERROR HANDLING
// ============================================

import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error('[useErrorHandler] Error:', err);
    setError(err);

    // Log to API
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'hook_error',
        error: {
          message: err.message,
          stack: err.stack,
        },
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    }).catch((loggingError) => {
      console.error('[useErrorHandler] Failed to log error:', loggingError);
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}
