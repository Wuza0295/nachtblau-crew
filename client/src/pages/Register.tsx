import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAndNotify } from "@/lib/localAuthStore";
import { profileSetupPath } from "@/lib/useTradingProfile";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const next = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("next") || profileSetupPath("/marktplatz");
  }, [search]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await registerAndNotify({ name, email, password });
      toast.success("Konto erstellt – bitte Käuferprofil vervollständigen");
      navigate(next.startsWith("/profil") ? next : profileSetupPath(next));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registrierung fehlgeschlagen");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container py-12 max-w-md">
      <Card className="bg-card/80 border-border animate-rise">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-serif text-primary">
            <UserPlus className="h-6 w-6" />
            Registrieren
          </CardTitle>
          <CardDescription>
            Konto anlegen zum Kaufen und Verkaufen. Danach Profil vervollständigen – dann kannst du
            Angebote einstellen, merken und den Warenkorb nutzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Anzeigename</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="bg-secondary/50 border-border"
                placeholder="z. B. PokeFan42"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 border-border"
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
                minLength={8}
                className="bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p>
            </div>
            <Button type="submit" className="w-full font-bold" size="lg" disabled={pending}>
              {pending ? "Wird erstellt…" : "Konto erstellen"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Schon registriert?{" "}
              <Link href={`/anmelden?next=${encodeURIComponent(next)}`} className="text-primary hover:underline">
                Anmelden
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
