import sgMail from '@sendgrid/mail';

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@skipli.app',
  name: process.env.SENDGRID_FROM_NAME ?? 'Skipli App',
};

const isSendGridConfigured = (): boolean => {
  const apiKey = process.env.SENDGRID_API_KEY;
  return !!(apiKey && !apiKey.startsWith('your_') && !apiKey.includes('xxxx'));
};

const initSendGrid = (): void => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  sgMail.setApiKey(apiKey);
};

// ─── Invite Email ─────────────────────────────────────────────────
interface InviteEmailParams {
  to: string;
  name: string;
  inviteToken: string;
}

export const sendEmployeeInviteEmail = async ({ to, name, inviteToken }: InviteEmailParams): Promise<{ success: boolean }> => {
  const setupUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/setup-account?token=${inviteToken}`;

  if (!isSendGridConfigured()) {
    console.log('\n--- 🧪 DEVELOPMENT MODE MOCK EMAIL (INVITE) ---');
    console.log(`To: ${to} (${name})`);
    console.log(`Invite URL: ${setupUrl}`);
    console.log('------------------------------------------------\n');
    return { success: true };
  }

  try {
    initSendGrid();
    const msg: sgMail.MailDataRequired = {
      to,
      from: FROM,
    subject: 'Welcome to Skipli — Set Up Your Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #e0e0f0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.2); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
          .body { padding: 40px; }
          .body p { color: #a0a0c0; line-height: 1.6; }
          .name { color: #e0e0f0; font-weight: 600; font-size: 18px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
          .link-box { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 12px 16px; word-break: break-all; color: #8b8bff; font-size: 13px; }
          .footer { padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
          .footer p { color: #505070; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ Skipli</h1>
            <p>Employee Task Management</p>
          </div>
          <div class="body">
            <p>Hello, <span class="name">${name}</span>!</p>
            <p>You've been added to the Skipli platform. Click the button below to set up your account credentials and get started.</p>
            <a href="${setupUrl}" class="btn">Set Up My Account →</a>
            <p>Or copy this link into your browser:</p>
            <div class="link-box">${setupUrl}</div>
            <p style="margin-top: 24px; font-size: 13px; color: #505070;">This link expires in 24 hours. If you didn't expect this email, you can safely ignore it.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Skipli App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

    await sgMail.send(msg);
    console.log(`📧 Invite email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid send failed. Falling back to console log for development:');
    console.error(error instanceof Error ? error.message : error);
    console.log('\n--- 🧪 DEVELOPMENT MODE MOCK EMAIL (INVITE FALLBACK) ---');
    console.log(`To: ${to} (${name})`);
    console.log(`Invite URL: ${setupUrl}`);
    console.log('--------------------------------------------------------\n');
    return { success: true };
  }
};

// ─── OTP Email ────────────────────────────────────────────────────
interface OtpEmailParams {
  to: string;
  name?: string;
  otp: string;
}

export const sendOtpEmail = async ({ to, name, otp }: OtpEmailParams): Promise<{ success: boolean }> => {
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES ?? '15';

  if (!isSendGridConfigured()) {
    console.log('\n--- 🧪 DEVELOPMENT MODE MOCK EMAIL (OTP) ---');
    console.log(`To: ${to}`);
    console.log(`OTP Code: ${otp}`);
    console.log('---------------------------------------------\n');
    return { success: true };
  }

  try {
    initSendGrid();
    const msg: sgMail.MailDataRequired = {
      to,
      from: FROM,
    subject: `Your Skipli Access Code: ${otp}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #e0e0f0; margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.2); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
          .body { padding: 40px; text-align: center; }
          .body p { color: #a0a0c0; line-height: 1.6; }
          .otp-box { background: rgba(99,102,241,0.15); border: 2px solid rgba(99,102,241,0.4); border-radius: 12px; padding: 24px; margin: 24px 0; }
          .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #818cf8; font-family: 'Courier New', monospace; }
          .expiry { color: #f59e0b; font-size: 13px; margin-top: 8px; }
          .footer { padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
          .footer p { color: #505070; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ Skipli</h1>
          </div>
          <div class="body">
            <p>Hi <strong style="color:#e0e0f0">${name ?? 'there'}</strong>,</p>
            <p>Here is your one-time access code:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">⏱ Expires in ${expiryMinutes} minutes</div>
            </div>
            <p style="font-size: 13px; color: #505070;">Never share this code with anyone, including Skipli staff.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Skipli App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

    await sgMail.send(msg);
    console.log(`📧 OTP email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid send failed. Falling back to console log for development:');
    console.error(error instanceof Error ? error.message : error);
    console.log('\n--- 🧪 DEVELOPMENT MODE MOCK EMAIL (OTP FALLBACK) ---');
    console.log(`To: ${to}`);
    console.log(`OTP Code: ${otp}`);
    console.log('-----------------------------------------------------\n');
    return { success: true };
  }
};
