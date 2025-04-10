import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleAuthenticate } from '@/app/api/authenticate/route';
import { mockAuth, createNextResponseMock } from '../lib/test-utils';

interface SignedInAuthObject {
  userId: string;
  sessionClaims: Record<string, any>;
  sessionId: string;
  sessionStatus: string;
  actor: any;
  orgId: string | null;
  orgRole: string | null;
  orgSlug: string | null;
  orgPermissions: string[];
  factorVerificationAge: number | null;
  getToken: jest.Mock;
  has: jest.Mock;
  debug: jest.Mock;
  redirectToSignIn: jest.Mock;
  redirectToSignUp: jest.Mock;
}

interface SignedOutAuthObject {
  userId: null;
  sessionClaims: Record<string, any>;
  sessionId: null;
  sessionStatus: 'expired';
  actor: null;
  orgId: null;
  orgRole: null;
  orgSlug: null;
  orgPermissions: [];
  factorVerificationAge: null;
  getToken: jest.Mock;
  has: jest.Mock;
  debug: jest.Mock;
  redirectToSignIn: jest.Mock;
  redirectToSignUp: jest.Mock;
}



// Create mock auth objects
const mockSignedInAuth: SignedInAuthObject = {
  userId: 'user-123',
  sessionClaims: {},
  sessionId: 'session-123',
  sessionStatus: 'active',
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  orgPermissions: [],
  factorVerificationAge: null,
  getToken: jest.fn(),
  has: jest.fn(),
  debug: jest.fn(),
  redirectToSignIn: jest.fn(),
  redirectToSignUp: jest.fn()
};

const mockSignedOutAuth: SignedOutAuthObject = {
  userId: null,
  sessionClaims: {},
  sessionId: null,
  sessionStatus: 'expired',
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  orgPermissions: [],
  factorVerificationAge: null,
  getToken: jest.fn(),
  has: jest.fn(),
  debug: jest.fn(),
  redirectToSignIn: jest.fn(),
  redirectToSignUp: jest.fn()
};

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth(mockSignedInAuth)
}));

describe('Deepgram Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DEEPGRAM_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.DEEPGRAM_API_KEY;
  });

  test('returns API key when authenticated', async () => {
    // Mock authenticated user
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSignedInAuth as any);

    const request = new NextRequest('http://localhost/api/authenticate');
    const response = await handleAuthenticate(request);
    
    expect(response).toEqual(
      createNextResponseMock(200, {
        key: process.env.DEEPGRAM_API_KEY
      })
    );
  });

  test('returns 401 when not authenticated', async () => {
    // Mock unauthenticated user
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSignedOutAuth as any);

    const request = new NextRequest('http://localhost/api/authenticate');
    const response = await handleAuthenticate(request);

    expect(response).toEqual(
      createNextResponseMock(401, {
        error: 'Unauthorized'
      })
    );
  });

  test('returns 500 when API key is not configured', async () => {
    // Remove API key from environment
    delete process.env.DEEPGRAM_API_KEY;

    // Mock authenticated user
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSignedInAuth as any);

    const request = new NextRequest('http://localhost/api/authenticate');
    const response = await handleAuthenticate(request);

    expect(response).toEqual(
      createNextResponseMock(500, {
        error: 'Deepgram API key not configured'
      })
    );
  });

  test('handles errors gracefully', async () => {
    // Mock auth throwing an error
    (auth as jest.MockedFunction<typeof auth>).mockRejectedValue(new Error('Auth failed'));

    const request = new NextRequest('http://localhost/api/authenticate');
    const response = await handleAuthenticate(request);

    expect(response).toEqual(
      createNextResponseMock(500, {
        error: 'Internal server error'
      })
    );
  });
}); 