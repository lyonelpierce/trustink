import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();

    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log(clerkUser);

    const formData = await request.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const avatarFile = formData.get("avatar") as File | null;

    // Get current user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId);

    console.log(user);

    if (userError || !user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update profile data
    const { error: updateError } = await supabase
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
      })
      .eq("clerk_id", userId);

    if (updateError) {
      console.log(updateError);
    }

    // Handle avatar upload if provided
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update user's avatar URL
      const { error: avatarUpdateError } = await supabase
        .from("users")
        .update({
          image_url: publicUrl,
        })
        .eq("clerk_id", userId);

      if (avatarUpdateError) throw avatarUpdateError;
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
