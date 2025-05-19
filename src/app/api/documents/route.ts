export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { auth } from "@clerk/nextjs/server";
import { after, NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getAuth } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request);
  const token = await getToken({ template: "convex" });

  if (token) {
    convex.setAuth(token);
  }

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

    const documentName = file.name.replace(/\.[^/.]+$/, "");

    const uploadUrl = await convex.mutation(api.documents.generateUploadUrl);

    const fileUrl = await fetch(uploadUrl, {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    const { storageId, url } = await fileUrl.json();

    const document = await convex.mutation(api.documents.createDocument, {
      name: documentName,
      size: file.size,
      storage_id: storageId,
      status: "pending",
      visibility: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    after(() => {
      fetch(`${process.env.BACKEND_API}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_url: url,
          user_id: userId,
          document_id: document,
        }),
      });
    });

    return NextResponse.json({
      id: document,
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
