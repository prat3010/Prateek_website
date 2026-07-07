import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml } from '@/utils/sanitize';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate existence
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields.' },
        { status: 400 }
      );
    }

    // Validate type
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Name, email, and message must be strings.' },
        { status: 400 }
      );
    }

    // Validate length constraints
    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Input size limits exceeded.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables.');
      return NextResponse.json(
        { error: 'Email service is not configured.' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const contactEmailTo = process.env.CONTACT_EMAIL_TO?.trim() || '3010prateeksharma@gmail.com';

    // Escape HTML special characters for HTML email context
    const escapedName = escapeHtml(name);
    const escapedEmail = escapeHtml(email);
    const escapedMessage = escapeHtml(message);

    // Sanitize name for subject line to prevent CRLF injection or HTML tags in the subject
    const cleanSubjectName = name.replace(/[\r\n]/g, '').replace(/<[^>]*>/g, '').trim();

    // Send the email
    // onboarding@resend.dev is the default unverified domain sender
    const { data, error } = await resend.emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to: contactEmailTo,
      replyTo: email,
      subject: `New Portfolio Signal from ${cleanSubjectName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Signal Received</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1a1a1a;
                line-height: 1.6;
                background-color: #f7f9fa;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border: 2px solid #000000;
                border-radius: 8px;
                box-shadow: 4px 4px 0px 0px #000000;
                overflow: hidden;
              }
              .header {
                background-color: #ffde4d;
                padding: 20px;
                border-bottom: 2px solid #000000;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .content {
                padding: 30px 20px;
              }
              .field {
                margin-bottom: 20px;
              }
              .label {
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                color: #888888;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
              }
              .value {
                font-size: 16px;
                font-weight: 500;
              }
              .message-box {
                background: #f1f3f5;
                border: 1px solid #ced4da;
                border-radius: 4px;
                padding: 15px;
                font-size: 15px;
                white-space: pre-wrap;
              }
              .footer {
                background: #f8f9fa;
                padding: 15px;
                border-top: 1px solid #e9ecef;
                font-size: 12px;
                color: #6c757d;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Signal Received</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Sender Name</div>
                  <div class="value">${escapedName}</div>
                </div>
                <div class="field">
                  <div class="label">Sender Email</div>
                  <div class="value"><a href="mailto:${escapedEmail}">${escapedEmail}</a></div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div class="message-box">${escapedMessage}</div>
                </div>
              </div>
              <div class="footer">
                This email was sent from your portfolio contact form API route.
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: unknown) {
    console.error('Contact route error:', e);
    const message = e instanceof Error ? e.message : 'An internal server error occurred.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
