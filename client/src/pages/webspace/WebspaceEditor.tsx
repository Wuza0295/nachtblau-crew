import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Loader2, Save, Rocket, Eye, ArrowLeft, Plus, Trash2 } from "lucide-react";
import WebspaceShell from "@/components/webspace/WebspaceShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import type { WebspaceBlock, WebspaceTheme } from "@shared/webspace";

export default function WebspaceEditor() {
  const { slug = "" } = useParams<{ slug: string }>();
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.webspace.getSiteForEdit.useQuery(
    { slug },
    { enabled: Boolean(slug) }
  );

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [theme, setTheme] = useState<WebspaceTheme>("midnight");
  const [blocks, setBlocks] = useState<WebspaceBlock[]>([]);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setTagline(data.tagline ?? "");
    setTheme(data.theme);
    setBlocks(data.blocks);
  }, [data]);

  const saveSite = trpc.webspace.saveSite.useMutation({
    onSuccess: () => {
      toast.success("Gespeichert");
      utils.webspace.getSiteForEdit.invalidate({ slug });
      utils.webspace.getMySites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const publishSite = trpc.webspace.publishSite.useMutation({
    onSuccess: (result) => {
      if (result.kasWarning) {
        toast.warning(`Veröffentlicht, aber KAS-Hinweis: ${result.kasWarning}`);
      } else {
        toast.success("Seite ist live!");
      }
      utils.webspace.getSiteForEdit.invalidate({ slug });
      utils.webspace.getMySites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateBlock = (id: string, patch: Partial<WebspaceBlock>) => {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? ({ ...block, ...patch } as WebspaceBlock) : block))
    );
  };

  const addTextBlock = () => {
    setBlocks((current) => [
      ...current,
      { id: nanoid(8), type: "text", content: "Neuer Textblock" },
    ]);
  };

  const addLinksBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: nanoid(8),
        type: "links",
        heading: "Links",
        items: [{ label: "Beispiel", url: "https://nacht-blau.de" }],
      },
    ]);
  };

  const removeBlock = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
  };

  if (isLoading) {
    return (
      <WebspaceShell>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WebspaceShell>
    );
  }

  if (error || !data) {
    return (
      <WebspaceShell>
        <div className="container py-20 text-center text-muted-foreground">
          Seite nicht gefunden oder keine Berechtigung.
        </div>
      </WebspaceShell>
    );
  }

  return (
    <WebspaceShell>
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/webspace">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          </Link>
          <div className="flex flex-wrap gap-2">
            <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Vorschau
              </Button>
            </a>
            <Button
              variant="outline"
              className="gap-2"
              disabled={saveSite.isPending}
              onClick={() =>
                saveSite.mutate({
                  slug,
                  title,
                  tagline,
                  theme,
                  blocks,
                })
              }
            >
              {saveSite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Speichern
            </Button>
            <Button
              className="gap-2"
              disabled={publishSite.isPending}
              onClick={() => publishSite.mutate({ slug })}
            >
              {publishSite.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Veröffentlichen
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="card-glow h-fit">
            <CardHeader>
              <CardTitle>Seiten-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <Input value={`${data.slug}.nacht-blau.de`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Untertitel</Label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Design</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as WebspaceTheme)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midnight">Midnight</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="clean">Clean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.kasProvisionError ? (
                <p className="text-xs text-amber-400">{data.kasProvisionError}</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addTextBlock} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Text
              </Button>
              <Button variant="outline" size="sm" onClick={addLinksBlock} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Links
              </Button>
            </div>

            {blocks.map((block) => (
              <Card key={block.id} className="card-glow">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-base capitalize">{block.type}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBlock(block.id)}
                    disabled={blocks.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {block.type === "hero" ? (
                    <>
                      <Input
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Titel"
                      />
                      <Input
                        value={block.subtitle}
                        onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                        placeholder="Untertitel"
                      />
                      <Input
                        value={block.imageUrl ?? ""}
                        onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value || undefined })}
                        placeholder="Bild-URL (optional)"
                      />
                    </>
                  ) : null}

                  {block.type === "text" ? (
                    <Textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      rows={5}
                    />
                  ) : null}

                  {block.type === "links" ? (
                    <>
                      <Input
                        value={block.heading ?? ""}
                        onChange={(e) => updateBlock(block.id, { heading: e.target.value })}
                        placeholder="Überschrift"
                      />
                      {block.items.map((item, index) => (
                        <div key={index} className="grid gap-2 sm:grid-cols-2">
                          <Input
                            value={item.label}
                            onChange={(e) => {
                              const items = [...block.items];
                              items[index] = { ...items[index], label: e.target.value };
                              updateBlock(block.id, { items });
                            }}
                            placeholder="Label"
                          />
                          <Input
                            value={item.url}
                            onChange={(e) => {
                              const items = [...block.items];
                              items[index] = { ...items[index], url: e.target.value };
                              updateBlock(block.id, { items });
                            }}
                            placeholder="https://..."
                          />
                        </div>
                      ))}
                    </>
                  ) : null}

                  {block.type === "image" ? (
                    <>
                      <Input
                        value={block.url}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Bild-URL"
                      />
                      <Input
                        value={block.caption ?? ""}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder="Bildunterschrift"
                      />
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </WebspaceShell>
  );
}
