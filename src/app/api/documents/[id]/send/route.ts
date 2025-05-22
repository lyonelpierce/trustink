import { Resend } from "resend";
import { convex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "../../../../../../convex/_generated/api";
import { after, NextRequest, NextResponse } from "next/server";
import { Id } from "../../../../../../convex/_generated/dataModel";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  props: { params: { id: string } }
) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: "convex" });

  if (token) {
    convex.setAuth(token);
  }

  const params = await props.params;

  const { id } = params;
  const { subject, message } = await req.json();

  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await convex.mutation(api.documents.updateDocumentStatus, {
      document_id: id as Id<"documents">,
      status: "pending",
    });

    const recipients = await convex.query(api.recipients.getRecipients, {
      document_id: id as Id<"documents">,
    });

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
                  <a href="http://app.trustink.ai/sign/${id}" 
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
