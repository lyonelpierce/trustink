import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { full_name } = await request.json();

  const supabase = createServerSupabaseClient();

  try {
    const initials = full_name
      .split(" ")
      .map((name: string) => name[0])
      .join("");

    const { error } = await supabase.from("signatures").insert({
      full_name,
      initials,
      font: "font-tangerine",
      user_id: userId,
    });

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { message: "A similar signature already exists" },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json(
      { message: "Signature created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to create signature" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const signatureId = searchParams.get("id");

  if (!signatureId) {
    return NextResponse.json(
      { message: "Signature ID is required" },
      { status: 400 }
    );
  }

  const { full_name } = await request.json();

  const initials = full_name
    .split(" ")
    .map((name: string) => name[0])
    .join("");

  const supabase = createServerSupabaseClient();

  try {
    const { error } = await supabase
      .from("signatures")
      .update({
        full_name,
        initials,
        font: "font-tangerine",
      })
      .eq("id", signatureId)
      .eq("user_id", userId); // Ensure user can only update their own signatures

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { message: "Signature updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to update signature" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const signatureId = searchParams.get("id");

  if (!signatureId) {
    return NextResponse.json(
      { message: "Signature ID is required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  try {
    const { error } = await supabase
      .from("signatures")
      .delete()
      .eq("id", signatureId)
      .eq("user_id", userId); // Ensure user can only delete their own signatures

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { message: "Signature deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to delete signature" },
      { status: 500 }
    );
  }
}
