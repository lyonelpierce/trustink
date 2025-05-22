import { convex } from "@/lib/convex";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request);
  const token = await getToken({ template: "convex" });

  if (token) {
    convex.setAuth(token);
  }

  const { documentId } = await request.json();

  try {
    const fields = await convex.query(api.fields.getFields, {
      document_id: documentId,
    });

    if (!fields) {
      return NextResponse.json({ error: "No fields found" }, { status: 404 });
    }

    return NextResponse.json({ fields });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}
