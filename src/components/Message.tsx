import { Cpu, User } from 'react-feather'

interface MessageProps {
  conversationItem: { 
    role: string; 
    formatted: { 
      transcript: string 
    } 
  }
}

const Message = ({ conversationItem }: MessageProps) => {
  return (
    <div className="flex flex-row items-start gap-x-3 flex-wrap max-w-full">
      <div className="rounded border p-2 max-w-max">{conversationItem.role === 'user' ? <User /> : <Cpu />}</div>
      <div className="flex flex-col gap-y-2">{conversationItem.formatted.transcript}</div>
    </div>
  )
}

Message.displayName = 'Message'

export default Message
