import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { emails } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email address must be provided" },
        { status: 400 }
      );
    }

    const emailPromises = emails.map((email) =>
      resend.emails.send({
        from: "Trustink <no-reply@trustink.dev>",
        to: email,
        subject: `Document for Signature: [INSERT DOCUMENT NAME]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Document Ready for Signature</h2>
            <p>Hello,</p>
            <p>You have received a new document to sign: <strong>[INSERT DOCUMENT NAME]</strong></p>
            <p>Please log in to your Trustink account to review and sign the document.</p>
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
}
