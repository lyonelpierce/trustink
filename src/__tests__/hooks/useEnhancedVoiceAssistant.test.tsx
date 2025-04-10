import { renderHook, act } from '@testing-library/react';
import { useEnhancedVoiceAssistant } from '@/hooks/useEnhancedVoiceAssistant';
import { useDocumentStore } from '@/store/zustand';
import { ElevenLabsClient } from '@/lib/elevenlabs';

// Mock dependencies
jest.mock('@/store/zustand');

// Mock ElevenLabs client
jest.mock('@/lib/elevenlabs');

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn().mockReturnValue([])
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation(() => ({
  text: '',
  voice: null,
  rate: 1,
  pitch: 1,
  onend: null,
  onstart: null,
  onerror: null
}));

describe('useEnhancedVoiceAssistant', () => {
  const mockDocument = {
    id: 'doc-123',
    name: 'Test Document'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document store with proper type casting
    ((useDocumentStore as unknown) as jest.Mock).mockReturnValue({
      currentDocument: mockDocument,
      highlightedSection: 'section-1'
    });

    // Mock Web Speech API
    Object.defineProperty(window, 'SpeechRecognition', {
      value: jest.fn().mockImplementation(() => mockSpeechRecognition),
      writable: true
    });

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: jest.fn().mockImplementation(() => mockSpeechRecognition),
      writable: true
    });

    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true
    });

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: mockSpeechSynthesisUtterance,
      writable: true
    });

    // Mock environment variables
    process.env.NEXT_PUBLIC_AGENT_ID = 'test-agent-id';
    process.env.NEXT_PUBLIC_XI_API_KEY = 'test-api-key';
  });

  test('initializes with ElevenLabs when credentials are available', async () => {
    const mockInitialize = jest.fn().mockResolvedValue(undefined);
    const mockStartConversation = jest.fn().mockResolvedValue(undefined);
    
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: mockInitialize,
      startConversation: mockStartConversation
    }));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123'
    }));

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockStartConversation).toHaveBeenCalledWith(expect.objectContaining({
      documentContext: expect.objectContaining({
        id: mockDocument.id
      })
    }));
    expect(result.current.state.mode).toBe('elevenlabs');
  });

  test('falls back to Web Speech API when ElevenLabs initialization fails', async () => {
    const mockInitialize = jest.fn().mockRejectedValue(new Error('Failed to initialize'));
    
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: mockInitialize
    }));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123'
    }));

    // Wait for initialization and fallback
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.state.mode).toBe('web-speech');
  });

  test('handles starting and stopping listening in Web Speech mode', async () => {
    // Force Web Speech mode by making ElevenLabs fail
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('Failed'))
    }));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123'
    }));

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Start listening
    await act(async () => {
      await result.current.startListening();
    });

    expect(mockSpeechRecognition.start).toHaveBeenCalled();

    // Stop listening
    act(() => {
      result.current.stopListening();
    });

    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  test('handles speech synthesis in Web Speech mode', async () => {
    // Force Web Speech mode
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('Failed'))
    }));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123'
    }));

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Speak text
    act(() => {
      result.current.speak('Hello, world!');
    });

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
  });

  test('sends messages through ElevenLabs when available', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue(undefined);
    
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      startConversation: jest.fn().mockResolvedValue(undefined),
      sendMessage: mockSendMessage
    }));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123'
    }));

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Send message
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockSendMessage).toHaveBeenCalledWith('Hello');
  });

  test('sends messages through API in Web Speech mode', async () => {
    // Mock fetch for API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        analysis: {
          summary: 'Test response'
        }
      })
    });

    // Force Web Speech mode
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('Failed'))
    }));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123'
    }));

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Send message
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/documents/analyze',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Hello')
      })
    );
  });

  test('handles errors gracefully', async () => {
    const mockOnError = jest.fn();

    // Force Web Speech mode and API error
    (ElevenLabsClient as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('Failed'))
    }));

    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useEnhancedVoiceAssistant({
      documentId: 'doc-123',
      onError: mockOnError
    }));

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Send message (should fail)
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockOnError).toHaveBeenCalledWith('Failed to process message');
  });
}); 