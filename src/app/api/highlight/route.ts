import fs from "fs";
import OpenAI from "openai";
import { convex } from "@/lib/convex";
import { getAuth, auth } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: "convex" });

  if (token) {
    convex.setAuth(token);
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId, query } = await req.json();

    // 1. Get the document from Convex (for the url)
    const document = await convex.query(api.documents.getDocument, {
      documentId,
    });
    if (!document || !document.url) {
      throw new Error("Could not fetch document metadata.");
    }
    const docUrl = document.url;

    // 2. Download the file from storage using the url
    const response = await fetch(docUrl);
    if (!response.ok) {
      throw new Error("Could not download document file from storage.");
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer());
    const tempFilePath = `/tmp/${documentId}.pdf`;
    fs.writeFileSync(tempFilePath, fileBuffer);

    // 3. Upload the file to OpenAI's files API (if needed)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 4. Fetch all lines for the document from Convex
    type Line = {
      _id: string;
      text: string;
      page_number: number;
      position_x: number;
      position_y: number;
      width: number;
      height: number;
    };
    const lines: Line[] = await convex.query(api.lines.getLines, {
      document_id: documentId,
    });
    if (!lines) {
      return NextResponse.json(
        { error: "Could not fetch document lines." },
        { status: 500 }
      );
    }

    // Prepare lines for AI context
    const linesForAI = lines.map((line) => ({
      id: line._id,
      text: line.text,
      page_number: line.page_number,
    }));

    // 5. Ask OpenAI which lines to highlight
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

    // 6. Insert highlights for each matching line using their positions
    const highlightIds: string[] = [];
    const highlightErrors: { lineId: string; error: unknown }[] = [];
    for (const lineId of lineIdsToHighlight) {
      const line = lines.find((l) => l._id === lineId);
      if (!line) continue;
      const { position_x, position_y, width, height, page_number } = line;
      try {
        const highlightId = await convex.mutation(
          api.highlights.createHighlight,
          {
            document_id: documentId,
            user_id: document.user_id,
            position_x,
            position_y,
            width,
            height,
            page: page_number,
          }
        );
        highlightIds.push(highlightId);
      } catch (error) {
        console.error(error);
        highlightErrors.push({ lineId, error });
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
