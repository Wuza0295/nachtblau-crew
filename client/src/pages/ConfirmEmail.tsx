import { confirmEmailSchema } from "@shared/emailAuth";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { crewConfirm } from "@/lib/crewAuth";

export default function ConfirmEmail() {
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    const parsed = confirmEmailSchema.safeParse({ token });
    if (!parsed.success) {
      setDone(false);
      setMessage(parsed.error.issues[0]?.message ?? "Der Bestätigungslink ist ungültig oder abgelaufen.");
      return;
    }

    let cancelled = false;
    void crewConfirm(parsed.data.token)
      .then((result) => {
        if (cancelled) return;
        setDone(true);
        setMessage(
          result.alreadyConfirmed
            ? "Diese E-Mail-Adresse war schon bestätigt. Du kannst dich anmelden."
            : "Deine E-Mail-Adresse ist bestätigt. Du kannst dich jetzt anmelden."
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDone(false);
        setMessage(error instanceof Error ? error.message : "Der Bestätigungslink ist ungültig oder abgelaufen.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthShell title="E-Mail bestätigen" subtitle="Der Link gilt 24 Stunden und nur einmal. Danach ist das Konto freigeschaltet.">
      <div className="space-y-4 text-center">
        {!message && <p className="text-sm text-muted-foreground">Bestätigung wird geprüft…</p>}
        {message && (
          <p id="confirm-result" className={done ? "text-sm text-foreground" : "text-sm text-destructive"} role="status">
            {message}
          </p>
        )}
        <Link href="/anmelden">
          <Button id="confirm-to-login" className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
            Zur Anmeldung
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
