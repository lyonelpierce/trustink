import {
  XIcon,
  MicIcon,
  AudioWaveformIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useRecordVoice } from "@/hooks/useVoiceRecord";

const VoiceAgent = () => {
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    recording: isRecording,
    startRecording,
    stopRecording,
  } = useRecordVoice(async (audioBlob) => {
    setLoading(true);
    setError(null);
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );
      // Send to API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUBDOMAIN_URL}/api/stt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64Audio }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await res.json();
      setInput(data.text || "");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  });

  // --- Waveform visualization state ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // --- Start waveform visualization ---
  const startWaveform = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      drawWaveform();
    } catch {
      // fallback: stop recording if mic access denied
      stopRecording();
      alert("Microphone access denied or unavailable for waveform.");
    }
  };

  // --- Stop waveform visualization and cleanup ---
  const stopWaveform = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    sourceRef.current = null;
  };

  // --- Draw waveform on canvas ---
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!canvas || !analyser || !dataArray) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    analyser.getByteTimeDomainData(dataArray);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2563eb"; // blue-600
    ctx.beginPath();
    const sliceWidth = (WIDTH * 1.0) / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * HEIGHT) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.lineTo(WIDTH, HEIGHT / 2);
    ctx.stroke();
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start/stop waveform visualization based on recording state
  useEffect(() => {
    if (isRecording) {
      setRecording(true);
      startWaveform();
    } else {
      setRecording(false);
      stopWaveform();
    }
    return () => {
      stopWaveform();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleMicClick = () => {
    setInput("");
    setError(null);
    startRecording();
  };

  const handleCancel = () => {
    stopRecording();
    setInput("");
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="fixed pt-14 right-0 top-0 border-l h-screen bg-white min-w-lg flex flex-col justify-between">
      <div className="border-b p-4">
        <p>AI Assistant</p>
      </div>
      <div className="p-4">
        <div className="p-4 bg-gray-50 rounded-lg border">
          {/* Waveform visualization */}
          {recording && (
            <canvas
              ref={canvasRef}
              width={400}
              height={60}
              className="w-full h-16 mb-2 bg-white border rounded"
            />
          )}
          <Textarea
            className={`rounded-none resize-none bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${recording ? "border-blue-500" : ""}`}
            placeholder="Ask me anything..."
            value={input}
            onChange={handleInputChange}
            readOnly={recording || loading}
          />
          {loading && (
            <div className="text-blue-500 text-sm mt-2">Transcribing...</div>
          )}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="flex flex-row gap-2">
            <Button variant="outline">Analyze</Button>
            {recording ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCancel}
                  title="Cancel recording"
                >
                  <XIcon className="text-red-500" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleMicClick}
                  title="Start recording"
                >
                  <MicIcon />
                </Button>
                <Button variant="outline" size="icon">
                  <AudioWaveformIcon />
                </Button>
                <Button variant="default" className="ml-auto">
                  Send
                  <SendHorizontalIcon />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;
