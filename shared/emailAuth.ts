import { z } from "zod";

/** Bestätigungslinks gelten 24 Stunden und nur einmal. */
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Stabiler Fehlercode, den die Oberfläche auf Deutsch erklärt. */
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Bitte einen Namen eingeben.")
  .min(2, "Der Name muss mindestens 2 Zeichen lang sein.")
  .max(64, "Der Name darf höchstens 64 Zeichen lang sein.");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Bitte eine E-Mail-Adresse eingeben.")
  .email("Bitte eine gültige E-Mail-Adresse eingeben.")
  .max(320, "Die E-Mail-Adresse ist zu lang.");

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(1, "Bitte ein Passwort eingeben.")
      .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.")
      .max(128, "Das Passwort darf höchstens 128 Zeichen lang sein."),
    passwordConfirm: z.string().min(1, "Bitte das Passwort wiederholen."),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte ein Passwort eingeben."),
});

export const confirmEmailSchema = z.object({
  token: z.string().trim().min(1, "Der Bestätigungslink ist ungültig oder abgelaufen."),
});

export const resendConfirmationSchema = z.object({
  email: emailSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type ConfirmationDelivery = {
  pendingConfirmation: true;
  emailSent: boolean;
  devConfirmationUrl: string | null;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.";
}
