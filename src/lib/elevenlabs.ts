import { toast } from 'sonner';

export interface ElevenLabsConfig {
  agentId: string;
  apiKey: string;
}

export interface ConversationOptions {
  documentContext?: {
    id: string;
    content: string;
    highlightedSection?: string;
  };
  onMessage?: (message: ConversationMessage) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: ConversationState) => void;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type ConversationState = 'connecting' | 'connected' | 'disconnected' | 'error';

export class ElevenLabsClient {
  private config: ElevenLabsConfig;
  private signedUrl: string | null = null;
  private websocket: WebSocket | null = null;
  private messageQueue: ConversationMessage[] = [];
  private options: ConversationOptions = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/api/i', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to initialize ElevenLabs client');
      }

      const data = await response.json();
      this.signedUrl = data.apiKey;
    } catch (error) {
      console.error('ElevenLabs initialization error:', error);
      throw new Error('Failed to initialize ElevenLabs client');
    }
  }

  async startConversation(options: ConversationOptions): Promise<void> {
    if (!this.signedUrl) {
      throw new Error('Client not initialized');
    }

    this.options = options;
    await this.connectWebSocket();
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.updateState('connecting');
      
      this.websocket = new WebSocket(this.signedUrl!);
      
      this.websocket.onopen = () => {
        this.updateState('connected');
        this.reconnectAttempts = 0;
        
        // Send document context if available
        if (this.options.documentContext) {
          this.sendDocumentContext(this.options.documentContext);
        }
      };

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.options.onError?.(new Error('Failed to parse message'));
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.handleConnectionError();
      };

      this.websocket.onclose = () => {
        this.updateState('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError();
    }
  }

  private handleMessage(message: any): void {
    const conversationMessage: ConversationMessage = {
      id: message.id || crypto.randomUUID(),
      role: message.role,
      content: message.content[0]?.transcript || '',
      timestamp: Date.now()
    };

    this.messageQueue.push(conversationMessage);
    this.options.onMessage?.(conversationMessage);

    // Persist message to database
    this.persistMessage(conversationMessage);
  }

  private async persistMessage(message: ConversationMessage): Promise<void> {
    try {
      await fetch('/api/c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: message.id,
          item: {
            id: message.id,
            role: message.role,
            content: [{ type: 'text', transcript: message.content }],
            status: 'completed',
            type: 'message'
          }
        })
      });
    } catch (error) {
      console.error('Error persisting message:', error);
      // Don't throw here to avoid interrupting the conversation
    }
  }

  private sendDocumentContext(context: ConversationOptions['documentContext']): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.websocket.send(JSON.stringify({
      type: 'context',
      data: context
    }));
  }

  private handleConnectionError(): void {
    this.updateState('error');
    this.options.onError?.(new Error('Connection error'));
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Failed to connect to voice service. Please try again later.');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.connectWebSocket();
    }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000));
  }

  private updateState(state: ConversationState): void {
    this.options.onStateChange?.(state);
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to voice service');
    }

    const message: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    this.websocket.send(JSON.stringify({
      type: 'message',
      data: message
    }));

    this.messageQueue.push(message);
    this.options.onMessage?.(message);
    await this.persistMessage(message);
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.updateState('disconnected');
  }
} 