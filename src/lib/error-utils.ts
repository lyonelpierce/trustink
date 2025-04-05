import { toast } from 'sonner';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if an unknown error is an Error object
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Formats an error for consistent logging and display
 */
export function formatError(error: unknown): ErrorResponse {
  if (isError(error)) {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'ERR_UNKNOWN',
    };
  } else if (typeof error === 'string') {
    return {
      message: error,
      code: 'ERR_STRING',
    };
  } else if (error && typeof error === 'object') {
    // Try to extract known properties
    const obj = error as Record<string, unknown>;
    const message = 
      typeof obj.message === 'string' ? obj.message : 
      typeof obj.error === 'string' ? obj.error :
      'An unknown error occurred';
      
    return {
      message,
      code: typeof obj.code === 'string' ? obj.code : 'ERR_OBJECT',
      details: obj,
    };
  }
  
  return {
    message: 'An unknown error occurred',
    code: 'ERR_UNKNOWN',
  };
}

/**
 * Logs an error with consistent formatting across the application
 */
export function logError(error: unknown, context?: string): void {
  const formattedError = formatError(error);
  
  if (context) {
    console.error(`[${context}]`, formattedError);
  } else {
    console.error(formattedError);
  }
  
  // In production, you might want to send this to a monitoring service
  // reportToErrorMonitoring(formattedError, context);
}

/**
 * Handle an error with standard logging and optional user notification
 */
export function handleError(error: unknown, options?: {
  context?: string;
  showToast?: boolean;
  customMessage?: string;
}): ErrorResponse {
  const { context, showToast = true, customMessage } = options || {};
  
  // Format and log the error
  const formattedError = formatError(error);
  logError(error, context);
  
  // Notify the user if requested
  if (showToast) {
    toast.error(customMessage || formattedError.message);
  }
  
  return formattedError;
}

/**
 * Utility to safely handle async operations with consistent error handling
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  options?: {
    context?: string;
    showToast?: boolean;
    customErrorMessage?: string;
  }
): Promise<[T | null, ErrorResponse | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const formattedError = handleError(error, options);
    return [null, formattedError];
  }
} 