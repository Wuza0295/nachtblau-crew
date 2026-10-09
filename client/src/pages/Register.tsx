import { useState } from "react";
import { Link } from "wouter";
import { registerSchema, type ConfirmationDelivery } from "@shared/emailAuth";
import AuthShell from "@/components/AuthShell";
import ConfirmationNotice from "@/components/ConfirmationNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crewRegister } from "@/lib/crewAuth";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<ConfirmationDelivery | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, password, passwordConfirm });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    try {
      const result = await crewRegister(parsed.data);
      setDelivery(result);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Registrierung fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Registrieren"
      subtitle="Lege ein Konto an. Es ist erst nutzbar, wenn du die E-Mail bestätigt hast."
    >
      {delivery ? (
        <div className="space-y-4">
          <ConfirmationNotice delivery={delivery} email={email.trim()} />
          <Link href="/anmelden">
            <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
              Zur Anmeldung
            </Button>
          </Link>
        </div>
      ) : (
        <form id="register-form" className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="register-name">Name</Label>
            <Input
              id="register-name"
              autoComplete="name"
              value={name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => setName(event.target.value)}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">E-Mail</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Passwort</Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={Boolean(errors.password)}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password-confirm">Passwort wiederholen</Label>
            <Input
              id="register-password-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              aria-invalid={Boolean(errors.passwordConfirm)}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
            {errors.passwordConfirm && <p className="text-sm text-destructive">{errors.passwordConfirm}</p>}
          </div>
          {formError && (
            <p id="register-error" className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}
          <Button
            id="register-submit"
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
            disabled={pending}
          >
            {pending ? "Wird angelegt…" : "Konto anlegen"}
          </Button>
        </form>
      )}
      {!delivery && (
        <p className="text-center text-sm text-muted-foreground">
          Schon ein Konto?{" "}
          <Link href="/anmelden" className="font-medium text-primary hover:underline">
            Anmelden
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
