export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import {
  getDocumentById,
  getUserDocuments,
  uploadDocumentFile,
  getDocumentAnalysis,
  getUserDocumentsWithMeta,
} from "@/lib/supabase";
import { embed } from "ai";
import { auth } from "@clerk/nextjs/server";
import { Tiktoken } from "js-tiktoken/lite";
import { Document } from "langchain/document";
import { createOpenAI } from "@ai-sdk/openai";
import { after, NextResponse } from "next/server";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

const encoder = new Tiktoken(o200k_base);

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  const { pageContent, metadata } = page;
  const pageContentWithoutNewlines = pageContent.replace(/\n/g, "");

  // Count tokens in the content
  const tokens = encoder.encode(pageContentWithoutNewlines);
  const maxTokens = 8000; // OpenAI's recommended limit for embeddings

  // If content is within token limit, process as single chunk
  if (tokens.length <= maxTokens) {
    return [
      new Document({
        pageContent: pageContentWithoutNewlines,
        metadata: {
          pageNumber: metadata.loc.pageNumber,
          text: pageContentWithoutNewlines,
        },
      }),
    ];
  }

  // Otherwise split the document
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  const docs = await splitter.splitDocuments([
    new Document({
      pageContent: pageContentWithoutNewlines,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: pageContentWithoutNewlines,
      },
    }),
  ]);

  // Filter chunks that exceed token limit
  return docs.filter((doc) => {
    const chunkTokens = encoder.encode(doc.pageContent);
    return chunkTokens.length <= maxTokens;
  });
}

export async function POST(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Get file buffer and convert to base64
    const fileBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString("base64");

    // Upload file to Supabase storage
    const supabase = createServerSupabaseClient();

    // Create a unique filename
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${file.name.replace(
      /\s+/g,
      ""
    )}_${timestamp}.${fileExtension}`;

    const documentName = file.name.replace(/\.[^/.]+$/, "");
    // Upload the file
    const { data: storageData, error: storageError } = await uploadDocumentFile(
      fileName,
      fileBuffer,
      file.type
    );

    if (storageError) {
      console.error(
        "[API/documents] Error uploading to storage:",
        storageError
      );

      return NextResponse.json(
        {
          error: "Failed to upload document",
        },
        { status: 500 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "File must be a PDF",
        },
        { status: 400 }
      );
    }

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        name: documentName,
        path: storageData.path,
        size: file.size,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[API/documents] Error creating document:", error);
      return NextResponse.json(
        {
          error: "Failed to create document",
        },
        { status: 500 }
      );
    }

    const { error: documentDataError } = await supabase
      .from("documents_data")
      .insert({
        document_id: document.id,
        data: base64Data,
        user_id: userId,
      });

    if (documentDataError) {
      console.error(
        "[API/documents] Error saving document data:",
        documentDataError
      );
      return NextResponse.json(
        {
          error: "Failed to save document data",
        },
        { status: 500 }
      );
    }

    after(async () => {
      try {
        const loader = new PDFLoader(file);
        const pages = (await loader.load()) as PDFPage[];

        const documents = await Promise.all(pages.map(prepareDocument));

        // Generate embeddings for each chunk
        const embeddings = await Promise.all(
          documents.flat().map(async (document, index: number) => {
            const typedDoc = document as Document<{
              pageNumber: number;
              text: string;
            }>;
            const { embedding } = await embed({
              model: openai.embedding("text-embedding-3-small"),
              value: typedDoc.pageContent,
            });

            return {
              document_id: document.id,
              user_id: userId,
              content: typedDoc.pageContent,
              embedding: embedding,
              chunk_index: index,
            };
          })
        );

        // Store embeddings in Supabase
        const { error } = await supabase.from("document_embeddings").insert(
          embeddings.map((embedding) => ({
            ...embedding,
            document_id: document.id,
          }))
        );

        if (error) throw error;

        return NextResponse.json(
          {
            message: "Document analized successfully",
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[API/documents] Error analyzing document:", error);
      }
    });

    return NextResponse.json({
      id: document.id,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("[API/documents] Error processing document:", error);
    return NextResponse.json(
      {
        error: "Failed to process document",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const includeAnalysis = url.searchParams.get("includeAnalysis") === "true";
    const includeContracts =
      url.searchParams.get("includeContracts") === "true";

    const supabase = await createServerSupabaseClient();

    if (id) {
      // Get a specific document
      const { data, error } = await getDocumentById(supabase, id, userId);

      if (error) {
        return NextResponse.json(
          {
            error: "Document not found",
          },
          { status: 404 }
        );
      }

      // Get additional data if requested
      if (includeAnalysis) {
        const { data: analysisData, error: analysisError } =
          await getDocumentAnalysis(supabase, id, userId);

        if (!analysisError && analysisData) {
          data.analysis = analysisData;
        }
      }

      return NextResponse.json(data);
    } else {
      try {
        // List all documents for the user
        const { data, error } =
          includeAnalysis || includeContracts
            ? await getUserDocumentsWithMeta(supabase, userId)
            : await getUserDocuments(userId);

        if (error) {
          console.error("[API:documents.list]", error);
          // If there's a format error with the user ID, return an empty array
          // rather than a 500 error
          return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
      } catch (error) {
        console.error("[API:documents.list]", error);
        // Return empty array instead of error for better user experience
        return NextResponse.json([]);
      }
    }
  } catch (error) {
    console.error("[API:documents.get]", error);
    // Return empty array for document list requests
    return NextResponse.json([]);
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "No document ID provided" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // First get the document to get its storage path
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("path")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        {
          error: "Failed to fetch document",
        },
        { status: 500 }
      );
    }

    // Delete from storage bucket if path exists
    if (document?.path) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.path]);

      if (storageError) {
        return NextResponse.json(
          {
            error: "Failed to delete document from storage",
          },
          { status: 500 }
        );
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: "Failed to delete document record",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API:documents.delete]", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
      },
      { status: 500 }
    );
  }
}
