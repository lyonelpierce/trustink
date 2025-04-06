import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Helper function to handle errors in tests
 */
export function handleError(error: unknown, options?: { 
  context?: string; 
  customMessage?: string;
  showToast?: boolean;
}): Error {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  if (options?.context) {
    errorObj.message = `[${options.context}] ${errorObj.message}`;
  }
  
  if (options?.customMessage) {
    console.error(`${options.customMessage}: ${errorObj.message}`);
  } else {
    console.error(errorObj.message);
  }
  
  return errorObj;
}

/**
 * Safe async function execution that returns [result, error]
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  options?: { context?: string; showToast?: boolean }
): Promise<[T | null, Error | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const errorObj = handleError(error, options);
    return [null, errorObj];
  }
}

/**
 * Custom render for components that need providers
 */
export function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    // You can add providers here if needed
    ...options
  });
}

export * from '@testing-library/react'; 