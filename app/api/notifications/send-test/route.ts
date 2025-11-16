import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const missingEnvMessage =
  "Missing Gmail credentials. Provide a Gmail App Password in the request, or set GMAIL_USER, GMAIL_APP_PASSWORD, and NOTIFICATIONS_FROM_EMAIL.";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      subject?: string;
      message?: string;
      gmailUser?: string;
      gmailAppPassword?: string;
      fromEmail?: string;
    };
    const recipient = body.email?.trim() || process.env.NOTIFICATIONS_TEST_RECIPIENT;
    const subject = body.subject?.trim() || "Focus.One overdue goal reminder";
    const note =
      body.message?.trim() ||
      "This is a quick reminder that one of your goals is overdue. Jump back into Focus.One to review the plan.";

    if (!recipient) {
      return NextResponse.json({ error: "Add an email address to send the test reminder." }, { status: 400 });
    }

    const user = process.env.GMAIL_USER || body.gmailUser?.trim();
    const pass = process.env.GMAIL_APP_PASSWORD || body.gmailAppPassword?.trim();
    const from = process.env.NOTIFICATIONS_FROM_EMAIL || body.fromEmail?.trim() || user;

    if (!user || !pass || !from) {
      return NextResponse.json({ error: missingEnvMessage }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `Focus.One Alerts <${from}>`,
      to: recipient,
      subject,
      text: note,
      html: `<p>${note}</p><p style="margin-top:16px;">Stay focused,<br/>Focus.One</p>`,
    });

    return NextResponse.json({ ok: true, message: `Reminder sent to ${recipient}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the reminder.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

