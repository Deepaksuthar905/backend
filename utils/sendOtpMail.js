// Optional: nodemailer - if not installed, OTP is only logged to console
let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  nodemailer = null;
}

/**
 * Sends 4-digit OTP to email.
 * If EMAIL_USER & EMAIL_PASS are set in .env, sends via SMTP.
 * Otherwise (or if nodemailer not installed) logs OTP to console (for dev).
 */
async function sendOtpMail(email, otp) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || !nodemailer) {
    console.log("[DEV] OTP (email not configured or nodemailer missing):", { email, otp });
    return { ok: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to: email,
      subject: "Your password reset OTP",
      text: `Your OTP for password reset is: ${otp}. Valid for 10 minutes.`,
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>.</p><p>Valid for 10 minutes.</p>`,
    });
    return { ok: true };
  } catch (mailErr) {
    console.error("Send OTP email failed:", mailErr.message);
    console.log("[DEV] OTP (use this):", { email, otp });
    return { ok: false };
  }
}

module.exports = { sendOtpMail };
