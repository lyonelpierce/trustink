'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useDocumentStore } from '@/store/zustand';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  className?: string;
}

/**
 * VoiceAssistant component provides voice-based interaction with documents
 * Users can speak to the assistant, type questions, and receive responses
 */
export function VoiceAssistant({ className }: VoiceAssistantProps) {
  // Local state for text input
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  
  // Document store for context
  const { currentDocument } = useDocumentStore();
  
  // Voice assistant hook
  const {
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
  } = useVoiceAssistant({
    onResult: (result) => {
      setInputText(result);
    },
    onError: (error) => {
      toast.error(`Voice recognition error: ${error}`);
    }
  });
  
  // Update messages when we get a new response
  useEffect(() => {
    if (lastResponse && !messages.some(m => m.role === 'assistant' && m.content === lastResponse)) {
      setMessages(prev => [...prev, { role: 'assistant', content: lastResponse }]);
    }
  }, [lastResponse, messages]);
  
  // Handle sending message from text input or voice
  const handleSendMessage = async () => {
    if (!inputText.trim() && !transcript.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    const messageText = inputText.trim() || transcript.trim();
    
    // Add to messages
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    
    // Send to AI
    await sendMessage(messageText);
    
    // Clear input and transcript
    setInputText('');
    resetTranscript();
  };
  
  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  // Toggle speaking
  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (lastResponse) {
      speak(lastResponse);
    }
  };
  
  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="text-lg font-semibold border-b">
        Document Assistant
        {currentDocument && (
          <div className="text-sm font-normal text-gray-500">
            Analyzing: {currentDocument.name}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow overflow-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <div className="mb-2 text-3xl">👋</div>
            <p>Ask me anything about this document. I can answer questions, analyze sections, or suggest improvements.</p>
            <p className="text-sm mt-2">Try asking:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>&quot;What are the key terms in this agreement?&quot;</li>
              <li>&quot;Explain the termination clause&quot;</li>
              <li>&quot;Identify any risky sections&quot;</li>
              <li>&quot;Suggest improvements for section 4&quot;</li>
            </ul>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary/10 ml-8' 
                  : 'bg-secondary/10 mr-8'
              }`}
            >
              <div className="font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div>{message.content}</div>
            </div>
          ))
        )}
        
        {isProcessing && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span>Processing your request...</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <div className="flex flex-col w-full space-y-2">
          <Textarea 
            value={inputText || transcript}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about this document..."
            className="resize-none"
            rows={3}
          />
          
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleListening}
                className={isListening ? 'text-red-500' : ''}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleSpeaking}
                disabled={!lastResponse}
                className={isSpeaking ? 'text-blue-500' : ''}
                title={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={isProcessing || (!inputText.trim() && !transcript.trim())}
              className="flex items-center"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 