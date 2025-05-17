import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await request.json();

  const supabase = createServerSupabaseClient();

  try {
    const { data } = await supabase
      .from("fields")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .eq("type", "signature");

    if (!data) {
      return NextResponse.json({ error: "No fields found" }, { status: 404 });
    }

    return NextResponse.json({ fields: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}
