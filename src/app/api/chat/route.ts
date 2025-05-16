export const runtime = "edge";

// Removed unused imports for ai
import { auth } from "@clerk/nextjs/server";
// import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import { DocumentService } from "@/services/api";

// Removed unused openai instance

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

    // Instead of embeddings, ask the PDF document directly
    const answer = await DocumentService.askQuestion(
      documentId,
      latestMessage.content
    );

    // Save AI response after completion
    const { error: aiMessageError } = await supabase
      .from("chat_messages")
      .insert({
        document_id: documentId,
        user_id: userId,
        role: "assistant",
        content: answer.text,
      });

    if (aiMessageError) {
      console.error("Error saving AI message:", aiMessageError);
    }

    return NextResponse.json({
      role: "assistant",
      content: answer.text,
      highlightSectionId: answer.highlightSectionId || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
