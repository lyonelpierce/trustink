import { createClient } from '@supabase/supabase-js';
import { ConversationMessage } from './elevenlabs';

interface MessageRecord {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content_type: string;
  content_transcript: string;
  status: string;
  type: string;
  object: string;
  created_at: string;
}

export interface ConversationOptions {
  sessionId: string;
  onError?: (error: Error) => void;
}

export class ConversationManager {
  private sessionId: string;
  private messages: ConversationMessage[] = [];
  private onError?: (error: Error) => void;

  constructor(options: ConversationOptions) {
    this.sessionId = options.sessionId;
    this.onError = options.onError;
  }

  async persistMessage(message: ConversationMessage): Promise<void> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          session_id: this.sessionId,
          role: message.role,
          content_type: 'text',
          content_transcript: message.content,
          status: 'completed',
          type: 'message',
          object: 'realtime.item',
          created_at: new Date(message.timestamp).toISOString()
        });

      if (error) {
        throw error;
      }

      this.messages.push(message);
    } catch (error) {
      console.error('Error persisting message:', error);
      this.onError?.(new Error('Failed to persist message'));
    }
  }

  async getMessages(): Promise<ConversationMessage[]> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Convert database records to ConversationMessage format
      this.messages = (data as MessageRecord[]).map(record => ({
        id: record.id,
        role: record.role,
        content: record.content_transcript,
        timestamp: new Date(record.created_at).getTime()
      }));

      return this.messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      this.onError?.(new Error('Failed to fetch messages'));
      return [];
    }
  }

  async clearConversation(): Promise<void> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('session_id', this.sessionId);

      if (error) {
        throw error;
      }

      this.messages = [];
    } catch (error) {
      console.error('Error clearing conversation:', error);
      this.onError?.(new Error('Failed to clear conversation'));
    }
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  getLastMessage(): ConversationMessage | null {
    return this.messages[this.messages.length - 1] || null;
  }

  async searchMessages(query: string): Promise<ConversationMessage[]> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', this.sessionId)
        .ilike('content_transcript', `%${query}%`)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data as MessageRecord[]).map(record => ({
        id: record.id,
        role: record.role,
        content: record.content_transcript,
        timestamp: new Date(record.created_at).getTime()
      }));
    } catch (error) {
      console.error('Error searching messages:', error);
      this.onError?.(new Error('Failed to search messages'));
      return [];
    }
  }

  async exportConversation(): Promise<string> {
    try {
      const messages = await this.getMessages();
      
      const exportData = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString()
        }))
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      this.onError?.(new Error('Failed to export conversation'));
      return '';
    }
  }
} 