import { toast } from 'sonner';
import { ErrorInfo } from 'react';

/**
 * Options for error handling
 */
export interface ErrorHandlerOptions {
  /**
   * Context where the error occurred for better error identification
   */
  context?: string;
  
  /**
   * Whether to show a toast notification for this error
   */
  showToast?: boolean;
  
  /**
   * Custom toast message to display instead of the error message
   */
  toastMessage?: string;
  
  /**
   * Whether to log this error to the console
   */
  logToConsole?: boolean;
  
  /**
   * Additional data to log with the error
   */
  metadata?: Record<string, unknown>;
  
  /**
   * React error info for component errors
   */
  errorInfo?: ErrorInfo;
  
  /**
   * Custom message to display instead of the error message
   */
  customMessage?: string;
  
  /**
   * Whether to suppress errors
   */
  suppressErrors?: boolean;
  
  /**
   * Callback function to call when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Default error options
 */
const defaultOptions: ErrorHandlerOptions = {
  context: 'Application',
  showToast: true,
  logToConsole: true
};

/**
 * Extended error interface with additional properties
 */
export interface ExtendedError extends Error {
  status?: number;
  response?: {
    status?: number;
    data?: unknown;
  };
  data?: unknown;
  statusCode?: number;
  code?: string;
}

/**
 * Standardized error handler for consistent error handling throughout the application
 * 
 * @param error The error to handle
 * @param options Options for how to handle the error
 * @returns The original error for potential chaining
 */
export function handleError(error: unknown, options?: ErrorHandlerOptions): Error {
  const opts = { ...defaultOptions, ...options };
  const { context, showToast, toastMessage, logToConsole, metadata, errorInfo } = opts;
  
  // Ensure error is an Error object
  const err = error instanceof Error ? error : new Error(String(error));
  const extErr = err as ExtendedError;
  
  // Generate a user-friendly error message
  const userMessage = toastMessage || getErrorMessage(extErr);
  
  // Log to console if enabled
  if (logToConsole) {
    console.error(`[${context}] ${err.message}`, {
      error: err,
      stack: err.stack,
      metadata,
      errorInfo
    });
  }
  
  // Show toast notification if enabled
  if (showToast) {
    toast.error(userMessage);
  }
  
  return err;
}

/**
 * Generate a user-friendly error message based on the error
 */
export function getErrorMessage(error: ExtendedError): string {
  // Check for API specific error formats
  if (error?.status === 401 || error?.response?.status === 401) {
    return 'You are not authorized to perform this action. Please log in again.';
  }
  
  if (error?.status === 403 || error?.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error?.status === 404 || error?.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error?.status === 429 || error?.response?.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  
  if (error?.status === 500 || error?.response?.status === 500) {
    return 'An internal server error occurred. Please try again later.';
  }
  
  // Network errors
  if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  // Default message
  return error.message || 'An unexpected error occurred.';
}

/**
 * Generate a more detailed error description for UI display
 */
export function getErrorDescription(error: ExtendedError): string {
  if (error?.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
    return String(error.response.data.message);
  }
  
  if (error?.data && typeof error.data === 'object' && 'message' in error.data) {
    return String(error.data.message);
  }
  
  if (error?.status === 401 || error?.response?.status === 401) {
    return 'Your session may have expired. Please try logging in again.';
  }
  
  if (error?.status === 403 || error?.response?.status === 403) {
    return 'You do not have the necessary permissions for this action.';
  }
  
  if (error?.status === 413 || error?.response?.status === 413) {
    return 'The file you are trying to upload is too large.';
  }
  
  if ((error?.status ?? 0) >= 500 || (error?.response?.status ?? 0) >= 500) {
    return 'There was an issue on our servers. Our team has been notified.';
  }
  
  return 'Please try again or contact support if the problem persists.';
}

/**
 * A wrapper function for async operations that could throw errors
 * Returns a tuple of [result, error] to avoid try/catch blocks
 * 
 * @example
 * const [data, error] = await safeAsync(fetchData());
 * if (error) {
 *   handleError(error);
 *   return;
 * }
 * // Use data safely here
 */
export async function safeAsync<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

export default handleError;