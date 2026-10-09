import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";

export default function ConfirmEmail() {
  const search = useSearch();
  const fromWindow = typeof window === "undefined" ? "" : window.location.search;
  const rawSearch = search || fromWindow;
  const token = new URLSearchParams(rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch).get("token") ?? "";
  const [message, setMessage] = useState<string | null>(token ? null : "Der Bestätigungslink ist ungültig oder abgelaufen.");
  const [done, setDone] = useState(false);

  const confirm = trpc.auth.confirmEmail.useMutation({
    onSuccess: (result) => {
      setDone(true);
      setMessage(
        result.alreadyConfirmed
          ? "Diese E-Mail-Adresse war bereits bestätigt. Du kannst dich jetzt anmelden."
          : "Deine E-Mail-Adresse ist bestätigt. Du kannst dich jetzt anmelden."
      );
    },
    onError: (error) => {
      setDone(false);
      setMessage(error.message || "Der Bestätigungslink ist ungültig oder abgelaufen.");
    },
  });

  useEffect(() => {
    if (!token || confirm.isSuccess || confirm.isPending || confirm.isError) return;
    confirm.mutate({ token });
    // Der Token wird einmal eingelöst. Ein erneuter Aufruf bleibt für dasselbe Konto erfolgreich.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell
      title="E-Mail bestätigen"
      subtitle="Erst nach diesem Schritt ist dein Konto freigeschaltet."
    >
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
