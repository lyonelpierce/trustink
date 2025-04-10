import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { MicrophoneContextProvider, useMicrophone, MicrophoneState, MicrophoneEvents } from '@/lib/microphone-context';
import { toast } from 'sonner';
import { createMediaRecorderMock } from './test-utils';

// Mock dependencies
jest.mock('sonner');

describe('MicrophoneContext', () => {
  // Mock MediaRecorder and getUserMedia
  const mockMediaRecorder = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    state: 'inactive'
  };

  const mockMediaStream = {
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
      },
      writable: true
    });

    // Mock MediaRecorder constructor with isTypeSupported
    const { MediaRecorderMock } = createMediaRecorderMock();
    global.MediaRecorder = MediaRecorderMock;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
  );

  test('initializes with NotSetup state', () => {
    const { result } = renderHook(() => useMicrophone(), { wrapper });

    expect(result.current.microphoneState).toBe(MicrophoneState.NotSetup);
    expect(result.current.microphone).toBeNull();
  });

  test('sets up microphone successfully', async () => {
    const { result } = renderHook(() => useMicrophone(), { wrapper });

    await act(async () => {
      await result.current.setupMicrophone();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        noiseSuppression: true,
        echoCancellation: true
      }
    });
    expect(result.current.microphoneState).toBe(MicrophoneState.Ready);
    expect(result.current.microphone).not.toBeNull();
  });

  test('handles microphone setup errors', async () => {
    // Mock getUserMedia failure
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
      new Error('Permission denied')
    );

    const { result } = renderHook(() => useMicrophone(), { wrapper });

    await act(async () => {
      try {
        await result.current.setupMicrophone();
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.microphoneState).toBe(MicrophoneState.Error);
    expect(result.current.microphone).toBeNull();
  });

  test('starts recording when microphone is ready', async () => {
    const { result } = renderHook(() => useMicrophone(), { wrapper });

    // Setup microphone first
    await act(async () => {
      await result.current.setupMicrophone();
    });

    // Start recording
    act(() => {
      result.current.startMicrophone();
    });

    expect(mockMediaRecorder.start).toHaveBeenCalledWith(250);
    expect(result.current.microphoneState).toBe(MicrophoneState.Open);
  });

  test('stops recording when requested', async () => {
    const { result } = renderHook(() => useMicrophone(), { wrapper });

    // Setup and start microphone
    await act(async () => {
      await result.current.setupMicrophone();
      result.current.startMicrophone();
    });

    // Mock recording state
    mockMediaRecorder.state = 'recording';

    // Stop recording
    act(() => {
      result.current.stopMicrophone();
    });

    expect(mockMediaRecorder.pause).toHaveBeenCalled();
    expect(result.current.microphoneState).toBe(MicrophoneState.Paused);
  });

  test('handles microphone events correctly', async () => {
    const { result } = renderHook(() => useMicrophone(), { wrapper });

    await act(async () => {
      await result.current.setupMicrophone();
    });

    // Get event handlers
    const errorHandler = mockMediaRecorder.addEventListener.mock.calls.find(
      call => call[0] === MicrophoneEvents.Error
    )[1];
    const startHandler = mockMediaRecorder.addEventListener.mock.calls.find(
      call => call[0] === MicrophoneEvents.Start
    )[1];
    const stopHandler = mockMediaRecorder.addEventListener.mock.calls.find(
      call => call[0] === MicrophoneEvents.Stop
    )[1];

    // Simulate events
    act(() => {
      startHandler();
    });
    expect(result.current.microphoneState).toBe(MicrophoneState.Open);

    act(() => {
      stopHandler();
    });
    expect(result.current.microphoneState).toBe(MicrophoneState.Ready);

    act(() => {
      errorHandler(new Error('Test error'));
    });
    expect(result.current.microphoneState).toBe(MicrophoneState.Error);
    expect(toast.error).toHaveBeenCalledWith('Microphone error occurred');
  });

  test('throws error when used outside provider', () => {
    const { result } = renderHook(() => useMicrophone());
    
    // Verify that accessing result.current throws the expected error
    expect(() => {
      console.log(result.current);
    }).toThrow('useMicrophone must be used within a MicrophoneContextProvider');
  });

  test('resumes recording from paused state', async () => {
    const { result } = renderHook(() => useMicrophone(), { wrapper });

    await act(async () => {
      await result.current.setupMicrophone();
    });

    // Mock paused state
    mockMediaRecorder.state = 'paused';

    act(() => {
      result.current.startMicrophone();
    });

    expect(mockMediaRecorder.resume).toHaveBeenCalled();
    expect(result.current.microphoneState).toBe(MicrophoneState.Open);
  });
}); 