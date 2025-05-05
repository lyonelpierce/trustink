'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleError } from '@/lib/error-handler';

interface ErrorBoundaryProps {
  /**
   * Child components to be rendered inside the error boundary
   */
  children: ReactNode;
  
  /**
   * Optional custom fallback component to render when an error occurs
   */
  fallback?: ReactNode;
  
  /**
   * Optional context name for error logging
   */
  context?: string;
  
  /**
   * Whether to show toast notifications for errors
   */
  showToasts?: boolean;
}

interface ErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * The error that occurred, if any
   */
  error: Error | null;
  
  /**
   * Error info object from React, if available
   */
  errorInfo: ErrorInfo | null;
}

/**
 * A component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when an error occurs so we can render a fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log the error and error info when a component error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { context = 'ErrorBoundary', showToasts = true } = this.props;
    
    // Log the error using our error handler
    handleError(error, {
      context,
      showToast: showToasts,
      logToConsole: true,
      metadata: { componentStack: errorInfo.componentStack },
      errorInfo
    });
    
    // Update state with error details
    this.setState({ errorInfo });
  }

  /**
   * Reset the error state to try rendering the component again
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use that
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use the default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-red-50 border-red-100 text-center m-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="max-w-md overflow-hidden text-left bg-gray-100 rounded p-4 mb-6 text-xs whitespace-pre-wrap opacity-75">
            {this.state.error?.toString() || 'Unknown error'}
          </div>
          <Button onClick={this.handleReset} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Custom hook for programmatically triggering errors to be caught by the ErrorBoundary
 */
export function useErrorBoundary() {
  const throwError = (error: Error) => {
    throw error;
  };
  
  return { throwError };
}

/**
 * Wrap a component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

export default ErrorBoundary; 