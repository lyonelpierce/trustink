import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import OpenAI from "openai";
import fs from "fs";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { documentId, query } = await req.json();

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

    // 6. Fetch all lines for the document from documents_lines
    const { data: lines, error: linesError } = await supabase
      .from("documents_lines")
      .select("id, text, page_number, position_x, position_y, width, height")
      .eq("document_id", documentId);
    if (linesError || !lines) {
      return NextResponse.json(
        { error: "Could not fetch document lines." },
        { status: 500 }
      );
    }

    // Prepare lines for AI context
    const linesForAI = lines.map((line) => ({
      id: line.id,
      text: line.text,
      page_number: line.page_number,
    }));

    // 7. Ask OpenAI which lines to highlight
    const aiPrompt = `A user wants to highlight the entire section titled \"${query}\" in this contract.\n\nHere is a list of lines from the document, each with an id, text, and page_number:\n\n${JSON.stringify(linesForAI, null, 2)}\n\nPlease return a JSON array of the IDs of the lines that should be highlighted for the section \"${query}\". Only include the lines that are part of the section, starting from the heading (such as \"Section 4\" or \"4.\") up to but not including the next section heading (e.g., \"Section 5\" or \"5.\"). Example response: [\"line_id_1\", \"line_id_2\", ...]`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for document navigation.",
        },
        {
          role: "user",
          content: aiPrompt,
        },
      ],
      max_tokens: 2048,
    });

    let lineIdsToHighlight: string[] = [];
    try {
      const text = aiResponse.choices[0].message.content || "";
      console.log(text, "raw AI response before JSON.parse");
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) {
        return NextResponse.json(
          { error: "Could not find JSON array in AI response." },
          { status: 400 }
        );
      }
      lineIdsToHighlight = JSON.parse(match[0]);
    } catch {
      return NextResponse.json(
        { error: "Could not parse AI response." },
        { status: 400 }
      );
    }
    if (!Array.isArray(lineIdsToHighlight) || lineIdsToHighlight.length === 0) {
      return NextResponse.json(
        { error: "No lines found to highlight." },
        { status: 404 }
      );
    }

    // 8. Insert highlights for each matching line using their positions
    const highlightIds: string[] = [];
    const highlightErrors: { lineId: string; error: unknown }[] = [];
    for (const lineId of lineIdsToHighlight) {
      const line = lines.find((l) => l.id === lineId);
      if (!line) continue;
      const { position_x, position_y, width, height, page_number } = line;
      const { data, error } = await supabase
        .from("highlights")
        .insert({
          document_id: documentId,
          user_id: userId,
          position_x,
          position_y,
          width,
          height,
          page: page_number,
        })
        .select("id")
        .single();
      if (error) {
        console.error(error);
        highlightErrors.push({ lineId, error });
      } else if (data && data.id) {
        highlightIds.push(data.id);
      }
    }

    // Return the highlighted line IDs and highlight IDs
    return NextResponse.json({
      line_ids: lineIdsToHighlight,
      highlight_ids: highlightIds,
      highlight_errors: highlightErrors,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process highlight request" },
      { status: 500 }
    );
  }
}
