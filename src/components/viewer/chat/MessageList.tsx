import { cn } from "@/lib/utils";
import { Message } from "@ai-sdk/react";

const MessageList = ({ messages }: { messages: Message[] }) => {
  if (!messages) return <></>;

  return (
    <div className="flex flex-col gap-2 p-4 h-full flex-1">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", {
            "justify-end pl-10": message.role === "user",
            "justify-start pr-10": message.role === "assistant",
          })}
        >
          <div
            className={cn(
              "rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10",
              {
                "bg-black text-white": message.role === "user",
                "bg-gray-50": message.role === "assistant",
              }
            )}
          >
            <p>{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
