# Voice Assistant Testing Strategy

This document outlines the testing approach for TrustInk's voice assistant features, focusing on both the current Web Speech API implementation and the planned ElevenLabs integration.

## Testing Objectives

1. **Functional Testing**: Verify all voice assistant features work as expected
2. **Reliability Testing**: Ensure consistent performance across sessions
3. **Cross-browser Testing**: Validate support across target browsers
4. **Error Recovery**: Test graceful handling of failures
5. **Integration Testing**: Verify voice features work with document context

## Current Test Coverage

### Web Speech API Implementation

The current `useVoiceAssistant` hook has partial test coverage:

- ✅ Basic initialization tests
- ✅ Listening state management
- ✅ Speech recognition results handling
- ✅ Text-to-Speech functionality
- ✅ Error handling for unsupported browsers
- ❌ Complete end-to-end tests with document context

### Known Test Issues

We have identified several issues in the current test suite:

1. **Web Speech API Mocking**:
   - TypeScript interface conflicts between mock and browser definitions
   - Inconsistent behavior in Jest test environment

2. **Integration with Zustand Store**:
   - Type casting issues when mocking the document store
   - Difficulty testing document highlight interactions

3. **API Endpoint Testing**:
   - Limited coverage for document analysis endpoints
   - No tests for ElevenLabs API routes (`/api/i` and `/api/c`)

## Testing Approach for ElevenLabs Integration

### 1. Unit Testing for ElevenLabs Components

#### API Route Tests

```typescript
// Test for /api/i route
describe('ElevenLabs Integration API', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.AGENT_ID = 'test-agent-id';
    process.env.XI_API_KEY = 'test-api-key';
    
    // Mock fetch for ElevenLabs API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ signed_url: 'https://test-signed-url.com' })
    });
  });
  
  it('returns a signed URL when given valid credentials', async () => {
    const request = new Request('https://trustink.com/api/i', {
      method: 'POST'
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(data).toHaveProperty('apiKey');
    expect(data.apiKey).toBe('https://test-signed-url.com');
  });
  
  it('handles missing environment variables', async () => {
    // Remove environment variables
    delete process.env.AGENT_ID;
    
    const request = new Request('https://trustink.com/api/i', {
      method: 'POST'
    });
    
    await expect(POST(request)).rejects.toThrow('AGENT_ID is not set or received.');
  });
  
  it('handles ElevenLabs API errors', async () => {
    // Mock fetch failure
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Service unavailable'
    });
    
    const request = new Request('https://trustink.com/api/i', {
      method: 'POST'
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Service unavailable');
  });
});
```

#### Message Storage Tests

```typescript
// Test for /api/c route
describe('Conversation API', () => {
  let mockSupabaseClient;
  
  beforeEach(() => {
    // Mock Supabase client
    mockSupabaseClient = {
      // Mock implementations for getMessageCount, insertMessage, etc.
    };
    
    jest.mock('@/lib/supabaseAdmin', () => ({
      createClient: jest.fn().mockResolvedValue(mockSupabaseClient)
    }));
  });
  
  it('stores a new message correctly', async () => {
    const request = new Request('https://trustink.com/api/c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-session-id',
        item: {
          id: 'message-1',
          role: 'user',
          status: 'completed',
          object: 'test-object',
          type: 'message',
          content: [{ type: 'text', transcript: 'Test message' }]
        }
      })
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(mockSupabaseClient.getMessageCount).toHaveBeenCalledWith(
      mockSupabaseClient,
      'test-session-id'
    );
    expect(mockSupabaseClient.insertMessage).toHaveBeenCalled();
  });
  
  it('retrieves conversation messages correctly', async () => {
    const mockMessages = [
      {
        id: 'message-1',
        session_id: 'test-session-id',
        role: 'user',
        content_transcript: 'Test question'
      },
      {
        id: 'message-2',
        session_id: 'test-session-id',
        role: 'assistant',
        content_transcript: 'Test response'
      }
    ];
    
    mockSupabaseClient.getSessionMessages.mockResolvedValue({
      data: mockMessages,
      error: null
    });
    
    const request = new Request('https://trustink.com/api/c?id=test-session-id', {
      method: 'GET'
    });
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual(mockMessages);
  });
});
```

### 2. Mock ElevenLabs Conversation Hook

We'll create a comprehensive mock of the ElevenLabs conversation hook for testing:

```typescript
// Mock for @11labs/react
jest.mock('@11labs/react', () => ({
  useConversation: jest.fn().mockImplementation((options) => {
    const { onError, onConnect, onMessage } = options;
    
    // Mock state
    const [status, setStatus] = useState('disconnected');
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Mock methods
    const startSession = jest.fn().mockImplementation(async ({ signedUrl }) => {
      if (!signedUrl) {
        onError?.('Invalid signed URL');
        return;
      }
      
      setStatus('connected');
      onConnect?.();
      return true;
    });
    
    const endSession = jest.fn().mockImplementation(async () => {
      setStatus('disconnected');
      return true;
    });
    
    const simulateUserMessage = (message) => {
      onMessage?.({ message, source: 'user' });
    };
    
    const simulateAIResponse = (message) => {
      setIsSpeaking(true);
      onMessage?.({ message, source: 'ai' });
      setTimeout(() => setIsSpeaking(false), 100);
    };
    
    return {
      status,
      isSpeaking,
      startSession,
      endSession,
      // Testing helpers (not in actual hook)
      _simulateUserMessage: simulateUserMessage,
      _simulateAIResponse: simulateAIResponse
    };
  })
}));
```

### 3. Integration Tests for Document Context

```typescript
// Test for voice assistant with document context
describe('Voice Assistant with Document Context', () => {
  beforeEach(() => {
    // Mock document store
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'Test Contract.pdf',
        sections: [
          { id: 'section-1', text: 'This is section 1 content' },
          { id: 'section-2', text: 'This is section 2 content' }
        ]
      },
      highlightedSection: null,
      setHighlightedSection: jest.fn()
    });
  });
  
  it('sends document context to ElevenLabs', async () => {
    // Setup conversation component with mocked ElevenLabs hook
    const { result } = renderHook(() => {
      const conversation = useConversation({
        onMessage: jest.fn()
      });
      
      return {
        conversation,
        // Use your component/hook functions here
      };
    });
    
    // Test that document sections are sent as context
    await act(async () => {
      await result.current.startConversation();
      // Verify document context is included
    });
  });
  
  it('highlights relevant sections based on AI response', async () => {
    // Setup conversation component with mocked ElevenLabs hook
    const mockSetHighlightedSection = jest.fn();
    
    (useDocumentStore as unknown as jest.Mock).mockReturnValue({
      currentDocument: {
        id: 'doc-123',
        name: 'Test Contract.pdf',
        sections: [
          { id: 'section-1', text: 'This is section 1 content' },
          { id: 'section-2', text: 'This is section 2 content' }
        ]
      },
      highlightedSection: null,
      setHighlightedSection: mockSetHighlightedSection
    });
    
    const { result } = renderHook(() => {
      const conversation = useConversation({
        onMessage: jest.fn()
      });
      
      return {
        conversation,
        // Use your component/hook functions here
      };
    });
    
    // Simulate AI response that mentions section 1
    await act(async () => {
      result.current.conversation._simulateAIResponse(
        'According to section 1, the contract states...'
      );
    });
    
    // Verify that section 1 got highlighted
    expect(mockSetHighlightedSection).toHaveBeenCalledWith('section-1');
  });
});
```

### 4. End-to-End Tests

For complete end-to-end tests, we'll use Playwright or Cypress to test real browser interactions:

```typescript
// Example Playwright test
test('Voice assistant with document analysis', async ({ page }) => {
  // Login and navigate to document view
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Go to document page
  await page.goto('/documents/doc-123');
  
  // Wait for document to load
  await page.waitForSelector('.document-section');
  
  // Mock ElevenLabs websocket connection
  await page.evaluate(() => {
    window.mockElevenLabsConnection = true;
  });
  
  // Click voice assistant button
  await page.click('[data-testid="voice-assistant-button"]');
  
  // Verify microphone active indication
  await expect(page.locator('[data-testid="microphone-active"]')).toBeVisible();
  
  // Simulate speech recognition result
  await page.evaluate(() => {
    window.dispatchSpeechRecognitionResult('What are the key risks in section 2?');
  });
  
  // Verify that section 2 gets highlighted
  await expect(page.locator('[data-section-id="section-2"].highlighted')).toBeVisible();
  
  // Verify AI response is displayed and spoken
  await expect(page.locator('[data-testid="ai-response"]')).toContainText('risk');
});
```

## Test Reporting and Metrics

For effective test monitoring, we'll implement:

1. **Test Coverage Reports**:
   - Line coverage for hook and component functions
   - Branch coverage for conditional logic
   - Function coverage for all API endpoints

2. **Integration Test Status Board**:
   - Status of all voice assistant features
   - Cross-browser compatibility matrix
   - Accessibility test results

3. **Performance Metrics**:
   - Response time measurements
   - Speech recognition accuracy
   - TTS quality assessment

## Continuous Testing Strategy

To maintain test quality as we transition to ElevenLabs:

1. **Parallel Testing**:
   - Maintain tests for Web Speech API implementation
   - Build new tests for ElevenLabs integration
   - Run both suites during transition period

2. **Feature Flags**:
   - Test both implementations via feature flags
   - Gradually increase ElevenLabs test coverage
   - Monitor error rates for both implementations

3. **A/B Test Monitoring**:
   - Compare user experience metrics between implementations
   - Track voice recognition accuracy differences
   - Measure user satisfaction and feature adoption

## Testing Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| Mocking WebSocket connections | Use custom WebSocket mock that simulates ElevenLabs responses |
| Testing audio playback | Implement audio context spy to verify audio is processed |
| Simulating voice input | Create custom voice input simulator for automated testing |
| Testing error recovery | Force network failures and verify graceful degradation |
| Browser-specific behavior | Maintain browser-specific test configurations and expected outcomes |

## Next Steps in Test Development

1. **Short-term (1-2 weeks)**:
   - Fix current test failures in `useVoiceAssistant.test.tsx`
   - Implement basic API route tests for `/api/i` and `/api/c`
   - Create mock implementation for `@11labs/react` library

2. **Medium-term (2-4 weeks)**:
   - Develop integration tests for ElevenLabs components
   - Build document context testing framework
   - Implement cross-browser test suite

3. **Long-term (1-2 months)**:
   - Develop end-to-end test suite with Playwright/Cypress
   - Implement automated accessibility testing for voice features
   - Create performance testing benchmarks 