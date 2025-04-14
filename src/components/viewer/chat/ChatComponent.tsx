import { useChat } from "@ai-sdk/react";
import { SendIcon } from "lucide-react";
import MessageList from "./MessageList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatComponentProps {
  documentId: string;
}

const ChatComponent = ({ documentId }: ChatComponentProps) => {
  const { input, messages, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      documentId,
    },
  });

  return (
    <div className="relative min-h-screen flex-1 h-full pb-40">
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-lg font-medium">Chat</h3>
      </div>

      <MessageList messages={messages} />

      <form onSubmit={handleSubmit} className="flex gap-1">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about the document"
          className="w-full sticky bottom-0 inset-x-0 px-2 py-4 bg-white"
        />
        <Button type="submit" className="rounded-md">
          <SendIcon />
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
