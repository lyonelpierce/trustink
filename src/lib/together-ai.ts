import { ConversationMessage } from './elevenlabs';

export interface TogetherAIConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface DocumentContext {
  content: string;
  highlightedSection?: {
    id: string;
    content: string;
  };
  previousMessages: ConversationMessage[];
}

interface TogetherAIResponse {
  choices: Array<{
    text: string;
    index: number;
    logprobs: any;
    finish_reason: string;
  }>;
}

interface ActionRequest {
  type: 'highlight' | 'suggest_edit' | 'analyze_risk';
  sectionId?: string;
  content?: string;
}

const SYSTEM_PROMPT = `You are an expert document analysis assistant that helps users understand and improve legal contracts and documents. 
Your responses should be clear, professional, and focused on the document content provided.

When analyzing documents:
1. Reference specific sections when discussing the document
2. Highlight risky or important sections using the highlight action
3. Suggest improvements using the suggest_edit action
4. Provide risk analysis when requested

Special commands:
- When user says "highlight risks": Analyze document for risks and highlight risky sections
- When user says "suggest improvements": Provide specific edit suggestions for improvement
- When user says "explain this section": Focus on explaining the currently highlighted section

Always maintain context of the conversation and reference previous messages when relevant.`;

export class TogetherAIService {
  private config: TogetherAIConfig;
  private baseUrl = 'https://api.together.xyz/v1/chat/completions';

  constructor(config: TogetherAIConfig) {
    this.config = {
      maxTokens: 2000,
      temperature: 0.7,
      ...config
    };
  }

  private async makeRequest(prompt: string): Promise<TogetherAIResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private buildPrompt(query: string, context: DocumentContext): string {
    let prompt = 'Document Content:\n"""\n';
    prompt += context.content;
    prompt += '\n"""\n\n';

    if (context.highlightedSection) {
      prompt += `Currently highlighted section (${context.highlightedSection.id}):\n"""\n`;
      prompt += context.highlightedSection.content;
      prompt += '\n"""\n\n';
    }

    if (context.previousMessages.length > 0) {
      prompt += 'Previous conversation:\n';
      context.previousMessages.slice(-3).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add special command handling
    if (query.toLowerCase().includes('highlight risks')) {
      prompt += 'ACTION: Please analyze the document for risks and use the highlight action for risky sections.\n';
    } else if (query.toLowerCase().includes('suggest improvements')) {
      prompt += 'ACTION: Please provide specific suggestions for improving the document using the suggest_edit action.\n';
    } else if (query.toLowerCase().includes('explain this section') && context.highlightedSection) {
      prompt += 'ACTION: Please explain the currently highlighted section in detail.\n';
    }

    prompt += `\nUser: ${query}\nAssistant:`;
    return prompt;
  }

  private parseResponse(response: TogetherAIResponse): {
    message: string;
    actions: ActionRequest[];
  } {
    const text = response.choices[0].text.trim();
    const actions: ActionRequest[] = [];

    // Parse actions from response
    const actionMatches = text.match(/\[ACTION:.*?\]/g) || [];
    const messageWithoutActions = text.replace(/\[ACTION:.*?\]/g, '').trim();

    actionMatches.forEach(match => {
      const actionText = match.slice(8, -1).trim();
      if (actionText.startsWith('highlight')) {
        const sectionId = actionText.split(' ')[1];
        actions.push({ type: 'highlight', sectionId });
      } else if (actionText.startsWith('suggest_edit')) {
        const [_, sectionId, ...contentParts] = actionText.split(' ');
        actions.push({
          type: 'suggest_edit',
          sectionId,
          content: contentParts.join(' ')
        });
      } else if (actionText.startsWith('analyze_risk')) {
        const sectionId = actionText.split(' ')[1];
        actions.push({ type: 'analyze_risk', sectionId });
      }
    });

    return {
      message: messageWithoutActions,
      actions
    };
  }

  async processQuery(query: string, context: DocumentContext): Promise<{
    message: string;
    actions: ActionRequest[];
  }> {
    try {
      const prompt = this.buildPrompt(query, context);
      const response = await this.makeRequest(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error processing query with Together AI:', error);
      throw new Error('Failed to process query');
    }
  }
} 