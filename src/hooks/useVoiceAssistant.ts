import { useState, useEffect, useCallback, useRef } from 'react';
import { useDocumentStore } from '@/store/zustand';
import { toast } from 'sonner';

// Types for voice assistant
interface VoiceAssistantOptions {
  onResult?: (result: string) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

interface VoiceAssistantState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  lastResponse: string;
  isProcessing: boolean;
}

interface VoiceAssistantActions {
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  sendMessage: (message: string) => Promise<void>;
  resetTranscript: () => void;
}

type UseVoiceAssistantResult = VoiceAssistantState & VoiceAssistantActions;

/**
 * Custom hook for voice-based document interaction
 * Provides voice recognition, text-to-speech, and OpenAI integration
 */
export function useVoiceAssistant(options: VoiceAssistantOptions = {}): UseVoiceAssistantResult {
  // State for voice recognition and speech synthesis
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // References for browser APIs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Get document from store
  const { currentDocument, highlightedSection } = useDocumentStore();

  /**
   * Check if browser supports speech recognition
   */
  const isSpeechRecognitionSupported = useCallback((): boolean => {
    return typeof window !== 'undefined' && 
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  /**
   * Check if browser supports speech synthesis
   */
  const isSpeechSynthesisSupported = useCallback((): boolean => {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }, []);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        // Recognition might already be started
        console.error('Error starting recognition:', error);
        
        // Try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
              setIsListening(true);
            }
          }, 100);
        } catch (retryError) {
          console.error('Error during retry of recognition start:', retryError);
          toast.error('Failed to start speech recognition');
        }
      }
    } else {
      toast.error('Speech recognition not initialized');
    }
  }, [isSpeechRecognitionSupported]);

  /**
   * Initialize speech recognition
   */
  useEffect(() => {
    // Initialize speech recognition if supported
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');
          
          console.log('Transcript:', transcript);
          setTranscript(transcript);
          
          if (options.onResult) {
            options.onResult(transcript);
          }
        };
        
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          if (options.onError) {
            options.onError(event.error);
          }
        };
      }
    }
    
    // Initialize speech synthesis if supported
    if (isSpeechSynthesisSupported()) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      
      if (speechSynthesisRef.current) {
        // Set voice to a female voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => voice.name.includes('female'));
        if (femaleVoice) {
          speechSynthesisRef.current.voice = femaleVoice;
        }
        
        speechSynthesisRef.current.rate = 1.0;
        speechSynthesisRef.current.pitch = 1.0;
        
        speechSynthesisRef.current.onstart = () => {
          console.log('Speech synthesis started');
          setIsSpeaking(true);
        };
        
        speechSynthesisRef.current.onend = () => {
          console.log('Speech synthesis ended');
          setIsSpeaking(false);
        };
        
        speechSynthesisRef.current.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          setIsSpeaking(false);
        };
      }
    }
    
    // Auto-start if enabled
    if (options.autoStart && !isListening) {
      startListening();
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition during cleanup:', error);
        }
      }
      
      if (window.speechSynthesis && isSpeaking) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          console.error('Error canceling speech synthesis during cleanup:', error);
        }
      }
    };
  }, [options, isListening, isSpeaking, isSpeechRecognitionSupported, isSpeechSynthesisSupported, startListening]);

  /**
   * Stop listening for voice input
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [isListening]);

  /**
   * Reset the transcript
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  /**
   * Speak text using speech synthesis
   */
  const speak = useCallback((text: string) => {
    if (!isSpeechSynthesisSupported()) {
      toast.error('Speech synthesis not supported in this browser');
      return;
    }
    
    if (isSpeaking) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        console.error('Error canceling speech synthesis:', error);
      }
    }
    
    if (speechSynthesisRef.current) {
      try {
        speechSynthesisRef.current.text = text;
        window.speechSynthesis.speak(speechSynthesisRef.current);
        setIsSpeaking(true);
      } catch (error) {
        console.error('Error during speech synthesis:', error);
        toast.error('Failed to speak text');
      }
    }
  }, [isSpeaking, isSpeechSynthesisSupported]);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } catch (error) {
        console.error('Error stopping speech synthesis:', error);
      }
    }
  }, [isSpeaking]);

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
        // Save the response for UI display
        setLastResponse(result.analysis.summary || JSON.stringify(result.analysis));
        
        // Optionally speak the response
        if (result.analysis.summary && isSpeechSynthesisSupported()) {
          speak(result.analysis.summary);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to analyze document');
    } finally {
      setIsProcessing(false);
    }
  }, [currentDocument, highlightedSection, speak, isSpeechSynthesisSupported]);

  return {
    isListening,
    isSpeaking,
    transcript,
    lastResponse,
    isProcessing,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    stopSpeaking,
    sendMessage
  };
} 