import { renderHook, act } from '@testing-library/react';
import { useDeepgramVoiceAssistant } from '@/hooks/useDeepgramVoiceAssistant';
import { useDeepgram, LiveConnectionState, LiveTranscriptionEvents } from '@/lib/deepgram-context';
import { useMicrophone, MicrophoneState } from '@/lib/microphone-context';
import { useDocumentStore } from '@/store/zustand';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/deepgram-context');
jest.mock('@/lib/microphone-context');
jest.mock('@/store/zustand');
jest.mock('sonner');

describe('useDeepgramVoiceAssistant', () => {
  // Mock connection and microphone instances
  const mockConnection = {
    send: jest.fn(),
    finish: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn()
  };

  const mockMicrophone = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    state: 'inactive'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Deepgram context
    (useDeepgram as jest.Mock).mockReturnValue({
      connection: mockConnection,
      connectToDeepgram: jest.fn(),
      disconnectFromDeepgram: jest.fn(),
      connectionState: LiveConnectionState.CLOSED
    });

    // Mock Microphone context
    (useMicrophone as jest.Mock).mockReturnValue({
      microphone: mockMicrophone,
      startMicrophone: jest.fn(),
      stopMicrophone: jest.fn(),
      setupMicrophone: jest.fn(),
      microphoneState: MicrophoneState.Ready
    });

    // Mock store with document
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123', name: 'Test Document.pdf' },
      highlightedSection: 'section-1'
    });
  });

  test('initializes with correct default values', () => {
    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.isProcessing).toBe(false);
  });

  test('starts listening when startListening is called', async () => {
    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);
    expect(mockConnection.addListener).toHaveBeenCalledWith(
      LiveTranscriptionEvents.Transcript,
      expect.any(Function)
    );
  });

  test('stops listening when stopListening is called', async () => {
    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    await act(async () => {
      await result.current.startListening();
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
    expect(mockConnection.finish).toHaveBeenCalled();
  });

  test('handles transcription events correctly', async () => {
    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    // Start listening
    await act(async () => {
      await result.current.startListening();
    });

    // Get the transcription callback
    const transcriptionCallback = mockConnection.addListener.mock.calls.find(
      call => call[0] === LiveTranscriptionEvents.Transcript
    )[1];

    // Simulate transcription event
    act(() => {
      transcriptionCallback({
        channel: {
          alternatives: [{ transcript: 'Test transcript' }]
        }
      });
    });

    expect(result.current.transcript).toBe('Test transcript');
  });

  test('sends message to API for processing', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        analysis: {
          summary: 'Test response'
        }
      })
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/documents/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: 'doc-123',
        question: 'Test message',
        highlightedSectionId: null
      })
    });
  });

  test('handles API errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to analyze document');
    expect(result.current.isProcessing).toBe(false);
  });

  test('handles microphone setup errors', async () => {
    const setupError = new Error('Microphone setup failed');
    (useMicrophone as jest.Mock).mockReturnValue({
      microphone: null,
      setupMicrophone: jest.fn().mockRejectedValue(setupError),
      microphoneState: MicrophoneState.Error
    });

    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    await act(async () => {
      await result.current.startListening();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to access microphone');
    expect(result.current.isListening).toBe(false);
  });

  test('handles Deepgram connection errors', async () => {
    (useDeepgram as jest.Mock).mockReturnValue({
      connection: null,
      connectToDeepgram: jest.fn().mockRejectedValue(new Error('Connection failed')),
      connectionState: LiveConnectionState.CLOSED
    });

    const { result } = renderHook(() => useDeepgramVoiceAssistant());

    await act(async () => {
      await result.current.startListening();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to connect to speech service');
    expect(result.current.isListening).toBe(false);
  });

  test('cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() => useDeepgramVoiceAssistant());

    unmount();

    expect(mockConnection.removeListener).toHaveBeenCalled();
    expect(mockMicrophone.removeEventListener).toHaveBeenCalled();
  });
}); 