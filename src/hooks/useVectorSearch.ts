import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { SSE } from 'sse.js';

interface VectorSearchOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface VectorSearchResult {
  search: (query: string) => void;
  isSearching: boolean;
  answer: string;
  reset: () => void;
}

/**
 * Hook for performing vector search with streaming responses
 */
export function useVectorSearch(options: VectorSearchOptions = {}): VectorSearchResult {
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState('');

  const reset = useCallback(() => {
    setAnswer('');
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsSearching(true);
    setAnswer('');
    options.onStart?.();

    // Create SSE connection
    const eventSource = new SSE('/api/vector-search', {
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({ query })
    });

    // Handle incoming messages
    eventSource.addEventListener('message', (e: MessageEvent) => {
      try {
        if (e.data === '[DONE]') {
          setIsSearching(false);
          options.onComplete?.();
          return;
        }

        const data = JSON.parse(e.data);
        setAnswer(prev => prev + (data.text || ''));
      } catch (error) {
        console.error('Error processing SSE message:', error);
        options.onError?.('Failed to process response');
      }
    });

    // Handle errors
    eventSource.addEventListener('error', (e: Event) => {
      console.error('SSE error:', e);
      setIsSearching(false);
      options.onError?.('Connection error');
      eventSource.close();
    });

    // Start streaming
    eventSource.stream();

  }, [options]);

  return {
    search,
    isSearching,
    answer,
    reset
  };
} 