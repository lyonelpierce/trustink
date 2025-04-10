import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { DeepgramContextProvider, useDeepgram, LiveConnectionState } from '@/lib/deepgram-context';
import { toast } from 'sonner';

// Mock Deepgram connection
const mockConnection = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  finish: jest.fn(),
  send: jest.fn()
};

// Mock dependencies
jest.mock('@deepgram/sdk', () => ({
  createClient: jest.fn(() => ({
    listen: {
      live: jest.fn(() => mockConnection)
    }
  })),
  LiveConnectionState: {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN'
  },
  LiveTranscriptionEvents: {
    Open: 'open',
    Close: 'close',
    Error: 'error',
    Transcript: 'transcript'
  }
}));

jest.mock('sonner');

// Mock fetch for API key
global.fetch = jest.fn();

describe('DeepgramContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API key fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ key: 'test-api-key' })
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DeepgramContextProvider>{children}</DeepgramContextProvider>
  );

  test('initializes with closed connection state', () => {
    const { result } = renderHook(() => useDeepgram(), { wrapper });

    expect(result.current.connectionState).toBe(LiveConnectionState.CLOSED);
    expect(result.current.connection).toBeNull();
  });

  test('connects to Deepgram successfully', async () => {
    const { result } = renderHook(() => useDeepgram(), { wrapper });

    const options = {
      language: 'en-US',
      model: 'nova-2',
      punctuate: true
    };

    await act(async () => {
      await result.current.connectToDeepgram(options);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/authenticate', { cache: 'no-store' });
    expect(result.current.connection).not.toBeNull();
    expect(mockConnection.addListener).toHaveBeenCalledTimes(3); // Open, Close, Error
  });

  test('handles connection events correctly', async () => {
    const { result } = renderHook(() => useDeepgram(), { wrapper });

    await act(async () => {
      await result.current.connectToDeepgram({});
    });

    // Get event handlers
    const openHandler = mockConnection.addListener.mock.calls.find(
      call => call[0] === 'open'
    )[1];
    const closeHandler = mockConnection.addListener.mock.calls.find(
      call => call[0] === 'close'
    )[1];
    const errorHandler = mockConnection.addListener.mock.calls.find(
      call => call[0] === 'error'
    )[1];

    // Simulate connection open
    act(() => {
      openHandler();
    });
    expect(result.current.connectionState).toBe(LiveConnectionState.OPEN);

    // Simulate connection close
    act(() => {
      closeHandler();
    });
    expect(result.current.connectionState).toBe(LiveConnectionState.CLOSED);

    // Simulate error
    act(() => {
      errorHandler(new Error('Test error'));
    });
    expect(toast.error).toHaveBeenCalledWith('Speech recognition error');
  });

  test('handles API key fetch failure', async () => {
    // Mock API key fetch failure
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401
    });

    const { result } = renderHook(() => useDeepgram(), { wrapper });

    await act(async () => {
      try {
        await result.current.connectToDeepgram({});
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.connection).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Failed to connect to speech service');
  });

  test('disconnects from Deepgram', async () => {
    const { result } = renderHook(() => useDeepgram(), { wrapper });

    // Connect first
    await act(async () => {
      await result.current.connectToDeepgram({});
    });

    // Disconnect
    act(() => {
      result.current.disconnectFromDeepgram();
    });

    expect(mockConnection.finish).toHaveBeenCalled();
    expect(result.current.connection).toBeNull();
    expect(result.current.connectionState).toBe(LiveConnectionState.CLOSED);
  });

  test('throws error when used outside provider', () => {
    const { result } = renderHook(() => useDeepgram());
    
    // Verify that accessing result.current throws the expected error
    expect(() => {
      console.log(result.current);
    }).toThrow('useDeepgram must be used within a DeepgramContextProvider');
  });

  test('handles network errors during connection', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDeepgram(), { wrapper });

    await act(async () => {
      try {
        await result.current.connectToDeepgram({});
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.connection).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Failed to connect to speech service');
  });
}); 