/**
 * OTP Delivery Service — SMS + Email, multi-provider with automatic fallback
 *
 * SMS providers (set OTP_PROVIDER env var):
 *   1. fast2sms  — cheapest Indian SMS (~₹0.05-0.12/msg). Set: FAST2SMS_API_KEY
 *   2. msg91     — reliable Indian SMS (~₹0.20-0.25/msg). Set: MSG91_AUTH_KEY + MSG91_TEMPLATE_ID
 *   3. twilio    — global fallback (~₹0.65/msg). Set: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 *
 * Email OTP (set EMAIL_OTP_PROVIDER env var):
 *   1. resend    — 3,000 emails/month FREE. Set: RESEND_API_KEY + EMAIL_FROM
 *   2. sendgrid  — 100 emails/day free. Set: SENDGRID_API_KEY + EMAIL_FROM
 *   3. smtp      — any SMTP (Gmail, etc). Set: SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS
 *
 * In development/test: OTP is logged to console only (no messages sent).
 *
 * DLT Note (India): All commercial SMS requires DLT registration with TRAI.
 * Fast2SMS and MSG91 both guide you through this. Expect 1-3 weeks for approval.
 * Until DLT is approved, use Twilio (no DLT needed) or dev console mode.
 */
import axios from 'axios';
import { logger } from '@nirmalmandi/shared';

const OTP_PROVIDER = process.env.OTP_PROVIDER ?? 'fast2sms'; // fast2sms | msg91 | twilio

// ── Fast2SMS ─────────────────────────────────────────────────────────────────
// Sign up free at https://www.fast2sms.com — get 50 free SMS on signup
// API key: https://www.fast2sms.com/dashboard/developer → API Key

async function sendViaFast2SMS(phone: string, otp: string): Promise<void> {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) throw new Error('FAST2SMS_API_KEY not set');

  const res = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route: 'otp',           // OTP route is cheapest
      variables_values: otp,
      numbers: phone,
    },
    {
      headers: { authorization: key },
      timeout: 8000,
    }
  );

  if (!res.data?.return) {
    throw new Error(`Fast2SMS error: ${JSON.stringify(res.data?.message ?? res.data)}`);
  }
}

// ── MSG91 ─────────────────────────────────────────────────────────────────────
// Sign up at https://msg91.com — ₹50 free credit on signup
// Requires DLT-approved template. Use template variables: {{otp}}
// Set: MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID (default: NRMNDM)

async function sendViaMSG91(phone: string, otp: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) throw new Error('MSG91_AUTH_KEY or MSG91_TEMPLATE_ID not set');

  const senderId = process.env.MSG91_SENDER_ID ?? 'NRMNDM';

  const res = await axios.post(
    'https://api.msg91.com/api/v5/otp',
    {
      mobile: `91${phone}`,
      authkey: authKey,
      template_id: templateId,
      otp,
      sender: senderId,
    },
    { timeout: 8000 }
  );

  if (res.data?.type !== 'success') {
    throw new Error(`MSG91 error: ${JSON.stringify(res.data)}`);
  }
}

// ── Twilio ────────────────────────────────────────────────────────────────────
// $15 free credit on signup: https://www.twilio.com
// No DLT required. More expensive but globally reliable.

async function sendViaTwilio(phone: string, otp: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) throw new Error('Twilio credentials not set');

  const twilio = require('twilio');
  const client = twilio(sid, token);
  await client.messages.create({
    body: `Your NirmalMandi OTP is ${otp}. Valid 2 min. Do not share.`,
    from,
    to: `+91${phone}`,
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function sendOtp(phone: string, otp: string): Promise<void> {
  // Dev / test: log to console, never send real SMS
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV] OTP for ${phone.slice(0, 4)}****${phone.slice(-2)}: ${otp}`);
    return;
  }

  const providers: Array<{ name: string; fn: () => Promise<void> }> = [];

  // Build priority list based on OTP_PROVIDER env var
  if (OTP_PROVIDER === 'fast2sms') {
    providers.push(
      { name: 'fast2sms', fn: () => sendViaFast2SMS(phone, otp) },
      { name: 'msg91',    fn: () => sendViaMSG91(phone, otp) },
      { name: 'twilio',   fn: () => sendViaTwilio(phone, otp) },
    );
  } else if (OTP_PROVIDER === 'msg91') {
    providers.push(
      { name: 'msg91',    fn: () => sendViaMSG91(phone, otp) },
      { name: 'fast2sms', fn: () => sendViaFast2SMS(phone, otp) },
      { name: 'twilio',   fn: () => sendViaTwilio(phone, otp) },
    );
  } else {
    providers.push(
      { name: 'twilio',   fn: () => sendViaTwilio(phone, otp) },
      { name: 'msg91',    fn: () => sendViaMSG91(phone, otp) },
    );
  }

  for (const provider of providers) {
    try {
      await provider.fn();
      logger.info(`OTP sent via ${provider.name}`, { phone: phone.slice(0, 4) + '****' });
      return; // success — stop trying
    } catch (err) {
      logger.warn(`OTP via ${provider.name} failed, trying next provider`, {
        error: (err as Error).message,
      });
    }
  }

  // All providers failed
  logger.error('All OTP providers failed', { phone: phone.slice(0, 4) + '****' });
  throw new Error('Unable to send OTP. Please try again in a moment.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL OTP
// ═══════════════════════════════════════════════════════════════════════════════

const EMAIL_PROVIDER = process.env.EMAIL_OTP_PROVIDER ?? 'resend'; // resend | sendgrid | smtp
const EMAIL_FROM     = process.env.EMAIL_FROM ?? 'NirmalMandi <noreply@nirmalmandi.com>';
const APP_NAME       = 'NirmalMandi';

function buildOtpEmailHtml(otp: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:'Segoe UI',sans-serif;background:#fbf5ea;margin:0;padding:32px 0">
  <div style="max-width:480px;margin:0 auto;background:#fffdf8;border:1px solid #ece1cd;border-radius:18px;overflow:hidden">
    <div style="background:#14492a;padding:28px 32px">
      <span style="font-size:22px;font-weight:800;color:#fff">Nirmal<span style="color:#f4a82a">Mandi</span></span>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;font-size:16px;color:#281f12;font-weight:600">Your sign-in OTP</p>
      <p style="margin:0 0 24px;font-size:14px;color:#7a6f5d">Use this code to sign in to NirmalMandi. It expires in 2 minutes.</p>
      <div style="background:#e9f4ec;border:1px solid #1f6b3a22;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1f6b3a;font-family:monospace">${otp}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#a89c87">If you didn't request this, ignore this email. Your account is safe.</p>
    </div>
    <div style="background:#f6efe1;padding:16px 32px;font-size:12px;color:#a89c87;text-align:center">
      © 2026 NirmalMandi · India's B2B Dead Inventory Marketplace
    </div>
  </div>
</body>
</html>`;
}

// ── Resend (recommended — 3,000 emails/month free) ───────────────────────────
// Sign up at https://resend.com → API Keys → Create key
// Add your domain or use resend's sandbox for testing

async function sendViaResend(email: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const res = await axios.post(
    'https://api.resend.com/emails',
    {
      from: EMAIL_FROM,
      to:   [email],
      subject: `${otp} is your ${APP_NAME} OTP`,
      html: buildOtpEmailHtml(otp),
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 8000,
    }
  );

  if (res.data?.id == null) {
    throw new Error(`Resend error: ${JSON.stringify(res.data)}`);
  }
}

// ── SendGrid (100 emails/day free) ────────────────────────────────────────────
// Sign up at https://sendgrid.com → Settings → API Keys

async function sendViaSendGrid(email: string, otp: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not set');

  const res = await axios.post(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email }] }],
      from: { email: (EMAIL_FROM.match(/<(.+)>/) ?? [, EMAIL_FROM])[1] },
      subject: `${otp} is your ${APP_NAME} OTP`,
      content: [{ type: 'text/html', value: buildOtpEmailHtml(otp) }],
    },
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 8000,
    }
  );

  if (res.status !== 202) throw new Error(`SendGrid returned ${res.status}`);
}

// ── SMTP (Gmail / any SMTP) ───────────────────────────────────────────────────
// Set: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// For Gmail: use App Password (not account password) + SMTP_HOST=smtp.gmail.com SMTP_PORT=587

async function sendViaSMTP(email: string, otp: string): Promise<void> {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from:    EMAIL_FROM,
    to:      email,
    subject: `${otp} is your ${APP_NAME} OTP`,
    html:    buildOtpEmailHtml(otp),
  });
}

// ── Main email OTP export ─────────────────────────────────────────────────────

export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Email OTP for ${email.replace(/(.{2}).+(@.+)/, '$1***$2')}: ${otp}`);
    return;
  }

  const providers: Array<{ name: string; fn: () => Promise<void> }> = [];

  if (EMAIL_PROVIDER === 'resend') {
    providers.push(
      { name: 'resend',    fn: () => sendViaResend(email, otp) },
      { name: 'sendgrid',  fn: () => sendViaSendGrid(email, otp) },
      { name: 'smtp',      fn: () => sendViaSMTP(email, otp) },
    );
  } else if (EMAIL_PROVIDER === 'sendgrid') {
    providers.push(
      { name: 'sendgrid',  fn: () => sendViaSendGrid(email, otp) },
      { name: 'resend',    fn: () => sendViaResend(email, otp) },
      { name: 'smtp',      fn: () => sendViaSMTP(email, otp) },
    );
  } else {
    providers.push(
      { name: 'smtp',      fn: () => sendViaSMTP(email, otp) },
      { name: 'resend',    fn: () => sendViaResend(email, otp) },
    );
  }

  for (const provider of providers) {
    try {
      await provider.fn();
      logger.info(`Email OTP sent via ${provider.name}`, { email: email.replace(/(.{2}).+(@.+)/, '$1***$2') });
      return;
    } catch (err) {
      logger.warn(`Email OTP via ${provider.name} failed, trying next`, { error: (err as Error).message });
    }
  }

  logger.error('All email OTP providers failed', { email });
  throw new Error('Unable to send email OTP. Please try again.');
}
