import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabaseAdmin";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  if (evt.type === "user.created") {
    const emailAddress = evt.data.email_addresses[0].email_address;

    const supabase = await createClient();

    try {
      // Insert the new user
      const { error: userError } = await supabase.from("users").insert({
        clerk_id: evt.data.id,
        email: emailAddress,
        image_url: evt.data.image_url,
        first_name: evt.data.first_name,
        last_name: evt.data.last_name,
      });

      if (userError) {
        console.error("Error inserting user into database:", userError);
      }

      // Check recipients table for matching email and update account_id
      const { error: updateError } = await supabase
        .from("recipients")
        .update({ account_id: evt.data.id })
        .eq("email", emailAddress);

      if (updateError) {
        console.error("Error updating recipients table:", updateError);
      }
    } catch (error) {
      console.error("Error: Could not insert user into database:", error);
    }
  }

  return new Response("Webhook received", { status: 200 });
}
