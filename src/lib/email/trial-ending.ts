// Email template for trial ending notifications
// TODO: Integrate with email service (Resend, SendGrid, etc.)

export interface TrialEndingEmailData {
  email: string;
  userName: string;
  daysRemaining: number;
  upgradeUrl: string;
}

export function getTrialEndingEmailTemplate(data: TrialEndingEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { email, userName, daysRemaining, upgradeUrl } = data;

  const subject =
    daysRemaining === 1
      ? 'Your HomeQR trial ends tomorrow - Upgrade now!'
      : `Your HomeQR trial ends in ${daysRemaining} days`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">HomeQR</h1>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #111827; margin-top: 0;">Hi ${userName},</h2>
          
          <p style="font-size: 16px; color: #374151;">
            Your 14-day free trial ${daysRemaining === 1 ? 'ends tomorrow' : `ends in ${daysRemaining} days`}.
          </p>
          
          <p style="font-size: 16px; color: #374151;">
            Don't miss out on capturing leads and growing your real estate business. Upgrade now to continue using HomeQR with unlimited QR codes, advanced analytics, and priority support.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${upgradeUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Upgrade Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            Your existing QR codes and data will remain safe. Upgrade anytime to reactivate your account.
          </p>
        </div>
        
        <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
          <p>© ${new Date().getFullYear()} HomeQR. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${userName},

Your 14-day free trial ${daysRemaining === 1 ? 'ends tomorrow' : `ends in ${daysRemaining} days`}.

Don't miss out on capturing leads and growing your real estate business. Upgrade now to continue using HomeQR with unlimited QR codes, advanced analytics, and priority support.

Upgrade now: ${upgradeUrl}

Your existing QR codes and data will remain safe. Upgrade anytime to reactivate your account.

© ${new Date().getFullYear()} HomeQR. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Send trial ending email
 * TODO: Implement actual email sending with your email service
 */
export async function sendTrialEndingEmail(data: TrialEndingEmailData): Promise<void> {
  const template = getTrialEndingEmailTemplate(data);

  // TODO: Replace with actual email service integration
  // Example with Resend:
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'HomeQR <noreply@homeqr.com>',
  //   to: data.email,
  //   subject: template.subject,
  //   html: template.html,
  //   text: template.text,
  // });

  console.log('[Email] Would send trial ending email:', {
    to: data.email,
    subject: template.subject,
  });
}

