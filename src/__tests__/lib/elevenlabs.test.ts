import { ElevenLabsClient, ConversationMessage } from '@/lib/elevenlabs';

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState = 0; // WebSocket.CONNECTING

  constructor(url: string) {
    setTimeout(() => {
      this.readyState = 1; // WebSocket.OPEN
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send = jest.fn();
  close = jest.fn();
}

(global as any).WebSocket = MockWebSocket;

describe('ElevenLabsClient', () => {
  const mockConfig = {
    agentId: 'test-agent-id',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ apiKey: 'test-signed-url' })
    });
  });

  test('initializes successfully', async () => {
    const client = new ElevenLabsClient(mockConfig);
    await client.initialize();

    expect(global.fetch).toHaveBeenCalledWith('/api/i', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  });

  test('handles initialization error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Service unavailable'
    });

    const client = new ElevenLabsClient(mockConfig);
    await expect(client.initialize()).rejects.toThrow('Failed to initialize ElevenLabs client');
  });

  test('starts conversation with document context', async () => {
    const client = new ElevenLabsClient(mockConfig);
    await client.initialize();

    const mockContext = {
      id: 'doc-123',
      content: 'test content',
      highlightedSection: 'section-1'
    };

    const onMessage = jest.fn();
    const onError = jest.fn();
    const onStateChange = jest.fn();

    await client.startConversation({
      documentContext: mockContext,
      onMessage,
      onError,
      onStateChange
    });

    // Verify WebSocket was initialized
    expect(onStateChange).toHaveBeenCalledWith('connected');
  });

  test('sends and receives messages', async () => {
    const client = new ElevenLabsClient(mockConfig);
    await client.initialize();

    const onMessage = jest.fn();
    await client.startConversation({ onMessage });

    // Simulate sending a message
    await client.sendMessage('Hello');

    // Simulate receiving a response
    const mockWebSocket = (global as any).WebSocket.mock.instances[0];
    mockWebSocket.onmessage?.({
      data: JSON.stringify({
        id: 'msg-123',
        role: 'assistant',
        content: [{ type: 'text', transcript: 'Hello! How can I help?' }]
      })
    });

    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({
      role: 'assistant',
      content: 'Hello! How can I help?'
    }));
  });

  test('handles connection errors', async () => {
    const client = new ElevenLabsClient(mockConfig);
    await client.initialize();

    const onError = jest.fn();
    const onStateChange = jest.fn();

    await client.startConversation({
      onError,
      onStateChange
    });

    // Simulate WebSocket error
    const mockWebSocket = (global as any).WebSocket.mock.instances[0];
    mockWebSocket.onerror?.(new Event('error'));

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onStateChange).toHaveBeenCalledWith('error');
  });

  test('attempts reconnection on disconnect', async () => {
    const client = new ElevenLabsClient(mockConfig);
    await client.initialize();

    const onStateChange = jest.fn();

    await client.startConversation({
      onStateChange
    });

    // Simulate WebSocket close
    const mockWebSocket = (global as any).WebSocket.mock.instances[0];
    mockWebSocket.onclose?.(new CloseEvent('close'));

    expect(onStateChange).toHaveBeenCalledWith('disconnected');
    // Should attempt to reconnect
    expect(global.setTimeout).toHaveBeenCalled();
  });

  test('disconnects cleanly', async () => {
    const client = new ElevenLabsClient(mockConfig);
    await client.initialize();

    const onStateChange = jest.fn();

    await client.startConversation({
      onStateChange
    });

    client.disconnect();

    const mockWebSocket = (global as any).WebSocket.mock.instances[0];
    expect(mockWebSocket.close).toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith('disconnected');
  });
}); 