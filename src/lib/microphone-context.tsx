import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode
} from 'react';
import { toast } from 'sonner';

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: () => Promise<void>;
  microphoneState: MicrophoneState;
}

export enum MicrophoneEvents {
  DataAvailable = 'dataavailable',
  Error = 'error',
  Pause = 'pause',
  Resume = 'resume',
  Start = 'start',
  Stop = 'stop'
}

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(undefined);

interface MicrophoneContextProviderProps {
  children: ReactNode;
}

/**
 * Provider component for microphone access and recording functionality
 */
export const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);

  /**
   * Set up microphone access and create MediaRecorder instance
   */
  const setupMicrophone = useCallback(async () => {
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true
        }
      });

      const microphone = new MediaRecorder(userMedia);

      // Add event listeners
      microphone.addEventListener(MicrophoneEvents.Error, (event) => {
        console.error('Microphone error:', event);
        setMicrophoneState(MicrophoneState.Error);
        toast.error('Microphone error occurred');
      });

      microphone.addEventListener(MicrophoneEvents.Start, () => {
        setMicrophoneState(MicrophoneState.Open);
      });

      microphone.addEventListener(MicrophoneEvents.Stop, () => {
        setMicrophoneState(MicrophoneState.Ready);
      });

      microphone.addEventListener(MicrophoneEvents.Pause, () => {
        setMicrophoneState(MicrophoneState.Paused);
      });

      microphone.addEventListener(MicrophoneEvents.Resume, () => {
        setMicrophoneState(MicrophoneState.Open);
      });

      setMicrophoneState(MicrophoneState.Ready);
      setMicrophone(microphone);
    } catch (error) {
      console.error('Error setting up microphone:', error);
      setMicrophoneState(MicrophoneState.Error);
      throw error;
    }
  }, []);

  /**
   * Stop microphone recording
   */
  const stopMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Pausing);

    if (microphone?.state === 'recording') {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  /**
   * Start microphone recording
   */
  const startMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Opening);

    if (microphone?.state === 'paused') {
      microphone.resume();
    } else {
      microphone?.start(250); // Send data every 250ms
    }

    setMicrophoneState(MicrophoneState.Open);
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

/**
 * Hook to use microphone functionality
 */
export function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);
  if (context === undefined) {
    throw new Error('useMicrophone must be used within a MicrophoneContextProvider');
  }
  return context;
} 