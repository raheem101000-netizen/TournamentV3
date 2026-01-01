import { Resend } from 'resend';

let resendClient: Resend | null = null;

async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  // Try to use environment variable first (simpler)
  const apiKey = process.env.RESEND_API_KEY;
  
  if (apiKey) {
    return {
      client: new Resend(apiKey),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    };
  }

  // Fallback: try to fetch from Replit connector
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY
      ? "repl " + process.env.REPL_IDENTITY
      : process.env.WEB_REPL_RENEWAL
        ? "depl " + process.env.WEB_REPL_RENEWAL
        : null;

    if (!xReplitToken || !hostname) {
      throw new Error('Missing Replit connector credentials');
    }

    const response = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken,
        },
      }
    );

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.api_key) {
      throw new Error('Resend API key not found in connector');
    }

    return {
      client: new Resend(connectionSettings.settings.api_key),
      fromEmail: connectionSettings.settings.from_email || 'onboarding@resend.dev'
    };
  } catch (error) {
    console.error('Failed to get Resend credentials:', error);
    // Fallback for development
    return {
      client: new Resend('re_test_1234567890'),
      fromEmail: 'onboarding@resend.dev'
    };
  }
}

export async function sendVerificationEmail(
  recipientEmail: string,
  verificationLink: string,
  recipientName: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();

    const result = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
              .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
              .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verify Your Email</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                <p>Thank you for signing up! Click the button below to verify your email address and complete your registration.</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}" class="button">Verify Email</a>
                </p>
                <p><strong>Or copy this link:</strong></p>
                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-size: 12px;">
                  ${verificationLink}
                </p>
                <p style="color: #999; font-size: 12px;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>© 2025 Tournament Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('[EMAIL] Verification email sent successfully:', {
      to: recipientEmail,
      from: fromEmail,
      messageId: result.id
    });

    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send verification email:', {
      error: error.message,
      recipientEmail,
      stack: error.stack
    });
    return false;
  }
}
