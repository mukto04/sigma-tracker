import { prisma } from '@/lib/prisma';

// Edge-compatible email sender using fetch() instead of nodemailer
// Uses SMTP2GO HTTP API which works in Cloudflare Edge runtime
async function sendEmailViaApi({
  to,
  from,
  fromName,
  subject,
  html,
}: {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.SMTP2GO_API_KEY || process.env.EMAIL_API_KEY || '';

  // Fallback: if no API key, log and skip (email is non-critical for app function)
  if (!apiKey) {
    console.warn('No email API key set (SMTP2GO_API_KEY). Skipping email send.');
    return;
  }

  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      to: [to],
      sender: `${fromName} <${from}>`,
      subject,
      html_body: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email API error: ${text}`);
  }
}

async function getEmailConfig() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['smtp_user', 'smtp_from_name'] } }
  });
  const map: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
  return {
    from: map['smtp_user'] || process.env.SMTP_USER || 'noreply@sigmatrack.app',
    fromName: map['smtp_from_name'] || 'SigmaTrack',
  };
}

export async function sendWelcomeEmail({
  to,
  employeeName,
  companyName,
  loginUrl,
  password,
}: {
  to: string;
  employeeName: string;
  companyName: string;
  loginUrl: string;
  password: string;
}) {
  try {
    const { from, fromName } = await getEmailConfig();
    await sendEmailViaApi({
      to,
      from,
      fromName,
      subject: `Welcome to ${companyName} — Your Login Details`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px 16px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: #eff6ff; border-radius: 12px; padding: 16px 24px; font-size: 28px;">👋</div>
            </div>
            <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
              Welcome to ${companyName}!
            </h1>
            <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
              Hi <strong>${employeeName}</strong>, your account has been created.
            </p>
            <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Login URL</div>
                <a href="${loginUrl}" style="font-size: 14px; color: #2563eb; font-weight: 600; word-break: break-all;">${loginUrl}</a>
              </div>
              <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Email</div>
                <div style="font-size: 14px; color: #0f172a; font-weight: 600;">${to}</div>
              </div>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Temporary Password</div>
                <div style="font-size: 16px; color: #0f172a; font-weight: 800; letter-spacing: 0.08em; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;">
                  ${password}
                </div>
              </div>
            </div>
            <div style="background: #fef9c3; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px;">
              <p style="margin: 0; font-size: 13px; color: #854d0e;">⚠️ Please change your password after your first login.</p>
            </div>
            <a href="${loginUrl}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none;">
              Login to Dashboard →
            </a>
            <p style="text-align: center; margin: 24px 0 0; font-size: 12px; color: #94a3b8;">
              Sent by ${companyName} · Powered by SigmaTrack
            </p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendPasswordResetEmail({
  to,
  employeeName,
  companyName,
  loginUrl,
  newPassword,
}: {
  to: string;
  employeeName: string;
  companyName: string;
  loginUrl: string;
  newPassword: string;
}) {
  try {
    const { from, fromName } = await getEmailConfig();
    await sendEmailViaApi({
      to,
      from,
      fromName,
      subject: `Password Reset — ${companyName}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px 16px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background: #fef3c7; border-radius: 12px; padding: 16px 24px; font-size: 28px;">🔑</div>
            </div>
            <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center;">
              Password Reset
            </h1>
            <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
              Hi <strong>${employeeName}</strong>, your password has been reset by your administrator.
            </p>
            <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Email</div>
                <div style="font-size: 14px; color: #0f172a; font-weight: 600;">${to}</div>
              </div>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">New Password</div>
                <div style="font-size: 18px; color: #0f172a; font-weight: 800; letter-spacing: 0.08em; background: white; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;">
                  ${newPassword}
                </div>
              </div>
            </div>
            <div style="background: #fef9c3; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px;">
              <p style="margin: 0; font-size: 13px; color: #854d0e;">⚠️ Please change your password after logging in.</p>
            </div>
            <a href="${loginUrl}" style="display: block; text-align: center; background: #d97706; color: white; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none;">
              Login Now →
            </a>
            <p style="text-align: center; margin: 24px 0 0; font-size: 12px; color: #94a3b8;">
              Sent by ${companyName} · Powered by SigmaTrack
            </p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: String(error) };
  }
}
