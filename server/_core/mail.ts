import nodemailer from "nodemailer";
import { ENV } from "./env";

export function isSmtpConfigured(): boolean {
  return Boolean(ENV.smtp.host && ENV.smtp.from);
}

function smtpSecure(): boolean {
  if (ENV.smtp.secure === "true") return true;
  if (ENV.smtp.secure === "false") return false;
  return ENV.smtp.port === 465;
}

/**
 * Verschickt den Bestätigungslink per SMTP.
 * Ohne SMTP_HOST und SMTP_FROM wird nichts versendet; der Aufrufer schreibt den Link ins Log.
 * Variablen: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (oder SMTP_PASS), SMTP_FROM, SMTP_SECURE.
 */
export async function sendVerificationEmail(input: {
  to: string;
  confirmUrl: string;
}): Promise<boolean> {
  if (!isSmtpConfigured()) return false;

  const transporter = nodemailer.createTransport({
    host: ENV.smtp.host,
    port: ENV.smtp.port,
    secure: smtpSecure(),
    auth: ENV.smtp.user
      ? { user: ENV.smtp.user, pass: ENV.smtp.password }
      : undefined,
  });

  await transporter.sendMail({
    from: ENV.smtp.from,
    to: input.to,
    subject: "Bestätige deine E-Mail – NachtBlau Crew",
    text: [
      "Hallo,",
      "",
      "bitte bestätige deine E-Mail-Adresse für die NachtBlau Crew.",
      "Öffne dazu diesen Link:",
      input.confirmUrl,
      "",
      "Der Link ist 24 Stunden gültig und kann nur einmal verwendet werden.",
      "Dein Konto ist erst danach freigeschaltet.",
      "",
      "Wenn du dich nicht registriert hast, kannst du diese Nachricht ignorieren.",
    ].join("\n"),
  });

  return true;
}
