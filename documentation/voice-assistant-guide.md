# Voice Assistant Guide

This document provides a comprehensive guide to the voice assistant capabilities in TrustInk, including implementation details, usage patterns, and development roadmap.

## Overview

The TrustInk voice assistant is an AI-powered interface that allows users to interact with their documents using natural language. Users can ask questions about documents, request analyses, and receive responses through both text and speech, creating a more intuitive and accessible document analysis experience.

## Interaction Flows

TrustInk's voice assistant supports two primary interaction modes:

### Text Input → Text Response Flow

1. **User inputs text query** in the chat interface
2. **System processes the query** in the context of the current document
3. **Text response is displayed** in the conversation history
4. **Document sections may be highlighted** based on relevance to the query

### Speech Input → Speech Response Flow

1. **User speaks query** after activating the microphone
2. **Speech is converted to text** using Web Speech API (current) or ElevenLabs Conversational AI (planned)
3. **System processes the text query** in the context of the current document
4. **Text response is displayed** in the conversation history
5. **Response is spoken back** using SpeechSynthesis API (current) or ElevenLabs TTS (planned)
6. **Document sections may be highlighted** based on relevance to the query

## Current Implementation

The voice assistant is currently implemented using the native Web Speech API built into modern browsers:

### Speech Recognition (Speech-to-Text)

- **Technology**: Web Speech API's `SpeechRecognition` interface
- **Implementation**: Custom React hook (`useVoiceAssistant`)
- **Browser Support**: Chrome, Edge, Safari (recent versions)
- **Languages**: Currently optimized for English
- **Features**: 
  - Real-time transcription with interim results
  - Automatic language detection
  - Error handling for unsupported browsers

### Text-to-Speech

- **Technology**: Web Speech API's `SpeechSynthesis` interface
- **Implementation**: Custom React hook (`useVoiceAssistant`)
- **Browser Support**: Most modern browsers
- **Voice Options**: Limited to browser's built-in voices
- **Features**:
  - Voice output for AI responses
  - Start/stop speech control
  - Speaking state management

## ElevenLabs Integration (Next Phase)

We are transitioning from the native Web Speech API to ElevenLabs' Conversational AI for significantly improved voice interactions:

### ElevenLabs Conversational AI Architecture

The system will integrate ElevenLabs Conversational AI platform to provide a complete voice interaction cycle:

1. **Speech to Text**: Enhanced speech recognition with higher accuracy and better handling of technical terminology
2. **Language Model Processing**: Integration with Together AI's Llama 3.1 model for document understanding
3. **Text to Speech**: High-quality natural voice synthesis from ElevenLabs
4. **Turn Taking**: Natural conversation flow with better interruption detection

### Components for ElevenLabs Integration

1. **API Routes**:
   - `/api/i` route: Securely obtains a signed URL from ElevenLabs API using environment variables
   - `/api/c` route: Manages conversation history and message persistence in Supabase

2. **React Components**:
   - `useConversation` hook: Manages connection to ElevenLabs Conversational AI service
   - `TextAnimation`: Displays AI responses with typing animation
   
3. **Conversation Session Flow**:
   ```mermaid
   sequenceDiagram
       participant User
       participant TrustInk
       participant ElevenLabs
       participant TogetherAI
       participant Supabase
       
       User->>TrustInk: Speaks or types query
       TrustInk->>ElevenLabs: Establish conversational session
       ElevenLabs->>TrustInk: Return signed URL
       TrustInk->>ElevenLabs: Connect to conversation service
       User->>TrustInk: Ask document question
       TrustInk->>ElevenLabs: Stream audio/text
       ElevenLabs->>TogetherAI: Process with Llama 3.1
       TogetherAI->>ElevenLabs: Return response
       ElevenLabs->>TrustInk: Stream audio/text response
       TrustInk->>User: Play spoken response
       TrustInk->>Supabase: Store conversation history
   ```

### Implementation Steps

1. **Environment Configuration**:
   ```typescript
   // Required environment variables
   AGENT_ID=<your-elevenlabs-agent-id>
   XI_API_KEY=<your-elevenlabs-api-key>
   ```

2. **ElevenLabs Agent Setup**:
   - Create a customized conversational AI agent in ElevenLabs
   - Configure with Together AI LLM (Llama 3.1)
   - Enable document context awareness through knowledge base

3. **Session Management**:
   ```typescript
   // Using the useConversation hook
   const conversation = useConversation({
     onError: (error: string) => { /* handle error */ },
     onMessage: (props: { message: string; source: Role }) => {
       // Store message in database and update UI
     },
   })

   // Starting a session
   const response = await fetch('/api/i', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
   })
   const data = await response.json()
   await conversation.startSession({ signedUrl: data.apiKey })
   ```

### Integration with Document Context

To make the voice assistant aware of document content, we'll need to:

1. **Provide Document Context**:
   - Send current document sections to the language model
   - Include highlighted section context in queries
   - Use document metadata to improve relevance

2. **Context-aware Responses**:
   - References to specific document sections
   - Highlighting relevant sections during response
   - Direct answers to queries about specific document parts

## Detailed Implementation

### Speech-to-Text Implementation

```typescript
// From useVoiceAssistant hook
const initializeSpeechRecognition = () => {
  if (!isSpeechRecognitionSupported()) {
    console.warn('Speech recognition is not supported in this browser');
    return;
  }
  
  // Get the appropriate SpeechRecognition constructor
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0])
      .map((result) => result.transcript)
      .join('');
    
    setTranscript(transcript);
    setInputText(transcript);
  };
  
  // Additional event handlers
  recognition.onerror = handleRecognitionError;
  recognition.onend = handleRecognitionEnd;
  
  recognitionRef.current = recognition;
};
```

### Text-to-Speech Implementation

```typescript
// From useVoiceAssistant hook
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
```

### API Integration

```typescript
// From useVoiceAssistant hook
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Analysis failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Handle response
    if (result.analysis) {
      // Update conversation history
      addMessageToHistory('user', message);
      addMessageToHistory('assistant', result.analysis.summary);
      
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
```

## ElevenLabs Conversation Implementation

```typescript
// New conversation implementation with ElevenLabs
import { useConversation } from '@11labs/react'
import { toast } from 'sonner'

// Setup conversation connection
const conversation = useConversation({
  onError: (error: string) => { toast(error) },
  onConnect: () => { toast('Connected to ElevenLabs.') },
  onMessage: (props: { message: string; source: Role }) => {
    const { message, source } = props
    
    // Store message in database
    fetch('/api/c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        item: {
          type: 'message',
          status: 'completed',
          object: 'realtime.item',
          id: 'item_' + Math.random(),
          role: source === 'ai' ? 'assistant' : 'user',
          content: [{ type: 'text', transcript: message }],
        },
      }),
    })
  },
})

// Connect to ElevenLabs
const connectConversation = async () => {
  try {
    // Request microphone access
    await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Get signed URL from our API
    const response = await fetch('/api/i', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    
    if (data.error) {
      toast(data.error)
      return
    }
    
    // Connect to ElevenLabs Conversation API
    await conversation.startSession({ signedUrl: data.apiKey })
  } catch (err) {
    toast(`Failed to set up ElevenLabs: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}
```

## Implementation Roadmap

### Near-term Goals (1-2 Months)

1. **ElevenLabs Integration**
   - ⬜ Set up agent in ElevenLabs Conversational AI platform
   - ⬜ Configure custom LLM with Together AI (Llama 3.1)
   - ⬜ Implement document context awareness in agent configuration
   - ⬜ Add conversation persistence via API endpoints

2. **User Experience Refinement**
   - ⬜ Add visual indicators for listening/speaking states
   - ⬜ Implement smooth transitions between voice and text interfaces
   - ⬜ Add loading states for AI processing
   - ⬜ Enhance the UI with status indicators

3. **Error Handling & Fallbacks**
   - ⬜ Implement graceful degradation for unsupported browsers
   - ⬜ Add reconnection logic for dropped connections
   - ⬜ Prepare fallback to Web Speech API when needed
   - ⬜ Add detailed error reporting

### Medium-term Roadmap (3-6 Months)

1. **Advanced Conversation Capabilities**
   - ⬜ Multi-turn conversation with context maintenance
   - ⬜ Conversation history recall
   - ⬜ Better interruption handling
   - ⬜ Context-aware responses with document highlighting

2. **Multi-platform Support**
   - ⬜ Mobile-optimized voice interface
   - ⬜ Progressive Web App (PWA) capabilities
   - ⬜ Background processing for larger documents
   - ⬜ Offline mode with limited functionality

3. **Document-specific Features**
   - ⬜ Intelligent section highlighting during speech
   - ⬜ Voice commands for document navigation
   - ⬜ Automatic summarization of document sections
   - ⬜ Comparative analysis of multiple documents

### Long-term Vision (6-12 Months)

1. **Personalization**
   - ⬜ User-specific voice preferences
   - ⬜ Learning from user interactions
   - ⬜ Personalized terminology adaptation
   - ⬜ Industry-specific knowledge tuning

2. **Enterprise Integration**
   - ⬜ Team-based document analysis
   - ⬜ Integration with enterprise document systems
   - ⬜ Role-based access controls for voice features
   - ⬜ Compliance and audit capabilities

3. **Advanced Analytics**
   - ⬜ Usage pattern analysis
   - ⬜ Query effectiveness metrics
   - ⬜ ROI measurement for AI assistance
   - ⬜ Continuous improvement via feedback loops

## Browser Compatibility

The voice features require browser support for the Web Speech API:

| Browser | Current Support (Web Speech) | Planned Support (ElevenLabs) |
|---------|-------------------|------------------|
| Chrome  | ✅ | ✅ |
| Edge    | ✅ | ✅ |
| Safari  | ✅ | ✅ |
| Firefox | ❌ | ✅ |
| Opera   | ✅ | ✅ |
| iOS Safari | ⚠️ | ✅ |
| Android Chrome | ✅ | ✅ |

## Fallback Mechanisms

For browsers or environments where speech features are not supported:

1. **Text-only Mode**: Voice buttons are disabled, text input/output remains available
2. **Feature Detection**: The application checks for browser support before enabling voice features
3. **Graceful Degradation**: Clear error messages guide users to supported browsers
4. **Progressive Enhancement**: Basic features work everywhere, enhanced features where supported

```typescript
// Feature detection for speech recognition
const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && 
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

// Feature detection for speech synthesis
const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
};
```

## Testing and Quality Assurance

When testing the voice assistant functionality:

1. **Unit Testing**:
   - Test voice assistant core functions in isolation
   - Mock ElevenLabs API responses
   - Verify state transitions during interactions

2. **Integration Testing**:
   - Test communication between frontend and API routes
   - Verify proper error handling
   - Check context maintenance across interactions

3. **End-to-End Testing**:
   - Test complete voice interaction flows
   - Verify document context is properly incorporated
   - Test with different document types and sizes

## Usage Best Practices

To get the most out of the voice assistant:

1. **Clear Pronunciation**: Speak clearly and at a moderate pace
2. **Specific Questions**: Be specific about which parts of the document you're asking about
3. **Use Highlighting**: Select sections before asking for an explanation
4. **Follow-up Questions**: The assistant maintains conversation context for natural follow-ups
5. **Quiet Environment**: Minimize background noise for better recognition
6. **Use Headphones**: For better speech recognition and privacy when using voice features

## User Experience Considerations

1. **Privacy**: Voice data is processed locally in the browser; no audio is stored
2. **Accessibility**: Voice interfaces provide alternative access for users with disabilities
3. **Mobile Usage**: Voice input may be more convenient than typing on mobile devices
4. **Public Environments**: Text input option is available when voice usage is not appropriate

## Conclusion

The TrustInk voice assistant provides a natural and intuitive way to interact with documents, leveraging both text and speech modalities. The current implementation uses native browser APIs for speech recognition and synthesis, with planned improvements to enhance quality, accuracy, and cross-platform support.

By combining the power of AI document analysis with voice interaction, TrustInk creates a more accessible and efficient document analysis experience. 