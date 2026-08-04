import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { loginAndNotify } from "@/lib/localAuthStore";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const next = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("next") || "/marktplatz";
  }, [search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await loginAndNotify({ email, password });
      toast.success("Angemeldet");
      navigate(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container py-12 max-w-md">
      <Card className="bg-card/80 border-border animate-rise">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-serif text-primary">
            <LogIn className="h-6 w-6" />
            Anmelden
          </CardTitle>
          <CardDescription>
            Mit deinem Käuferkonto oder Admin-Zugang anmelden. Kauf nur für registrierte Nutzer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 border-border"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50 border-border"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full font-bold" size="lg" disabled={pending}>
              {pending ? "…" : "Anmelden"}
            </Button>
            {isOAuthConfigured() && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                Mit OAuth anmelden
              </Button>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Noch kein Konto?{" "}
              <Link
                href={`/registrieren?next=${encodeURIComponent(next)}`}
                className="text-primary hover:underline"
              >
                Registrieren
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
