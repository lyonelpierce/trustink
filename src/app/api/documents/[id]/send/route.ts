import { Resend } from "resend";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabaseSsr";
import { after, NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  props: { params: { id: string } }
) {
  const params = await props.params;

  const { id } = params;
  const { subject, message } = await req.json();

  const { userId } = await auth();
  const supabase = createServerSupabaseClient();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: "sent" })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return new NextResponse("Error updating document status", {
        status: 500,
      });
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
      try {
        const emailPromises = recipients.map((recipient) =>
          resend.emails.send({
            from: "Trustink <no-reply@trustink.ai>",
            to: recipient.email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Document Ready for Signature</h2>
                <p>Hello,</p>
                <p>${message}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://app.trustink.ai/sign/${id}" 
                     style="background-color: #0066cc; 
                            color: white; 
                            padding: 12px 24px; 
                            text-decoration: none; 
                            border-radius: 4px; 
                            font-weight: bold;
                            display: inline-block;">
                    View Document
                  </a>
                </div>
                <p>If you have any questions, please don't hesitate to contact support.</p>
                <p>Best regards,<br>The Trustink Team</p>
              </div>
            `,
          })
        );

        try {
          const results = await Promise.all(emailPromises);
          return NextResponse.json(
            { message: "Emails sent successfully", results },
            { status: 200 }
          );
        } catch (emailError) {
          console.error("Error sending emails:", emailError);
          return NextResponse.json(
            { error: "Failed to send one or more emails" },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json(
          { error: "Invalid request format" },
          { status: 400 }
        );
      }
    });

    return NextResponse.json({ message: "Document sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating document", { status: 500 });
  }
}
