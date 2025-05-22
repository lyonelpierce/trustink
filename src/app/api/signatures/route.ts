import { convex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { full_name } = await request.json();

  try {
    await convex.mutation(api.signatures.createSignature, {
      full_name,
      font: "font-tangerine",
    });
    return NextResponse.json(
      { message: "Signature created successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "A similar signature already exists"
    ) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
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

  try {
    await convex.mutation(api.signatures.updateSignature, {
      id: signatureId as Id<"signatures">,
      full_name,
      font: "font-tangerine",
    });
    return NextResponse.json(
      { message: "Signature updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
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

  try {
    await convex.mutation(api.signatures.deleteSignature, {
      id: signatureId as Id<"signatures">,
    });
    return NextResponse.json(
      { message: "Signature deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to delete signature" },
      { status: 500 }
    );
  }
}
