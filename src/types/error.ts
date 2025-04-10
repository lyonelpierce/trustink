/**
 * Represents the context in which an error occurred
 */
export interface ErrorContext {
  location: string;
  [key: string]: any;
}

/**
 * Options for error handling
 */
export interface ErrorHandlerOptions {
  customMessage?: string;
  suppressErrors?: boolean;
  context: ErrorContext;
  onError?: (error: Error, context: ErrorContext) => void;
}

/**
 * Known error locations in the application
 */
export const ErrorLocations = {
  API_REQUEST: 'API Request',
  DOCUMENT_ANALYSIS: 'Document Analysis',
  DOCUMENT_REVISIONS: 'Document Revisions',
  REVISION_PANEL: 'Revision Panel',
  VOICE_ASSISTANT: 'Voice Assistant',
  ERROR_BOUNDARY: 'Error Boundary'
} as const;

export type ErrorLocation = typeof ErrorLocations[keyof typeof ErrorLocations]; 