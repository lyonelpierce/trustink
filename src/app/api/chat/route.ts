export const runtime = "edge";

import { streamText, embed } from "ai";
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

    const latestMessage = messages[messages.length - 1];

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
        match_threshold: 0.5, // Lower threshold for testing
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
      system: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.`,
      messages,
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
