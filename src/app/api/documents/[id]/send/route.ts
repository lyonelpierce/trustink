import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import { after, NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  props: { params: { id: string } }
) {
  const params = await props.params;
  const { id } = params;

  const { name, access } = await req.json();

  const { userId } = await auth();
  const supabase = createServerSupabaseClient();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isPublic = access === "public";

  try {
    const { data: document, error } = await supabase
      .from("documents")
      .update({
        name,
        visibility: isPublic,
        status: "pending",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return new NextResponse("Error creating document", { status: 500 });
    }

    const { data: recipients, error: recipientsError } = await supabase
      .from("recipients")
      .select("email")
      .eq("document_id", id);

    if (recipientsError) {
      console.error(recipientsError);
      return new NextResponse("Error creating recipients", { status: 500 });
    }

    after(async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/emails`,
        {
          method: "POST",
          body: JSON.stringify({
            emails: recipients.map((recipient) => recipient.email),
            documentName: document.name,
          }),
        }
      );

      if (!response.ok) {
        console.error("Error sending emails", response);
      }
    });

    return NextResponse.json({ message: "Document sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating document", { status: 500 });
  }
}
