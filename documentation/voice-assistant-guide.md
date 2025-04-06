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
2. **Speech is converted to text** using Web Speech API
3. **System processes the text query** in the context of the current document
4. **Text response is displayed** in the conversation history
5. **Response is spoken back** using SpeechSynthesis API
6. **Document sections may be highlighted** based on relevance to the query

## Current Implementation

The voice assistant is implemented using the native Web Speech API built into modern browsers:

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

## Planned Enhancements

### Near-term Improvements (Next 1-2 Months)

1. **Enhanced Speech Recognition**
   - Improved error handling for background noise
   - Support for longer utterances
   - Better handling of technical terminology

2. **Improved Text-to-Speech**
   - More natural-sounding voices
   - Enhanced prosody and pacing
   - Better pronunciation of technical terms

3. **User Experience Improvements**
   - Visual feedback during speech recognition
   - Clearer indication of listening state
   - Save voice preferences per user

### Medium-term Roadmap (3-6 Months)

1. **External API Integration**
   - **ElevenLabs Integration**: Replace browser's built-in TTS with higher quality voice synthesis
   - **OpenAI Whisper Integration**: Improve speech recognition accuracy
   - **Azure Speech Services**: Alternative for enterprise deployments

2. **Multi-platform Support**
   - Mobile-optimized voice interface
   - Progressive Web App (PWA) support
   - Background processing for longer documents

3. **Advanced Voice Features**
   - Voice authentication for secure document access
   - Voice commands for application navigation
   - Voice-triggered document actions (highlight, export, share)

## Browser Compatibility

The voice features require browser support for the Web Speech API:

| Browser | Speech Recognition | Speech Synthesis | Notes |
|---------|-------------------|------------------|-------|
| Chrome  | ✅ | ✅ | Best overall support |
| Edge    | ✅ | ✅ | Based on Chromium |
| Safari  | ✅ | ✅ | Requires user permission prompt |
| Firefox | ❌ | ✅ | No speech recognition support |
| Opera   | ✅ | ✅ | Based on Chromium |
| iOS Safari | ⚠️ | ✅ | Limited support, requires user interaction |
| Android Chrome | ✅ | ✅ | May have performance limitations |

## Fallback Mechanisms

For browsers or environments where speech features are not supported:

1. **Text-only Mode**: Voice buttons are disabled, text input/output remains available
2. **Feature Detection**: The application checks for browser support before enabling voice features
3. **Graceful Degradation**: Clear error messages guide users to supported browsers

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