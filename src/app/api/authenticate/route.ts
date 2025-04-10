import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleError } from '@/lib/error-handler';

/**
 * API route to authenticate and provide Deepgram API key
 * This endpoint is used by the voice assistant to obtain credentials for speech recognition
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if API key is configured
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Return API key
    return NextResponse.json({ key: apiKey });
  } catch (error) {
    return handleError(error, {
      customMessage: 'Internal server error',
      context: { location: 'authenticate' }
    });
  }
}

// For testing purposes
export const handleAuthenticate = GET; 