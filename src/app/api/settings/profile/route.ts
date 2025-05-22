import { convex } from "@/lib/convex";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { getAuth, auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { getToken } = getAuth(request);
  const token = await getToken({ template: "convex" });

  if (token) {
    convex.setAuth(token);
  }

  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const avatarFile = formData.get("avatar") as File | null;

    let imageUrl = undefined;
    if (avatarFile) {
      // 1. Get upload URL from Convex
      const uploadUrl = await convex.mutation(api.documents.generateUploadUrl);
      // 2. Upload the file to Convex storage
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: avatarFile,
        headers: {
          "Content-Type": avatarFile.type,
        },
      });
      const { storageId } = await uploadRes.json();
      // 3. Get the public URL for the uploaded image via Convex mutation
      const { url } = await convex.mutation(api.documents.getPublicUrl, {
        storageId,
      });
      imageUrl = url;
    }

    // Update user profile in Convex
    await convex.mutation(api.users.updateUserProfile, {
      clerkId: userId,
      first_name: firstName,
      last_name: lastName,
      image_url: imageUrl || undefined,
    });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
