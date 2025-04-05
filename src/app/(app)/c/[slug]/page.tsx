'use client'

import Message from '@/components/Message'
import TextAnimation from '@/components/TextAnimation'
import { type Role, useConversation } from '@11labs/react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { GitHub, X } from 'react-feather'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

// Define proper types for messages
interface ConversationMessage {
  id: string;
  role: string;
  content_transcript: string;
  formatted: {
    text: string;
    transcript: string;
  };
  [key: string]: unknown; // Replace any with unknown
}

const ConversationPage = () => {
  const { slug } = useParams()
  const [currentText, setCurrentText] = useState('')
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  
  const loadConversation = useCallback(() => {
    fetch(`/api/c?id=${slug}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.length > 0) {
          setMessages(
            res.map((i: ConversationMessage) => ({
              ...i,
              formatted: {
                text: i.content_transcript,
                transcript: i.content_transcript,
              },
            })),
          )
        }
      })
  }, [slug])
  
  const conversation = useConversation({
    onError: (error: string) => { toast(error) },
    onConnect: () => { toast('Connected to ElevenLabs.') },
    onMessage: (props: { message: string; source: Role }) => {
      const { message, source } = props
      if (source === 'ai') setCurrentText(message)
      fetch('/api/c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug,
          item: {
            type: 'message',
            status: 'completed',
            object: 'realtime.item',
            id: 'item_' + Math.random(),
            role: source === 'ai' ? 'assistant' : 'user',
            content: [{ type: 'text', transcript: message }],
          },
        }),
      }).then(() => loadConversation())
    },
  })
  
  const connectConversation = useCallback(async () => {
    toast('Setting up ElevenLabs...')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const response = await fetch('/api/i', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.error) return toast(data.error)
      await conversation.startSession({ signedUrl: data.apiKey })
    } catch (err) {
      toast(`Failed to set up ElevenLabs: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [conversation])
  
  const disconnectConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])
  
  const handleStartListening = useCallback(() => {
    if (conversation.status !== 'connected') connectConversation()
  }, [conversation.status, connectConversation])
  
  const handleStopListening = useCallback(() => {
    if (conversation.status === 'connected') disconnectConversation()
  }, [conversation.status, disconnectConversation])
  
  useEffect(() => {
    loadConversation()
    return () => {
      disconnectConversation()
    }
  }, [slug, disconnectConversation, loadConversation])
  
  return (
    <>
      <a target="_blank" href="https://github.com/neondatabase-labs/voice-thingy-with-elevenlabs-neon/" className="fixed bottom-2 right-2" rel="noopener noreferrer">
        <GitHub />
      </a>
      <span className="fixed bottom-2 left-2">
        Powered by{' '}
        <a href="https://neon.tech/" className="underline" target="_blank" rel="noopener noreferrer">
          Neon
        </a>{' '}
        and{' '}
        <a href="https://elevenlabs.io/" className="underline" target="_blank" rel="noopener noreferrer">
          ElevenLabs
        </a>
        .
      </span>
      <div className="fixed top-2 left-2 flex flex-row gap-x-2 items-center">
        <a href="https://neon.tech" target="_blank" rel="noopener noreferrer">
          <Image 
            src="https://neon.tech/brand/neon-logo-light-color.svg" 
            width={158} 
            height={48} 
            className="h-[30px] w-auto" 
            alt="Neon Logo" 
          />
        </a>
        <span className="text-gray-400">/</span>
        <Link href="/">
          <span>Pulse</span>
        </Link>
      </div>
      <TextAnimation currentText={currentText} isAudioPlaying={conversation.isSpeaking} onStopListening={handleStopListening} onStartListening={handleStartListening} />
      {messages.length > 0 && (
        <button className="text-sm fixed top-2 right-4 underline" onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}>
          Show Transcript
        </button>
      )}
      {isTranscriptOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black p-4 rounded shadow-lg max-w-[90%] max-h-[90%] overflow-y-scroll">
            <div className="flex flex-row items-center justify-between">
              <span>Transcript</span>
              <button onClick={() => setIsTranscriptOpen(false)}>
                <X />
              </button>
            </div>
            <div className="border-t py-4 mt-4 flex flex-col gap-y-4">
              {messages.map((conversationItem) => (
                <Message key={conversationItem.id} conversationItem={conversationItem} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

ConversationPage.displayName = 'ConversationPage'

export default ConversationPage
