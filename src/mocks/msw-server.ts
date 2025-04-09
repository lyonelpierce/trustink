import { setupServer } from 'msw/node';
import { handlers } from '../__tests__/mocks/handlers';

// Set up the mock server with our handlers
export const server = setupServer(...handlers);

// Start the server before tests and reset after each test
export const startMSWServer = () => {
  // Start the server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  
  // Reset handlers between each test
  afterEach(() => server.resetHandlers());
  
  // Clean up after all tests are done
  afterAll(() => server.close());
}; 