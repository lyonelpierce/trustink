export const runtime = "edge";

import { streamText, embed } from "ai";
import { auth } from "@clerk/nextjs/server";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

const openai = createOpenAI({
  compatibility: "strict", // strict mode, enable when using the OpenAI API
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { messages, documentId } = await req.json();
    const { userId } = await auth();

    // Save the user's message first
    const latestMessage = messages[messages.length - 1];

    const { data, error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        document_id: documentId,
        user_id: userId,
        role: latestMessage.role,
        content: latestMessage.content,
      });

    console.log(data);

    if (userMessageError) {
      console.log("Error saving user message:", userMessageError);
      throw new Error(
        `Failed to save user message: ${userMessageError.message}`
      );
    }

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: latestMessage.content,
    });

    // Fetch document embeddings from Supabase with more debugging
    const { data: similarEmbeddings, error } = await supabase.rpc(
      "match_document_embeddings",
      {
        query_embedding: embedding,
        document_id: documentId,
        match_threshold: 0.2, // Lower threshold for testing
        match_count: 5, // Increased count for testing
      }
    );

    if (error) {
      console.error("Embedding match error:", error);
      throw new Error(`Failed to fetch embeddings: ${error.message}`);
    }

    // Check if any embeddings exist for this document
    const { error: countError } = await supabase
      .from("document_embeddings")
      .select("id", { count: "exact" })
      .eq("document_id", documentId);

    if (countError) {
      console.error("Embedding count error:", countError);
      throw new Error(`Failed to fetch embedding count: ${countError.message}`);
    }

    // Add debug logging
    if (similarEmbeddings?.length > 0) {
      console.log(
        "First embedding similarity:",
        similarEmbeddings[0].similarity
      );
      console.log(
        "First embedding content preview:",
        similarEmbeddings[0].content.substring(0, 100)
      );
    } else {
      console.log("No similar embeddings found!");
    }

    // Create context from embeddings
    const context =
      similarEmbeddings
        ?.map((e: { content: string }) => e.content)
        .join("\n") || "";

    // Updated system prompt with the provided template
    const result = streamText({
      model: openai("gpt-4o"),
      system: `AI assistant is a friendly and knowledgeable guide specializing in explaining legal documents and terms in simple, everyday language.
      The assistant excels at breaking down complex legal concepts into clear, understandable explanations for people without legal training.
      When explaining legal terms, the assistant:
      - Uses plain language and avoids legal jargon whenever possible
      - Provides relevant real-world examples to illustrate concepts
      - Breaks down complex ideas into smaller, digestible pieces
      - Confirms understanding and encourages questions for clarity
      - Never provides actual legal advice or interpretations
      
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK

      The assistant will only reference information directly from the provided context.
      If the context does not contain the answer, the assistant will say "I'm sorry, but I don't have enough information to answer that question accurately."
      The assistant will not make assumptions or invent details not present in the context.
      The assistant will focus on explaining what terms mean rather than interpreting their legal implications.`,
      messages,
      onFinish: async (completion) => {
        // Save AI response after completion
        const { error: aiMessageError } = await supabase
          .from("chat_messages")
          .insert({
            document_id: documentId,
            user_id: userId,
            role: "assistant",
            content: completion.text,
          });

        if (aiMessageError) {
          console.error("Error saving AI message:", aiMessageError);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
