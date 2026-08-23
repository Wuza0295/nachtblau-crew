import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import WebspaceShell from "@/components/webspace/WebspaceShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Globe, Plus, ExternalLink, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isValidWebspaceSlug } from "@shared/webspace";

export default function WebspaceHome() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: config } = trpc.webspace.getConfig.useQuery();
  const { data: sites, isLoading } = trpc.webspace.getMySites.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");

  const createSite = trpc.webspace.createSite.useMutation({
    onSuccess: (result) => {
      toast.success("Seite erstellt!");
      utils.webspace.getMySites.invalidate();
      window.location.href = `/webspace/editor/${result.slug}`;
    },
    onError: (error) => toast.error(error.message),
  });

  const slugPreview = slug.trim().toLowerCase();
  const slugValid = slugPreview ? isValidWebspaceSlug(slugPreview) : false;

  if (authLoading) {
    return (
      <WebspaceShell>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebspaceShell>
    );
  }

  return (
    <WebspaceShell>
      <div className="container max-w-5xl py-12 space-y-10">
        <section className="text-center space-y-4">
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
            nacht-blau.de Unterprojekt
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Deine Seite. Deine Subdomain.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Erstelle mit dem NachtBlau Webspace-Baukasten eine eigene Seite unter{" "}
            <span className="text-primary">name.{config?.baseDomain ?? "nacht-blau.de"}</span>.
          </p>
        </section>

        {!isAuthenticated ? (
          <Card className="max-w-xl mx-auto card-glow">
            <CardContent className="p-8 text-center space-y-4">
              <Globe className="h-10 w-10 mx-auto text-primary" />
              <p className="text-muted-foreground">Melde dich an, um deine Webspace-Seite zu erstellen.</p>
              <a href={getLoginUrl()}>
                <Button className="gap-2">Jetzt anmelden</Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Neue Seite erstellen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      placeholder="mein-clan"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      .{config?.baseDomain ?? "nacht-blau.de"}
                    </span>
                  </div>
                  {slugPreview && !slugValid ? (
                    <p className="text-xs text-destructive">
                      Nur Kleinbuchstaben, Zahlen und Bindestriche (3–32 Zeichen)
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Seitentitel</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mein Clan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Untertitel (optional)</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Gaming Community seit 2024"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!slugValid || title.trim().length < 2 || createSite.isPending}
                  onClick={() =>
                    createSite.mutate({
                      slug: slugPreview,
                      title: title.trim(),
                      tagline: tagline.trim() || undefined,
                    })
                  }
                >
                  {createSite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Seite anlegen"}
                </Button>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Meine Seiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !sites?.length ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Noch keine Seiten – lege links deine erste an.
                  </p>
                ) : (
                  sites.map((site) => (
                    <div
                      key={site.id}
                      className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                    >
                      <div>
                        <div className="font-semibold">{site.title}</div>
                        <div className="text-sm text-muted-foreground">{site.slug}.{config?.baseDomain}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={site.status === "published" ? "default" : "secondary"}>
                            {site.status === "published" ? "Live" : "Entwurf"}
                          </Badge>
                          {site.kasProvisioned ? (
                            <Badge variant="outline" className="border-primary/40 text-primary">
                              KAS aktiv
                            </Badge>
                          ) : site.kasProvisionError ? (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                              KAS ausstehend
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/webspace/editor/${site.slug}`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                            Bearbeiten
                          </Button>
                        </Link>
                        <a href={site.previewUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Vorschau
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </WebspaceShell>
  );
}
