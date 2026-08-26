import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTradingProfile } from "@/lib/useTradingProfile";
import { COUNTRY_OPTIONS } from "@/lib/userProfileStore";
import { fileToCompressedDataUrl } from "@/lib/imageUpload";
import { toast } from "sonner";
import { BadgeCheck, Camera, UserRound } from "lucide-react";

export default function SetupProfile() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const next = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("next") || "/marktplatz";
  }, [search]);

  const { profile, save } = useTradingProfile(user?.id);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "DE");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4 max-w-lg">
        <UserRound className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Profil erforderlich</h1>
        <p className="text-muted-foreground">
          Zum Kaufen brauchst du ein registriertes Konto und ein vollständiges Käuferprofil.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate(`/registrieren?next=${encodeURIComponent("/profil-erstellen?next=" + encodeURIComponent(next))}`)}>
            Registrieren
          </Button>
          <Button variant="outline" onClick={() => navigate(`/anmelden?next=${encodeURIComponent("/profil-erstellen?next=" + encodeURIComponent(next))}`)}>
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  const handleAvatar = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await fileToCompressedDataUrl(file, { maxWidth: 320, quality: 0.78 });
      setAvatarUrl(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Avatar fehlgeschlagen");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      save({ displayName, country, city, avatarUrl: avatarUrl || undefined });
      toast.success("Profil gespeichert – du kannst jetzt kaufen");
      navigate(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || "?").slice(0, 2).toUpperCase();

  return (
    <div className="container py-10 max-w-xl">
      <Card className="bg-card border-border animate-rise">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BadgeCheck className="h-6 w-6 text-primary" />
            Käuferprofil anlegen
          </CardTitle>
          <CardDescription>
            Benutzername und Standort sind Pflicht, bevor du kaufen oder verkaufen kannst.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border border-border">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-primary/15 text-primary text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary">
                  <Camera className="h-4 w-4" />
                  Profilbild hochladen
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="bg-secondary/50 border-border file:mr-3"
                  onChange={(e) => handleAvatar(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Benutzername *</Label>
              <Input
                id="username"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="z. B. CharizardHunter"
                minLength={3}
                maxLength={32}
                required
                className="bg-secondary/50 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Land *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ort / Region *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold" size="lg" disabled={saving}>
              {saving ? "Speichern…" : "Profil speichern & weiter"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Später änderbar unter{" "}
              <Link
                href={`/verkaeufer/${user?.id ?? ""}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                Mein Profil
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
