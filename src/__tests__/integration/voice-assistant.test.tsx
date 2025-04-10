import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { DeepgramContextProvider } from '@/lib/deepgram-context';
import { MicrophoneContextProvider } from '@/lib/microphone-context';
import { useDocumentStore } from '@/store/zustand';
import { toast } from 'sonner';
import { createMediaRecorderMock } from '../lib/test-utils';

// Mock dependencies
jest.mock('@/store/zustand', () => ({
  useDocumentStore: jest.fn()
}));
jest.mock('sonner');

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Voice Assistant Integration', () => {
  // Mock MediaRecorder and getUserMedia
  const mockMediaRecorder = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    state: 'inactive'
  };

  const mockMediaStream = {
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
  };

  // Mock Deepgram connection
  const mockDeepgramConnection = {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    finish: jest.fn(),
    send: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
      },
      writable: true
    });

    // Mock MediaRecorder constructor with isTypeSupported
    const { MediaRecorderMock } = createMediaRecorderMock();
    global.MediaRecorder = MediaRecorderMock;

    // Mock successful API key fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/authenticate') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ key: 'test-api-key' })
        });
      }
      if (url === '/api/documents/analyze') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            analysis: {
              summary: 'This is a test response'
            }
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock document store with proper type casting
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: { id: 'doc-123', name: 'Test Document' },
      highlightedSection: null
    });
  });

  const renderVoiceAssistant = () => {
    return render(
      <DeepgramContextProvider>
        <MicrophoneContextProvider>
          <VoiceAssistant />
        </MicrophoneContextProvider>
      </DeepgramContextProvider>
    );
  };

  test('renders initial state correctly', () => {
    renderVoiceAssistant();

    expect(screen.getByText(/Ask me anything about this document/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Document/i)).toBeInTheDocument();
  });

  test('handles complete voice interaction flow', async () => {
    renderVoiceAssistant();

    // Start listening
    const micButton = screen.getByTitle('Start listening');
    fireEvent.click(micButton);

    // Wait for microphone setup
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Simulate transcription from Deepgram
    const transcriptHandler = mockDeepgramConnection.addListener.mock.calls.find(
      call => call[0] === 'transcript'
    )?.[1];

    if (transcriptHandler) {
      act(() => {
        transcriptHandler({
          channel: {
            alternatives: [{ transcript: 'What are the risks in this document?' }]
          }
        });
      });
    }

    // Verify transcript appears
    expect(screen.getByText('What are the risks in this document?')).toBeInTheDocument();

    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Wait for API response
    await waitFor(() => {
      expect(screen.getByText('This is a test response')).toBeInTheDocument();
    });

    // Stop listening
    const stopButton = screen.getByTitle('Stop listening');
    fireEvent.click(stopButton);

    expect(mockMediaRecorder.pause).toHaveBeenCalled();
  });

  test('handles microphone permission denial', async () => {
    // Mock permission denial
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
      new Error('Permission denied')
    );

    renderVoiceAssistant();

    // Try to start listening
    const micButton = screen.getByTitle('Start listening');
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to access microphone');
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/documents/analyze') {
        return Promise.reject(new Error('API Error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ key: 'test-api-key' })
      });
    });

    renderVoiceAssistant();

    // Type a message
    const textarea = screen.getByPlaceholderText(/Ask a question/i);
    fireEvent.change(textarea, { target: { value: 'Test question' } });

    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to analyze document');
    });
  });

  test('handles no document loaded state', async () => {
    // Mock no document loaded with proper type casting
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: null,
      highlightedSection: null
    });

    renderVoiceAssistant();

    // Type a message
    const textarea = screen.getByPlaceholderText(/Ask a question/i);
    fireEvent.change(textarea, { target: { value: 'Test question' } });

    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No document loaded');
    });
  });

  test('handles concurrent voice and text input', async () => {
    renderVoiceAssistant();

    // Start listening
    const micButton = screen.getByTitle('Start listening');
    fireEvent.click(micButton);

    // Type text while listening
    const textarea = screen.getByPlaceholderText(/Ask a question/i);
    fireEvent.change(textarea, { target: { value: 'Typed question' } });

    // Simulate voice input
    const transcriptHandler = mockDeepgramConnection.addListener.mock.calls.find(
      call => call[0] === 'transcript'
    )?.[1];

    if (transcriptHandler) {
      act(() => {
        transcriptHandler({
          channel: {
            alternatives: [{ transcript: 'Spoken question' }]
          }
        });
      });
    }

    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Verify the typed text takes precedence
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/documents/analyze',
        expect.objectContaining({
          body: expect.stringContaining('Typed question')
        })
      );
    });
  });
}); 