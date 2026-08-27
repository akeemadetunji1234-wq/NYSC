import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "./prisma";

const configuredKey = process.env.BREVO_SMTP_KEY?.trim();
const explicitApiKey = process.env.BREVO_API_KEY?.trim();

// Brevo API keys use the xkeysib- prefix. If an API key was previously stored
// under BREVO_SMTP_KEY, recognize it and route it to the HTTPS API instead of
// sending it to the SMTP AUTH endpoint, which returns 535 for API keys.
const brevoApiKey = explicitApiKey || (configuredKey?.startsWith("xkeysib-") ? configuredKey : undefined);
const brevoSmtpKey = configuredKey && !configuredKey.startsWith("xkeysib-") ? configuredKey : undefined;
const brevoSmtpLogin = process.env.BREVO_SMTP_LOGIN?.trim();
const isProduction = process.env.NODE_ENV === "production";

const fromEmail = (process.env.BREVO_FROM_EMAIL || "akeemadetunji1234@gmail.com").trim();
const fromName = (process.env.BREVO_FROM_NAME || "Neat & Affordable").trim();
const fromHeader = `"${fromName.replace(/"/g, "")}" <${fromEmail}>`;

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] || character);
}

let smtpTransporter: Transporter | null = null;
if (brevoSmtpLogin && brevoSmtpKey) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST?.trim() || "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: brevoSmtpLogin,
      pass: brevoSmtpKey,
    },
  });
}

export const isEmailConfigured = Boolean(brevoApiKey || smtpTransporter);

async function sendViaBrevoApi(to: string, subject: string, html: string) {
  if (!brevoApiKey) return false;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const providerMessage = (await response.text()).slice(0, 500);
    console.error("Brevo API error:", { status: response.status, providerMessage });
    throw new Error(`Brevo API rejected the email request (${response.status}).`);
  }

  return true;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (await sendViaBrevoApi(to, subject, html)) return;

  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({ from: fromHeader, to, subject, html });
      return;
    } catch (error: any) {
      console.error("Brevo SMTP error:", error);
      throw new Error(error?.message || "Brevo SMTP delivery failed.");
    }
  }

  if (!isProduction) {
    console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
    return;
  }

  throw new Error("Email provider is not configured for production.");
}

export async function sendNotificationEmail({
  notificationId,
  to,
  subject,
  html,
}: {
  notificationId: string;
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { emailDeliveryAttempts: { increment: 1 }, lastEmailError: null },
    });
    await sendEmail(to, subject, html);
    await prisma.notification.update({
      where: { id: notificationId },
      data: { emailDeliveredAt: new Date(), lastEmailError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error";
    await prisma.notification.update({
      where: { id: notificationId },
      data: { lastEmailError: message.slice(0, 1000) },
    }).catch((updateError) => console.error("Failed to record email delivery error:", updateError));
    throw error;
  }
}

export async function sendEmailOtp(email: string, code: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
      <h1 style="color: #008A4B;">Verify Your Email</h1>
      <p style="font-size: 16px; color: #333;">Enter the following 6-digit code to verify your account.</p>
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 12px; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #008A4B;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendEmail(email, "Your Neat & Affordable Verification Code", html);
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #008A4B;">Reset Your Password</h1>
      <p style="font-size: 16px; color: #333;">Click the button below to reset your Neat & Affordable password.</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #008A4B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  await sendEmail(email, "Reset your password", html);
}

export async function sendBookingConfirmationEmail(email: string, propertyName: string, date: string, time: string, notificationId?: string) {
  if (!email?.trim()) return;
  const safePropertyName = escapeHtml(propertyName);
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(time);
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #008A4B;">Booking Confirmed!</h1>
      <p style="font-size: 16px; color: #333;">Your viewing for <strong>${safePropertyName}</strong> has been scheduled.</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Date:</strong> ${safeDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${safeTime}</p>
      </div>
      <p style="font-size: 14px; color: #666;">You can view the full details in your dashboard.</p>
    </div>
  `;
  const subject = `Booking Confirmation: ${propertyName}`;
  if (notificationId) await sendNotificationEmail({ notificationId, to: email, subject, html });
  else await sendEmail(email, subject, html);
}

export async function sendSavedSearchMatchEmail({
  to,
  searchName,
  propertyTitle,
  state,
  price,
  bedrooms,
  listingLink,
  notificationId,
}: {
  to: string;
  searchName: string;
  propertyTitle: string;
  state: string;
  price: number;
  bedrooms: number;
  listingLink: string;
  notificationId?: string;
}) {
  if (!to?.trim()) return;
  const safeSearchName = escapeHtml(searchName);
  const safePropertyTitle = escapeHtml(propertyTitle);
  const safeState = escapeHtml(state);
  const safePrice = escapeHtml(`₦${Math.round(price).toLocaleString("en-NG")}`);
  const safeBedrooms = escapeHtml(String(bedrooms));
  const baseUrl = (process.env.NEXTAUTH_URL || "https://nysc-mu.vercel.app").replace(/\/$/, "");
  const safeListingLink = escapeHtml(new URL(listingLink, `${baseUrl}/`).toString());
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h1 style="color: #008A4B;">A new listing matches your saved search</h1>
      <p style="font-size: 16px;">Your saved search <strong>${safeSearchName}</strong> found a new match.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 5px 0;"><strong>Property:</strong> ${safePropertyTitle}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${safeState}</p>
        <p style="margin: 5px 0;"><strong>Price:</strong> ${safePrice}</p>
        <p style="margin: 5px 0;"><strong>Bedrooms:</strong> ${safeBedrooms}</p>
      </div>
      <p><a href="${safeListingLink}" style="background-color: #008A4B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View listing</a></p>
      <p style="font-size: 13px; color: #6b7280;">You can manage saved-search alerts from your dashboard.</p>
    </div>
  `;
  const subject = `New listing matches your search: ${propertyTitle}`;
  if (notificationId) await sendNotificationEmail({ notificationId, to, subject, html });
  else await sendEmail(to, subject, html);
}

export async function sendPremiumExpiryReminderEmail({
  to,
  planLabel,
  amount,
  expiryDate,
  daysRemaining,
  renewalLink,
}: {
  to: string;
  planLabel: string;
  amount: string;
  expiryDate: string;
  daysRemaining: number;
  renewalLink: string;
}) {
  const safePlanLabel = escapeHtml(planLabel);
  const safeAmount = escapeHtml(amount);
  const safeExpiryDate = escapeHtml(expiryDate);
  const baseUrl = (process.env.NEXTAUTH_URL || "https://nysc-mu.vercel.app").replace(/\/$/, "");
  const safeRenewalLink = escapeHtml(new URL(renewalLink, `${baseUrl}/`).toString());
  const timing = daysRemaining <= 1 ? "tomorrow" : `in about ${daysRemaining} days`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <h1 style="color: #008A4B;">Your premium access is expiring soon</h1>
      <p style="font-size: 16px;">Your <strong>${safePlanLabel}</strong> access expires ${timing}, on <strong>${safeExpiryDate}</strong>.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 4px 0;"><strong>Annual renewal price:</strong> ₦${safeAmount}</p>
        <p style="margin: 4px 0;">This is a one-time annual payment. Contact an administrator through an approved support channel before your access expires.</p>
      </div>
      <p><a href="${safeRenewalLink}" style="background-color: #008A4B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View premium details</a></p>
      <p style="font-size: 13px; color: #6b7280;">Do not send money using unverified account details.</p>
    </div>
  `;
  await sendEmail(to, `${planLabel} expires soon`, html);
}

export async function sendAgentBookingNotification(email: string, propertyName: string, date: string, time: string, guestName: string, notificationId?: string) {
  if (!email?.trim()) return;
  const safePropertyName = escapeHtml(propertyName);
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(time);
  const safeGuestName = escapeHtml(guestName);
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #008A4B;">New Booking Request</h1>
      <p style="font-size: 16px; color: #333;">You have a new viewing request for <strong>${safePropertyName}</strong>.</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Guest:</strong> ${safeGuestName}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${safeDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${safeTime}</p>
      </div>
      <p style="font-size: 14px; color: #666;">Please log into your agent dashboard to accept or decline this request.</p>
    </div>
  `;
  const subject = `New Booking Request: ${propertyName}`;
  if (notificationId) await sendNotificationEmail({ notificationId, to: email, subject, html });
  else await sendEmail(email, subject, html);
}
