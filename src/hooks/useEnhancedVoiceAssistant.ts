import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ElevenLabsClient, ConversationMessage, ConversationState } from '@/lib/elevenlabs';
import { TogetherAIService, DocumentContext } from '@/lib/together-ai';
import { useDocumentStore } from '@/store/zustand';

interface UseEnhancedVoiceAssistantOptions {
  documentId: string;
  onError?: (error: string) => void;
  onStateChange?: (state: VoiceAssistantState) => void;
  onAction?: (action: { type: string; sectionId?: string; content?: string }) => void;
}

interface VoiceAssistantState {
  mode: 'elevenlabs' | 'web-speech';
  status: ConversationState | 'idle';
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  messages: ConversationMessage[];
}

export function useEnhancedVoiceAssistant(options: UseEnhancedVoiceAssistantOptions) {
  const [state, setState] = useState<VoiceAssistantState>({
    mode: 'elevenlabs',
    status: 'idle',
    isListening: false,
    isSpeaking: false,
    transcript: '',
    messages: []
  });

  const elevenLabsClient = useRef<ElevenLabsClient | null>(null);
  const togetherAIService = useRef<TogetherAIService | null>(null);
  const { currentDocument, highlightedSection } = useDocumentStore();
  
  // Web Speech API refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Together AI
        const togetherApiKey = process.env.NEXT_PUBLIC_TOGETHER_API_KEY;
        if (!togetherApiKey) {
          throw new Error('Missing Together AI credentials');
        }

        togetherAIService.current = new TogetherAIService({
          apiKey: togetherApiKey,
          model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
        });

        // Initialize ElevenLabs
        const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
        const apiKey = process.env.NEXT_PUBLIC_XI_API_KEY;

        if (!agentId || !apiKey) {
          throw new Error('Missing ElevenLabs credentials');
        }

        elevenLabsClient.current = new ElevenLabsClient({
          agentId,
          apiKey
        });

        await elevenLabsClient.current.initialize();

        // Start conversation with document context
        if (currentDocument?.id) {
          await elevenLabsClient.current.startConversation({
            documentContext: {
              id: currentDocument.id,
              content: JSON.stringify(currentDocument),
              highlightedSection: highlightedSection || undefined
            },
            onMessage: handleMessage,
            onError: handleError,
            onStateChange: handleStateChange
          });
        } else {
          throw new Error('No document loaded');
        }
      } catch (error) {
        console.warn('Falling back to Web Speech API:', error);
        initializeWebSpeech();
      }
    };

    initializeServices();

    return () => {
      elevenLabsClient.current?.disconnect();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentDocument, highlightedSection]);

  // Initialize Web Speech API
  const initializeWebSpeech = useCallback(() => {
    setState(prev => ({ ...prev, mode: 'web-speech' }));

    if (typeof window === 'undefined') return;

    // Initialize speech recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
          setState(prev => ({ ...prev, isListening: true }));
        };

        recognitionRef.current.onend = () => {
          setState(prev => ({ ...prev, isListening: false }));
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');

          setState(prev => ({ ...prev, transcript }));
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          options.onError?.(event.error);
        };
      }
    }

    // Initialize speech synthesis
    if (window.speechSynthesis) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      
      if (speechSynthesisRef.current) {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => voice.name.includes('female'));
        if (femaleVoice) {
          speechSynthesisRef.current.voice = femaleVoice;
        }

        speechSynthesisRef.current.rate = 1.0;
        speechSynthesisRef.current.pitch = 1.0;

        speechSynthesisRef.current.onstart = () => {
          setState(prev => ({ ...prev, isSpeaking: true }));
        };

        speechSynthesisRef.current.onend = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
        };
      }
    }
  }, [options]);

  const handleMessage = useCallback((message: ConversationMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));

    // Speak response if it's from the assistant
    if (message.role === 'assistant') {
      speak(message.content);
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Voice assistant error:', error);
    options.onError?.(error.message);

    // If using ElevenLabs and it fails, fall back to Web Speech
    if (state.mode === 'elevenlabs') {
      initializeWebSpeech();
    }
  }, [options, state.mode, initializeWebSpeech]);

  const handleStateChange = useCallback((status: ConversationState) => {
    setState(prev => ({ ...prev, status }));
    options.onStateChange?.({ ...state, status });
  }, [options, state]);

  const startListening = useCallback(async () => {
    if (state.mode === 'elevenlabs') {
      // ElevenLabs implementation will handle this automatically
      return;
    }

    // Web Speech API implementation
    if (recognitionRef.current) {
      try {
        await recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        options.onError?.('Failed to start speech recognition');
      }
    }
  }, [state.mode, options]);

  const stopListening = useCallback(() => {
    if (state.mode === 'elevenlabs') {
      // ElevenLabs implementation will handle this automatically
      return;
    }

    // Web Speech API implementation
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [state.mode]);

  const speak = useCallback((text: string) => {
    if (state.mode === 'elevenlabs') {
      // ElevenLabs will handle speech synthesis
      return;
    }

    // Web Speech API implementation
    if (window.speechSynthesis && speechSynthesisRef.current) {
      try {
        window.speechSynthesis.cancel(); // Stop any current speech
        speechSynthesisRef.current.text = text;
        window.speechSynthesis.speak(speechSynthesisRef.current);
      } catch (error) {
        console.error('Error during speech synthesis:', error);
        options.onError?.('Failed to speak text');
      }
    }
  }, [state.mode, options]);

  const processWithTogetherAI = async (query: string): Promise<string> => {
    if (!togetherAIService.current || !currentDocument) {
      throw new Error('AI service not initialized or no document loaded');
    }

    const context: DocumentContext = {
      content: JSON.stringify(currentDocument),
      highlightedSection: highlightedSection ? {
        id: highlightedSection,
        content: 'section content' // You'll need to get this from your document store
      } : undefined,
      previousMessages: state.messages.slice(-3)
    };

    const result = await togetherAIService.current.processQuery(query, context);

    // Handle any actions from the AI
    result.actions.forEach(action => {
      options.onAction?.(action);
    });

    return result.message;
  };

  const sendMessage = useCallback(async (content: string) => {
    try {
      // Create user message
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now()
      };

      // Add user message to state
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));

      let response: string;

      if (state.mode === 'elevenlabs' && elevenLabsClient.current) {
        // Use ElevenLabs for voice
        await elevenLabsClient.current.sendMessage(content);
      } else {
        // Process with Together AI and use Web Speech API for voice
        response = await processWithTogetherAI(content);

        // Create assistant message
        const assistantMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };

        // Update messages state
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage]
        }));

        // Speak the response
        speak(response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      options.onError?.('Failed to process message');
    }
  }, [state.mode, options.documentId, highlightedSection, speak, options.onError, options.onAction]);

  return {
    state,
    startListening,
    stopListening,
    speak,
    sendMessage
  };
} 