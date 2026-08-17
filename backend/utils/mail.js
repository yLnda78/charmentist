// Thin wrapper around nodemailer. Works with any SMTP provider — Resend,
// SendGrid, Mailgun, or even a Gmail app password for testing. Configure
// via the SMTP_* variables in .env. If they're not set, emails are just
// logged to the console instead of failing the request — so order
// confirmation still works end-to-end while you're setting email up.
const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter(){
  if(transporter) return transporter;
  if(!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
}

async function sendMail({ to, subject, html }){
  const t = getTransporter();
  if(!t){
    console.log(`[mail:not-configured] Would send to ${to} — "${subject}"`);
    return;
  }
  await t.sendMail({ from: process.env.MAIL_FROM || 'no-reply@example.com', to, subject, html });
}

module.exports = { sendMail };
