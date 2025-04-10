import { config } from '@/config';
import { handleError } from '@/lib/error-handler';
import { SectionRevision } from '@/types';
import { ErrorLocations } from '@/types/error';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestOptions extends RequestInit {
  /** Query parameters to append to the URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Whether to show toast notifications on error */
  showErrorToast?: boolean;
  /** Whether to retry failed requests */
  retry?: boolean;
  /** Number of retry attempts */
  retryCount?: number;
  /** Custom error handler function */
  onError?: (error: Error) => void;
  /** Whether to throw errors (false will return null on error) */
  throwErrors?: boolean;
  /** Authentication token (if not using the default auth) */
  token?: string;
}

interface ApiResponse<T> {
  /** The response data */
  data: T | null;
  /** Any error that occurred */
  error: Error | null;
  /** HTTP status code */
  status: number;
  /** Whether the request was successful */
  success: boolean;
}

// Extended error interface for API errors that can include status
interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: unknown;
}

const DEFAULT_OPTIONS: ApiRequestOptions = {
  showErrorToast: true,
  retry: false,
  retryCount: 3,
  throwErrors: false,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Builds a URL with query parameters
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return baseUrl;

  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Makes an API request with standardized error handling
 */
export async function apiRequest<T = unknown>(
  url: string,
  method: HttpMethod = 'GET',
  data?: unknown,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const mergedOptions: ApiRequestOptions = { ...DEFAULT_OPTIONS, ...options };
  const { 
    params,
    showErrorToast,
    retry,
    retryCount,
    onError,
    throwErrors,
    ...fetchOptions
  } = mergedOptions;

  const requestUrl = buildUrl(url, params);
  
  // Add request body if not GET
  if (method !== 'GET' && data) {
    fetchOptions.body = JSON.stringify(data);
  }

  // Setup auth header if configured
  const headers = fetchOptions.headers as Record<string, string> || {};
  const useAuthHeader = config.api.useAuthHeader !== false; // Default to true if not specified
  
  if (useAuthHeader && !headers['Authorization']) {
    const token = options.token || await getAuthToken();
    if (token) {
      fetchOptions.headers = {
        ...headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  try {
    let attempts = 0;
    let response: Response | null = null;
    let error: Error | null = null;

    // Handle retries
    while (!response && attempts <= (retry ? retryCount! : 0)) {
      if (attempts > 0) {
        // Add exponential backoff
        await new Promise(r => setTimeout(r, 2 ** attempts * 100));
      }

      try {
        response = await fetch(requestUrl, {
          method,
          ...fetchOptions,
        });
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        attempts++;
      }
    }

    if (!response) {
      throw error || new Error('Network request failed');
    }

    let data: T | null = null;
    const contentType = response.headers.get('content-type');
    
    // Parse JSON if the content type is JSON
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      // Handle text responses
      const text = await response.text();
      data = text as unknown as T;
    }

    if (!response.ok) {
      // Create appropriate error with API error details
      const apiError = new Error(
        data && typeof data === 'object' && 'message' in data
          ? String(data.message)
          : `API Error: ${response.status} ${response.statusText}`
      ) as ApiError;
      
      // Add response details to the error object
      apiError.status = response.status;
      apiError.statusText = response.statusText;
      apiError.data = data;

      throw apiError;
    }

    return {
      data,
      error: null,
      status: response.status,
      success: true,
    };
  } catch (error) {
    const err = error instanceof Error ? error as ApiError : new Error(String(error));
    
    // Handle the error
    handleError(err, {
      customMessage: `API request failed: ${method} ${url}`,
      context: { location: ErrorLocations.API_REQUEST },
      showToast: true
    });

    // Either throw the error or return a response with the error
    if (throwErrors) {
      throw err;
    }

    // Safely access status property which is now defined on ApiError
    const errorStatus = (err as ApiError).status || 500;

    return {
      data: null,
      error: err,
      status: errorStatus,
      success: false,
    };
  }
}

/**
 * Helper function to get the authentication token
 * This should be customized based on your auth provider
 */
async function getAuthToken(): Promise<string | null> {
  // This is a placeholder - replace with your auth implementation
  // For example, if using Clerk:
  // import { auth } from '@clerk/nextjs';
  // const { getToken } = auth();
  // return getToken();
  
  return null;
}

/**
 * HTTP methods wrapped for convenience
 */
export const api = {
  get: <T = unknown>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(url, 'GET', undefined, options),
    
  post: <T = unknown>(url: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(url, 'POST', data, options),
    
  put: <T = unknown>(url: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(url, 'PUT', data, options),
    
  patch: <T = unknown>(url: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(url, 'PATCH', data, options),
    
  delete: <T = unknown>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(url, 'DELETE', undefined, options),
};

/**
 * Fetch all revisions for a document
 */
export async function getRevisionsByDocument(documentId: string): Promise<SectionRevision[]> {
  const response = await fetch(`/api/documents/${documentId}/revisions`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch revisions');
  }
  
  return await response.json();
}

/**
 * Accept a revision
 */
export async function acceptRevision(revisionId: string): Promise<unknown> {
  const response = await fetch(`/api/revisions/${revisionId}/accept`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept revision');
  }
  
  return await response.json();
}

/**
 * Reject a revision
 */
export async function rejectRevision(revisionId: string): Promise<unknown> {
  const response = await fetch(`/api/revisions/${revisionId}/reject`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reject revision');
  }
  
  return await response.json();
}

export default api; 