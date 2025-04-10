import { TogetherAIService, DocumentContext } from '@/lib/together-ai';

// Mock fetch
global.fetch = jest.fn();

describe('TogetherAIService', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    model: 'test-model'
  };

  const mockContext: DocumentContext = {
    content: 'Test document content',
    highlightedSection: {
      id: 'section-1',
      content: 'Highlighted section content'
    },
    previousMessages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Previous question',
        timestamp: Date.now()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Previous answer',
        timestamp: Date.now()
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          text: 'Test response [ACTION: highlight section-1] More text [ACTION: suggest_edit section-2 Improved text]',
          index: 0,
          logprobs: null,
          finish_reason: 'stop'
        }]
      })
    });
  });

  test('initializes with correct configuration', () => {
    const service = new TogetherAIService(mockConfig);
    expect(service).toBeInstanceOf(TogetherAIService);
  });

  test('makes API request with correct parameters', async () => {
    const service = new TogetherAIService(mockConfig);
    await service.processQuery('Test query', mockContext);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.together.xyz/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: expect.any(String)
      })
    );

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody).toMatchObject({
      model: mockConfig.model,
      messages: expect.arrayContaining([
        { role: 'system', content: expect.any(String) },
        { role: 'user', content: expect.stringContaining('Test query') }
      ])
    });
  });

  test('processes special command "highlight risks"', async () => {
    const service = new TogetherAIService(mockConfig);
    await service.processQuery('highlight risks', mockContext);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('ACTION: Please analyze the document for risks');
  });

  test('processes special command "suggest improvements"', async () => {
    const service = new TogetherAIService(mockConfig);
    await service.processQuery('suggest improvements', mockContext);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('ACTION: Please provide specific suggestions');
  });

  test('processes special command "explain this section"', async () => {
    const service = new TogetherAIService(mockConfig);
    await service.processQuery('explain this section', mockContext);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.messages[1].content).toContain('ACTION: Please explain the currently highlighted section');
  });

  test('parses response with actions correctly', async () => {
    const service = new TogetherAIService(mockConfig);
    const result = await service.processQuery('Test query', mockContext);

    expect(result).toEqual({
      message: 'Test response More text',
      actions: [
        { type: 'highlight', sectionId: 'section-1' },
        { type: 'suggest_edit', sectionId: 'section-2', content: 'Improved text' }
      ]
    });
  });

  test('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Service unavailable'
    });

    const service = new TogetherAIService(mockConfig);
    await expect(service.processQuery('Test query', mockContext))
      .rejects
      .toThrow('Together AI API error: Service unavailable');
  });

  test('includes document context in prompt', async () => {
    const service = new TogetherAIService(mockConfig);
    await service.processQuery('Test query', mockContext);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const prompt = requestBody.messages[1].content;

    expect(prompt).toContain(mockContext.content);
    expect(prompt).toContain(mockContext.highlightedSection?.content);
    expect(prompt).toContain('Previous question');
    expect(prompt).toContain('Previous answer');
  });

  test('handles missing highlighted section gracefully', async () => {
    const contextWithoutHighlight = {
      ...mockContext,
      highlightedSection: undefined
    };

    const service = new TogetherAIService(mockConfig);
    await service.processQuery('Test query', contextWithoutHighlight);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const prompt = requestBody.messages[1].content;

    expect(prompt).not.toContain('Currently highlighted section');
  });

  test('handles empty previous messages gracefully', async () => {
    const contextWithoutMessages = {
      ...mockContext,
      previousMessages: []
    };

    const service = new TogetherAIService(mockConfig);
    await service.processQuery('Test query', contextWithoutMessages);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const prompt = requestBody.messages[1].content;

    expect(prompt).not.toContain('Previous conversation');
  });
}); 