import { useState } from "react";
import { Link, useLocation } from "wouter";
import { EMAIL_NOT_VERIFIED, loginSchema, type ConfirmationDelivery } from "@shared/emailAuth";
import { trpc } from "@/lib/trpc";
import AuthShell from "@/components/AuthShell";
import ConfirmationNotice from "@/components/ConfirmationNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOAuthLoginUrl } from "@/const";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [delivery, setDelivery] = useState<ConfirmationDelivery | null>(null);
  const oauthUrl = getOAuthLoginUrl();

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (error) => {
      if (error.message === EMAIL_NOT_VERIFIED) {
        setNeedsConfirmation(true);
        setFormError(
          "Bitte bestätige zuerst deine E-Mail-Adresse. Dein Konto ist angelegt, aber noch nicht freigeschaltet."
        );
        return;
      }
      setNeedsConfirmation(false);
      setFormError(error.message || "Anmeldung fehlgeschlagen.");
    },
  });

  const resend = trpc.auth.resendConfirmation.useMutation({
    onSuccess: (result) => {
      setDelivery(result);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error.message || "Der Bestätigungslink konnte nicht erneut gesendet werden.");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setDelivery(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setFormError(null);
      setNeedsConfirmation(false);
      return;
    }
    setErrors({});
    setFormError(null);
    login.mutate(parsed.data);
  };

  return (
    <AuthShell
      title="Anmelden"
      subtitle="Melde dich mit E-Mail und Passwort an. Das Konto muss bereits bestätigt sein."
    >
      <form id="login-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">E-Mail</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Passwort</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
        {formError && (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}
        {needsConfirmation && (
          <Button
            id="resend-confirmation"
            type="button"
            variant="outline"
            className="w-full border-primary/40 text-primary hover:bg-primary/10"
            disabled={resend.isPending}
            onClick={() => {
              const parsed = loginSchema.shape.email.safeParse(email);
              if (!parsed.success) {
                setErrors({ email: parsed.error.issues[0]?.message ?? "Bitte eine E-Mail-Adresse eingeben." });
                return;
              }
              resend.mutate({ email: parsed.data });
            }}
          >
            {resend.isPending ? "Wird erstellt…" : "Bestätigungslink erneut senden"}
          </Button>
        )}
        {delivery && (
          <ConfirmationNotice
            delivery={delivery}
            email={email.trim()}
            title="Neuer Bestätigungslink"
          />
        )}
        <Button
          id="login-submit"
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
          disabled={login.isPending}
        >
          {login.isPending ? "Wird angemeldet…" : "Anmelden"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link href="/registrieren" className="font-medium text-primary hover:underline">
          Registrieren
        </Link>
      </p>
      {oauthUrl && (
        <p className="text-center text-sm text-muted-foreground">
          <a href={oauthUrl} className="font-medium text-primary hover:underline">
            Mit dem bisherigen OAuth-Konto anmelden
          </a>
        </p>
      )}
    </AuthShell>
  );
}
