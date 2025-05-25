export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { convex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { after, NextRequest, NextResponse } from "next/server";

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

    const { storageId } = await fileUrl.json();

    const document = await convex.mutation(api.documents.createDocument, {
      name: documentName,
      size: file.size,
      storage_id: storageId,
      status: "pending",
      visibility: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    console.log("API");
    after(() => {
      console.log("API2");
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("user_id", userId);
        form.append("document_id", document);
        fetch(`${process.env.BACKEND_API}`, {
          method: "POST",
          body: form,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.log("API3");
        console.error("[API/documents] Error processing document:", error);
      }
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
