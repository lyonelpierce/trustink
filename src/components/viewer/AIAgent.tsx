import {
  XIcon,
  MicIcon,
  AudioWaveformIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { ScrollArea } from "../ui/scroll-area";
import { useState, useRef, useEffect } from "react";
import { useRecordVoice } from "@/hooks/useVoiceRecord";
import { Skeleton } from "../ui/skeleton";
import { Database } from "../../../database.types";
import { useOptimistic, startTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import useWebRTCAudioSession from "@/hooks/use-webrtc";
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

const initialAssistantMessage = {
  role: "assistant" as const,
  content: "Hello! I am your AI assistant. How can I help you?",
};

const AIAgent = ({
  documentId,
  chatMessages = [],
}: {
  documentId: string;
  chatMessages?: ChatMessage[];
}) => {
  const { handleStartStopClick } = useWebRTCAudioSession("alloy");

  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >(() => {
    const mapped = [...chatMessages]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    if (mapped.length === 0) return [initialAssistantMessage];
    // If the first message is not the initial assistant message, prepend it
    if (
      mapped[0].role !== initialAssistantMessage.role ||
      mapped[0].content !== initialAssistantMessage.content
    ) {
      return [initialAssistantMessage, ...mapped];
    }
    return mapped;
  });
  const [aiResponse, setAiResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiResponse]);

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

  const [optimisticInput, setOptimisticInput] = useOptimistic<string>("");
  // Overlay state
  const [showOverlay, setShowOverlay] = useState(false);
  const [circleActive, setCircleActive] = useState(false);
  // Delay showing overlay content until animation finishes
  const [showOverlayContent, setShowOverlayContent] = useState(false);

  // Handle overlay open with animation
  const handleShowOverlay = () => {
    handleStartStopClick();
    setShowOverlay(true);
    // Allow next tick for CSS transition
    setTimeout(() => setCircleActive(true), 10);
    // Show content after animation duration (300ms)
    setTimeout(() => setShowOverlayContent(true), 310);
  };

  // Handle overlay close and reset animation
  const handleCloseOverlay = () => {
    setCircleActive(false);
    setShowOverlayContent(false);
    setTimeout(() => setShowOverlay(false), 300); // match animation duration
  };

  // Send input to /api/chat and stream response
  const sendToChatAPI = async (message: string) => {
    setLoading(true);
    setError(null);
    setAiResponse("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
          documentId,
        }),
      });

      if (!response.body) {
        throw new Error("No response from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value);
        setAiResponse(aiText);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
      setAiResponse("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      startTransition(() => setOptimisticInput(message));
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  useEffect(() => {
    // Create Supabase client
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to chat_messages changes for this document
    const channel = client
      .channel("chat-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [
            ...prev,
            {
              role: newMsg.role as "user" | "assistant",
              content: newMsg.content,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [documentId]);

  return (
    <div className="fixed pt-14 right-0 top-0 border-l h-screen bg-white min-w-lg flex flex-col justify-between max-w-[32rem]">
      {/* Overlay with expanding circle */}
      {showOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-full transition-transform duration-300 ease-in-out ${circleActive ? "scale-[20]" : "scale-0"}`}
            style={{ width: 400, height: 400 }}
          />
          {/* Only show inside items after animation */}
          {showOverlayContent && (
            <>
              {/* X button inside overlay */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-16 right-4 z-[100]"
                onClick={handleCloseOverlay}
              >
                <XIcon className="text-zinc-600 size-6" />
              </Button>
              <Avatar className="size-40">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>T</AvatarFallback>
              </Avatar>
            </>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Chat message list */}
        <ScrollArea className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] text-sm shadow-md ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white self-end"
                    : "bg-gray-200 text-gray-900 self-start"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {/* Streaming AI response */}
          {loading && aiResponse && (
            <div className="mb-2 flex justify-start">
              <div className="rounded-lg px-3 py-2 max-w-[80%] text-sm shadow-md bg-gray-200 text-gray-900 self-start">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {aiResponse}
                </ReactMarkdown>
                <span className="animate-pulse ml-1">|</span>
              </div>
            </div>
          )}
          {loading && !aiResponse && (
            <div className="mb-2 flex justify-start">
              <div className="rounded-lg max-w-[80%] text-sm shadow-md bg-gray-300 text-gray-900 self-start">
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        {/* Input area always visible at the bottom */}
        <div className="p-4 border-t rounded-b-lg bg-gray-50">
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
            value={optimisticInput === "" ? input : optimisticInput}
            onChange={handleInputChange}
            readOnly={recording || loading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (input.trim()) {
                  sendToChatAPI(input);
                  setInput("");
                }
              }
            }}
          />
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="flex flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => sendToChatAPI("Please analyze this contract.")}
            >
              Analyze
            </Button>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShowOverlay}
                >
                  <AudioWaveformIcon />
                </Button>
                <Button
                  variant="default"
                  className="ml-auto"
                  onClick={() => {
                    if (input.trim()) {
                      sendToChatAPI(input);
                      setInput("");
                    }
                  }}
                  disabled={!input || loading}
                >
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

export default AIAgent;
