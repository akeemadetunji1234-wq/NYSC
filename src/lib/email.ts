import nodemailer from 'nodemailer';

// Brevo SMTP transporter — sends to ANY email, 300/day free, no domain needed
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const FROM_EMAIL = '"CampStay" <akeemadetunji1234@gmail.com>';

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.BREVO_SMTP_KEY) {
    console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
  } catch (error: any) {
    console.error('Brevo SMTP error:', error);
    throw new Error(error.message);
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
  await sendEmail(email, 'Your CampStay Verification Code', html);
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #008A4B;">Reset Your Password</h1>
      <p style="font-size: 16px; color: #333;">Click the button below to reset your CampStay password.</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #008A4B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  await sendEmail(email, 'Reset your CampStay password', html);
}

export async function sendBookingConfirmationEmail(email: string, propertyName: string, date: string, time: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #008A4B;">Booking Confirmed!</h1>
      <p style="font-size: 16px; color: #333;">Your viewing for <strong>${propertyName}</strong> has been scheduled.</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
      </div>
      <p style="font-size: 14px; color: #666;">You can view the full details in your CampStay dashboard.</p>
    </div>
  `;
  await sendEmail(email, `Booking Confirmation: ${propertyName}`, html);
}

export async function sendAgentBookingNotification(email: string, propertyName: string, date: string, time: string, guestName: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #008A4B;">New Booking Request</h1>
      <p style="font-size: 16px; color: #333;">You have a new viewing request for <strong>${propertyName}</strong>.</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Guest:</strong> ${guestName}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
      </div>
      <p style="font-size: 14px; color: #666;">Please log into your agent dashboard to accept or decline this request.</p>
    </div>
  `;
  await sendEmail(email, `New Booking Request: ${propertyName}`, html);
}
