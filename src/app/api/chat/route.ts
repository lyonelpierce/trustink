import fs from "fs";
import OpenAI from "openai";
import { convex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";
import { Id } from "../../../../convex/_generated/dataModel";

// export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, documentId } = await req.json();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Map Clerk userId to Convex user_id
    const user = await convex.query(api.users.getUserByClerkId, {
      clerkId: userId,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const convexUserId = user._id;

    // Save the user's message first
    const latestMessage = messages[messages.length - 1];
    await convex.mutation(api.messages.saveChatMessage, {
      document_id: documentId as Id<"documents">,
      user_id: convexUserId,
      role: latestMessage.role,
      content: latestMessage.content,
    });

    // 1. Get the document from Convex
    const document = await convex.query(api.documents.getDocument, {
      documentId: documentId as Id<"documents">,
    });
    if (!document || !document.url) {
      throw new Error("Could not fetch document metadata.");
    }
    const fileUrl = document.url;

    // 2. Download the file from the document's URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Could not download document file from storage.");
    }
    const arrayBuffer = await response.arrayBuffer();

    // 3. Write the file to a temporary location (required for OpenAI SDK)
    const tempFilePath = `/tmp/${documentId}.pdf`;
    const fileBuffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, fileBuffer);

    // 4. Upload the file to OpenAI's files API
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const fileUpload = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "user_data",
    });

    // 5. Reference the file ID in the chat completion request
    // Build OpenAI messages array with full conversation history
    const openAIMessages = messages.map(
      (msg: { role: string; content: string }, idx: number) => {
        // For the latest user message, attach the file
        if (idx === messages.length - 1 && msg.role === "user") {
          return {
            role: "user",
            content: [
              {
                type: "file",
                file: { file_id: fileUpload.id },
              },
              {
                type: "text",
                text: msg.content,
              },
            ],
          };
        }
        // For all other messages, just pass text
        return {
          role: msg.role,
          content: [{ type: "text", text: msg.content }],
        };
      }
    );

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openAIMessages,
      stream: true,
      max_tokens: 512,
    });

    // 6. Stream the response to the client
    const encoder = new TextEncoder();
    let fullText = "";
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
        // Save the full summary as the assistant's message after streaming
        await convex.mutation(api.messages.saveChatMessage, {
          document_id: documentId as Id<"documents">,
          user_id: convexUserId,
          role: "assistant",
          content: fullText,
        });
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
