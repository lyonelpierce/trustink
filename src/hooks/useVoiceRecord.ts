import { useState, useRef } from "react";

export const useRecordVoice = (onStop?: (audioBlob: Blob) => void) => {
  // State to hold the media recorder instance
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  // State to track whether recording is currently in progress
  const [recording, setRecording] = useState(false);

  // Ref to store audio chunks during recording
  const chunks = useRef<Blob[]>([]);

  // Ref to store the stream
  const streamRef = useRef<MediaStream | null>(null);

  // Function to start the recording
  const startRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorderInstance = new MediaRecorder(stream);

      mediaRecorderInstance.onstart = () => {
        chunks.current = [];
        setRecording(true);
      };

      mediaRecorderInstance.ondataavailable = (ev) => {
        chunks.current.push(ev.data);
      };

      mediaRecorderInstance.onstop = () => {
        setRecording(false);
        const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
        if (onStop) {
          onStop(audioBlob);
        }
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setMediaRecorder(null);
      };

      setMediaRecorder(mediaRecorderInstance);
      mediaRecorderInstance.start();
    } catch {
      setRecording(false);
      // Optionally handle error (e.g., mic denied)
    }
  };

  // Function to stop the recording
  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
    }
  };

  return { recording, startRecording, stopRecording };
};
