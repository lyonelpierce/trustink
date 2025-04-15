import { marked } from "marked";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { Message } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

// Memoized components defined at module level
const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return <ReactMarkdown>{content}</ReactMarkdown>;
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";

const MessageList = ({ messages }: { messages: Message[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            <MemoizedMarkdown content={message.content} id={message.id} />
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
