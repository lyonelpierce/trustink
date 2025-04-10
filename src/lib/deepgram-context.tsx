import {
  createContext,
  useContext,
  useState,
  ReactNode,
  FunctionComponent
} from 'react';
import {
  createClient,
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvents,
  type LiveSchema,
  type LiveTranscriptionEvent
} from '@deepgram/sdk';
import { toast } from 'sonner';

interface DeepgramContextType {
  connection: LiveClient | null;
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: LiveConnectionState;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

/**
 * Get Deepgram API key from our authentication endpoint
 */
const getApiKey = async (): Promise<string> => {
  const response = await fetch('/api/authenticate', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to get Deepgram API key');
  }
  const result = await response.json();
  return result.key;
};

/**
 * Provider component for Deepgram speech recognition functionality
 */
export const DeepgramContextProvider: FunctionComponent<DeepgramContextProviderProps> = ({
  children
}) => {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(
    LiveConnectionState.CLOSED
  );

  /**
   * Connect to Deepgram and set up a live transcription session
   */
  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    try {
      const key = await getApiKey();
      const deepgram = createClient(key);

      const conn = deepgram.listen.live(options, endpoint);

      conn.addListener(LiveTranscriptionEvents.Open, () => {
        setConnectionState(LiveConnectionState.OPEN);
        console.log('Connected to Deepgram');
      });

      conn.addListener(LiveTranscriptionEvents.Close, () => {
        setConnectionState(LiveConnectionState.CLOSED);
        console.log('Disconnected from Deepgram');
      });

      conn.addListener(LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
        toast.error('Speech recognition error');
      });

      setConnection(conn);
    } catch (error) {
      console.error('Failed to connect to Deepgram:', error);
      toast.error('Failed to connect to speech service');
      throw error;
    }
  };

  /**
   * Disconnect from Deepgram
   */
  const disconnectFromDeepgram = () => {
    if (connection) {
      connection.finish();
      setConnection(null);
      setConnectionState(LiveConnectionState.CLOSED);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

/**
 * Hook to use Deepgram functionality
 */
export function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error('useDeepgram must be used within a DeepgramContextProvider');
  }
  return context;
}

// Re-export types and enums from Deepgram SDK
export { LiveConnectionState, LiveTranscriptionEvents, type LiveTranscriptionEvent }; 