import { useChat } from "@ai-sdk/react";
import { SendIcon } from "lucide-react";
import MessageList from "./MessageList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Database } from "../../../../database.types";
import { ScrollArea } from "@/components/ui/scroll-area";

const ChatComponent = ({
  documentId,
  chatMessages,
}: {
  documentId: string;
  chatMessages: Database["public"]["Tables"]["chat_messages"]["Row"][];
}) => {
  const { input, messages, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      documentId,
    },
    initialMessages: chatMessages.map((message) => ({
      id: message.id.toString(),
      content: message.content,
      role: message.role as "user" | "assistant",
    })),
  });

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="absolute top-0 inset-x-0 p-2 bg-white h-fit z-10">
        <h3 className="text-lg font-medium">Chat</h3>
      </div>

      <ScrollArea className="flex-1 mt-12 mb-16 overflow-y-auto">
        <div className="px-2">
          <MessageList messages={messages} />
        </div>
      </ScrollArea>

      <div className="absolute bottom-0 inset-x-0 p-2 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about the document"
            className="w-full h-10"
          />
          <Button type="submit" className="rounded-md">
            <SendIcon />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
