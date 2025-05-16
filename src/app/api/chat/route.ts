import fs from "fs";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

// export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { messages, documentId } = await req.json();
    const { userId } = await auth();

    // Save the user's message first
    const latestMessage = messages[messages.length - 1];
    await supabase.from("chat_messages").insert({
      document_id: documentId,
      user_id: userId,
      role: latestMessage.role,
      content: latestMessage.content,
    });

    // 1. Get the document path from the documents table
    const { data: docMeta, error: docMetaError } = await supabase
      .from("documents")
      .select("path")
      .eq("id", documentId)
      .single();
    if (docMetaError || !docMeta) {
      throw new Error("Could not fetch document metadata.");
    }
    const docPath = docMeta.path;

    // 2. Download the file from Supabase storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("documents")
      .download(docPath);
    if (fileError || !fileData) {
      throw new Error("Could not download document file from storage.");
    }

    // 3. Write the file to a temporary location (required for OpenAI SDK)
    const tempFilePath = `/tmp/${documentId}.pdf`;
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    fs.writeFileSync(tempFilePath, fileBuffer);

    // 4. Upload the file to OpenAI's files API
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const fileUpload = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "user_data",
    });

    // 5. Reference the file ID in the chat completion request
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              file: { file_id: fileUpload.id },
            },
            {
              type: "text",
              text:
                latestMessage.content ||
                "Please summarize this document and ask if I need legal help.",
            },
          ],
        },
      ],
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
        await supabase.from("chat_messages").insert({
          document_id: documentId,
          user_id: userId,
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
