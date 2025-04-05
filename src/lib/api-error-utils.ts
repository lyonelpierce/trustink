import { NextResponse } from 'next/server';
import { formatError } from './error-utils';

/**
 * Standard error response structure for API routes
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  status: number;
}

/**
 * API-specific error codes for consistent error handling
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
}

/**
 * Maps API error codes to HTTP status codes
 */
const errorStatusMap: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.CONFLICT]: 409,
};

/**
 * Creates a standardized error response for API routes
 */
export function createApiError(
  message: string,
  code: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    error: message,
    code,
    details,
    status: errorStatusMap[code],
  };
}

/**
 * Handles errors in API routes and returns a standardized NextResponse
 */
export function handleApiError(
  error: unknown,
  context?: string,
  defaultMessage: string = 'An unexpected error occurred'
): NextResponse {
  // Format the error
  const formattedError = formatError(error);
  
  // Log the error with context if provided
  if (context) {
    console.error(`[API:${context}]`, formattedError);
  } else {
    console.error('[API]', formattedError);
  }
  
  // Determine the error message to return to the client
  const errorMessage = formattedError.message || defaultMessage;
  
  // Create a standardized error response
  const apiError = createApiError(
    errorMessage,
    ApiErrorCode.INTERNAL_ERROR,
    process.env.NODE_ENV === 'development' ? formattedError.details : undefined
  );
  
  // Return as NextResponse
  return NextResponse.json({ error: apiError.error, code: apiError.code }, { status: apiError.status });
}

/**
 * Create an unauthorized error response
 */
export function unauthorized(message: string = 'Unauthorized'): NextResponse {
  const apiError = createApiError(message, ApiErrorCode.UNAUTHORIZED);
  return NextResponse.json({ error: apiError.error, code: apiError.code }, { status: apiError.status });
}

/**
 * Create a not found error response
 */
export function notFound(message: string = 'Resource not found'): NextResponse {
  const apiError = createApiError(message, ApiErrorCode.NOT_FOUND);
  return NextResponse.json({ error: apiError.error, code: apiError.code }, { status: apiError.status });
}

/**
 * Create a bad request error response
 */
export function badRequest(message: string = 'Bad request'): NextResponse {
  const apiError = createApiError(message, ApiErrorCode.BAD_REQUEST);
  return NextResponse.json({ error: apiError.error, code: apiError.code }, { status: apiError.status });
}

/**
 * Create a validation error response
 */
export function validationError(message: string = 'Validation error', validationErrors?: Record<string, unknown>): NextResponse {
  const apiError = createApiError(message, ApiErrorCode.VALIDATION_ERROR, validationErrors);
  return NextResponse.json(
    { error: apiError.error, code: apiError.code, details: apiError.details }, 
    { status: apiError.status }
  );
}

/**
 * Create a forbidden error response
 */
export function forbidden(message: string = 'Forbidden'): NextResponse {
  const apiError = createApiError(message, ApiErrorCode.FORBIDDEN);
  return NextResponse.json({ error: apiError.error, code: apiError.code }, { status: apiError.status });
} 