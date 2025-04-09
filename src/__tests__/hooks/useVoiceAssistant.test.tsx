import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useDocumentStore } from '@/store/zustand';
import { toast } from 'sonner';
import { StoreApi, UseBoundStore } from 'zustand';

// Declare the interfaces in a way that doesn't conflict with global declarations
type MockSpeechRecognitionEvent = {
  results: {
    [index: number]: Array<{transcript: string, confidence: number}>;
    item(index: number): Array<{transcript: string, confidence: number}>;
    length: number;
    isFinal?: boolean;
  };
};

type MockSpeechRecognitionErrorEvent = {
  error: string;
  message: string;
};

// Define type for document store to help with casting
interface DocumentState {
  currentDocument: any;
  highlightedSection: string | null;
  setHighlightedSection?: (sectionId: string | null) => void;
}

// Mock dependencies
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Create mock classes
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult: ((event: MockSpeechRecognitionEvent) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onstart: ((event: Event) => void) | null = null;
  onerror: ((event: MockSpeechRecognitionErrorEvent) => void) | null = null;
  
  isStarted = false;
  
  start = jest.fn().mockImplementation(() => {
    this.isStarted = true;
    if (this.onstart) {
      this.onstart(new Event('start'));
    }
  });
  
  stop = jest.fn().mockImplementation(() => {
    this.isStarted = false;
    if (this.onend) {
      this.onend(new Event('end'));
    }
  });
  
  // Helper method to simulate speech recognition results
  simulateResult(transcript: string, isFinal = true) {
    if (this.onresult && this.isStarted) {
      const mockEvent = {
        results: {
          0: [{transcript, confidence: 0.9}],
          length: 1,
          isFinal,
          item: (index: number) => [{transcript, confidence: 0.9}]
        }
      } as MockSpeechRecognitionEvent;
      
      this.onresult(mockEvent);
    }
  }
  
  // Helper to simulate an error
  simulateError(errorType = 'network') {
    if (this.onerror) {
      const errorEvent = {
        error: errorType,
        message: `Speech recognition error: ${errorType}`
      } as MockSpeechRecognitionErrorEvent;
      
      this.onerror(errorEvent);
    }
  }
}

class MockSpeechSynthesisUtterance {
  text = '';
  voice = null;
  rate = 1;
  pitch = 1;
  onend: ((event: any) => void) | null = null;
  onstart: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  // Helper to simulate utterance events
  simulateStart() {
    if (this.onstart) {
      this.onstart({ utterance: this } as any);
    }
  }
  
  simulateEnd() {
    if (this.onend) {
      this.onend({ utterance: this } as any);
    }
  }
  
  simulateError(message = 'Synthesis error') {
    if (this.onerror) {
      this.onerror({ utterance: this, error: message } as any);
    }
  }
}

// Mocking the global objects
(global as any).SpeechRecognition = MockSpeechRecognition as any;
(global as any).webkitSpeechRecognition = MockSpeechRecognition as any;
(global as any).SpeechSynthesisUtterance = jest.fn().mockImplementation(() => new MockSpeechSynthesisUtterance()) as any;

const mockSpeechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  
  speak: jest.fn().mockImplementation((utterance: MockSpeechSynthesisUtterance) => {
    mockSpeechSynthesis.speaking = true;
    utterance.simulateStart();
    
    // Simulate speech completion after a small delay
    setTimeout(() => {
      mockSpeechSynthesis.speaking = false;
      utterance.simulateEnd();
    }, 10);
  }),
  
  cancel: jest.fn().mockImplementation(() => {
    mockSpeechSynthesis.speaking = false;
    mockSpeechSynthesis.pending = false;
    mockSpeechSynthesis.paused = false;
  }),
  
  pause: jest.fn().mockImplementation(() => {
    mockSpeechSynthesis.paused = true;
  }),
  
  resume: jest.fn().mockImplementation(() => {
    mockSpeechSynthesis.paused = false;
  }),
  
  getVoices: jest.fn().mockReturnValue([]),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

(global as any).speechSynthesis = mockSpeechSynthesis as any;

describe('useVoiceAssistant', () => {
  // References to our mocks for use in tests
  let mockRecognition: MockSpeechRecognition;
  let mockUtterance: MockSpeechSynthesisUtterance;
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock store with document
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123', name: 'Test Document.pdf' },
      highlightedSection: 'section-1'
    });
    
    // Create fresh instances of our mocks
    mockRecognition = new MockSpeechRecognition();
    mockUtterance = new MockSpeechSynthesisUtterance();
    
    // Mock SpeechRecognition API
    Object.defineProperty(window, 'SpeechRecognition', {
      value: jest.fn().mockImplementation(() => mockRecognition),
      writable: true
    });
    
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: jest.fn().mockImplementation(() => mockRecognition),
      writable: true
    });
    
    // Mock SpeechSynthesis API
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true
    });
    
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: jest.fn().mockImplementation(() => mockUtterance),
      writable: true
    });
    
    // Mock fetch success
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        analysis: {
          summary: 'This is a test response',
          riskySections: [{ id: 'section-1', title: 'Test Section' }]
        }
      })
    });
  });
  
  test('initializes with correct default values', () => {
    const { result } = renderHook(() => useVoiceAssistant());
    
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.lastResponse).toBe('');
    expect(result.current.isProcessing).toBe(false);
    
    // Verify recognition is initialized
    expect(window.SpeechRecognition).toHaveBeenCalled();
  });
  
  test('starts and stops listening', () => {
    const { result } = renderHook(() => useVoiceAssistant());
    
    // Start listening
    act(() => {
      result.current.startListening();
    });
    
    // Verify recognition start was called
    expect(mockRecognition.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
    
    // Stop listening
    act(() => {
      result.current.stopListening();
    });
    
    // Verify recognition stop was called
    expect(mockRecognition.stop).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });
  
  test('properly handles speech recognition results', async () => {
    const onResult = jest.fn();
    const { result } = renderHook(() => useVoiceAssistant({ onResult }));
    
    // Start listening
    act(() => {
      result.current.startListening();
    });
    
    // Simulate speech recognition result
    act(() => {
      mockRecognition.simulateResult('This is a test transcript');
    });
    
    // Verify transcript is updated
    expect(result.current.transcript).toBe('This is a test transcript');
    
    // Verify onResult callback was called with the transcript
    expect(onResult).toHaveBeenCalledWith('This is a test transcript');
  });
  
  test('handles speech recognition errors', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useVoiceAssistant({ onError }));
    
    // Start listening
    act(() => {
      result.current.startListening();
    });
    
    // Simulate speech recognition error
    act(() => {
      mockRecognition.simulateError('no-speech');
    });
    
    // Verify onError callback was called
    expect(onError).toHaveBeenCalledWith('no-speech');
  });
  
  test('sends message and processes response', async () => {
    const { result } = renderHook(() => useVoiceAssistant());
    
    await act(async () => {
      await result.current.sendMessage('What are the risks in this document?');
    });
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith('/api/documents/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: 'doc-123',
        question: 'What are the risks in this document?',
        highlightedSectionId: 'section-1'
      })
    });
    
    // Verify response was processed
    expect(result.current.lastResponse).toBe('This is a test response');
    expect(result.current.isProcessing).toBe(false);
  });
  
  test('handles speak functionality', async () => {
    const { result } = renderHook(() => useVoiceAssistant());
    
    act(() => {
      result.current.speak('Test speech');
    });
    
    // Verify utterance was created with correct text
    expect(mockUtterance.text).toBe('Test speech');
    
    // Verify speech synthesis speak was called
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    
    // Verify isSpeaking was set to true when onstart is called
    expect(result.current.isSpeaking).toBe(true);
    
    // Test stopping speech
    act(() => {
      result.current.stopSpeaking();
    });
    
    // Verify synthesis cancel was called
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });
  
  test('handles API errors gracefully', async () => {
    // Mock fetch failure
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });
    
    const { result } = renderHook(() => useVoiceAssistant());
    
    await act(async () => {
      await result.current.sendMessage('What are the risks in this document?');
    });
    
    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('Failed to analyze document');
    expect(result.current.isProcessing).toBe(false);
  });
  
  test('handles missing document gracefully', async () => {
    // Mock store with no document
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: null,
      highlightedSection: null
    });
    
    const { result } = renderHook(() => useVoiceAssistant());
    
    await act(async () => {
      await result.current.sendMessage('What are the risks in this document?');
    });
    
    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('No document loaded');
    expect(result.current.isProcessing).toBe(false);
  });
  
  test('resets transcript correctly', () => {
    const { result } = renderHook(() => useVoiceAssistant());
    
    // Set a transcript by simulating speech recognition
    act(() => {
      result.current.startListening();
      mockRecognition.simulateResult('Testing transcript reset');
    });
    
    // Verify transcript is set
    expect(result.current.transcript).toBe('Testing transcript reset');
    
    // Reset the transcript
    act(() => {
      result.current.resetTranscript();
    });
    
    // Verify transcript is cleared
    expect(result.current.transcript).toBe('');
  });
}); 