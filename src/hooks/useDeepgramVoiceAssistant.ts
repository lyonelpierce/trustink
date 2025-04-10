import { useState, useEffect, useCallback } from 'react';
import { useDeepgram, LiveConnectionState, LiveTranscriptionEvents } from '@/lib/deepgram-context';
import { useMicrophone, MicrophoneState } from '@/lib/microphone-context';
import { useDocumentStore } from '@/store/zustand';
import { toast } from 'sonner';
import { ErrorLocations } from '@/types/error';

interface UseDeepgramVoiceAssistantOptions {
  onResult?: (result: string) => void;
  onError?: (error: string) => void;
}

interface UseDeepgramVoiceAssistantResult {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  lastResponse: string;
  isProcessing: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendMessage: (message: string) => Promise<void>;
}

/**
 * Custom hook for voice-based document interaction using Deepgram
 */
export function useDeepgramVoiceAssistant(
  options: UseDeepgramVoiceAssistantOptions = {}
): UseDeepgramVoiceAssistantResult {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // External hooks
  const { connection, connectToDeepgram, disconnectFromDeepgram, connectionState } = useDeepgram();
  const { microphone, setupMicrophone, startMicrophone, stopMicrophone, microphoneState } = useMicrophone();
  const { currentDocument, highlightedSection } = useDocumentStore();

  // Store event handlers for cleanup
  const transcriptHandler = useCallback((data: any) => {
    const transcript = data.channel?.alternatives?.[0]?.transcript || '';
    setTranscript(transcript);
    if (options.onResult) {
      options.onResult(transcript);
    }
  }, [options]);

  const errorHandler = useCallback((error: Error) => {
    console.error('Deepgram error:', error);
    if (options.onError) {
      options.onError(error.message);
    }
  }, [options]);

  const dataHandler = useCallback((event: BlobEvent) => {
    if (connection) {
      connection.send(event.data);
    }
  }, [connection]);

  const micErrorHandler = useCallback((event: Event) => {
    console.error('Microphone error:', event);
    setIsListening(false);
    toast.error('Microphone error occurred');
  }, []);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(async () => {
    try {
      // Setup microphone if not ready
      if (microphoneState === MicrophoneState.NotSetup) {
        await setupMicrophone();
      }

      if (!microphone) {
        throw new Error('Failed to access microphone');
      }

      // Connect to Deepgram if not connected
      if (connectionState === LiveConnectionState.CLOSED) {
        await connectToDeepgram({
          language: 'en-US',
          model: 'nova-2',
          punctuate: true,
          interim_results: true
        });
      }

      if (!connection) {
        throw new Error('Failed to connect to speech service');
      }

      // Set up event handlers
      connection.addListener(LiveTranscriptionEvents.Transcript, transcriptHandler);
      connection.addListener(LiveTranscriptionEvents.Error, errorHandler);
      microphone.addEventListener('dataavailable', dataHandler);
      microphone.addEventListener('error', micErrorHandler);

      // Start recording
      startMicrophone();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start voice recognition');
      setIsListening(false);
    }
  }, [
    microphoneState,
    setupMicrophone,
    microphone,
    connectionState,
    connectToDeepgram,
    connection,
    startMicrophone,
    transcriptHandler,
    errorHandler,
    dataHandler,
    micErrorHandler
  ]);

  /**
   * Stop listening for voice input
   */
  const stopListening = useCallback(() => {
    if (connection) {
      connection.removeListener(LiveTranscriptionEvents.Transcript, transcriptHandler);
      connection.removeListener(LiveTranscriptionEvents.Error, errorHandler);
    }
    if (microphone) {
      microphone.removeEventListener('dataavailable', dataHandler);
      microphone.removeEventListener('error', micErrorHandler);
    }
    stopMicrophone();
    setIsListening(false);
  }, [connection, microphone, stopMicrophone, transcriptHandler, errorHandler, dataHandler, micErrorHandler]);

  /**
   * Send message to the AI for processing
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!currentDocument) {
      toast.error('No document loaded');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare request with document context
      const requestBody = {
        documentId: currentDocument.id,
        question: message,
        highlightedSectionId: highlightedSection
      };

      // Send to API
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status: ${response.status}`);
      }

      const result = await response.json();

      // Handle response
      if (result.analysis) {
        setLastResponse(result.analysis.summary || JSON.stringify(result.analysis));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to analyze document');
    } finally {
      setIsProcessing(false);
    }
  }, [currentDocument, highlightedSection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isSpeaking,
    transcript,
    lastResponse,
    isProcessing,
    startListening,
    stopListening,
    sendMessage
  };
} 