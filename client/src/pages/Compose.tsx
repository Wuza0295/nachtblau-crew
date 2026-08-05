import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FORMATS } from "@shared/site";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Format = "pulse" | "frame" | "depth" | "moment";
type Visibility = "inner" | "orbit" | "horizon" | "public";

export default function Compose() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const spaces = trpc.space.list.useQuery();
  const create = trpc.post.create.useMutation({
    onSuccess: (post) => {
      toast.success("Veröffentlicht");
      setLocation(`/beitrag/${post.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [format, setFormat] = useState<Format>("pulse");
  const [visibility, setVisibility] = useState<Visibility>("orbit");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [spaceId, setSpaceId] = useState<number | undefined>();

  if (!loading && !isAuthenticated) {
    return (
      <div className="container max-w-lg py-24 text-center">
        <h1 className="font-display text-2xl font-bold mb-3">Schreiben</h1>
        <p className="text-muted-foreground mb-6">
          Melde dich an, um zu posten. Der Feed ist auch ohne Login lesbar.
        </p>
        <Button asChild className="rounded-full">
          <a href={getLoginUrl()}>Anmelden</a>
        </Button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      format,
      content,
      title: format === "depth" ? title : undefined,
      mediaUrl: mediaUrl || undefined,
      spaceId: visibility === "horizon" ? spaceId : undefined,
      visibility: format === "moment" ? "inner" : visibility,
    });
  };

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-lg py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2 animate-rise">
          Was willst du teilen?
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Format wählen — dann schreiben. Kein Algorithmus entscheidet über Sichtbarkeit. Du schon.
        </p>

        <form onSubmit={submit} className="space-y-6 animate-rise" style={{ animationDelay: "60ms" }}>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFormat(f.id);
                  if (f.id === "moment") setVisibility("inner");
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm border transition-colors",
                  format === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground -mt-3">
            {FORMATS.find((f) => f.id === format)?.description}
          </p>

          {format === "depth" && (
            <Input
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="font-display text-lg h-12"
            />
          )}

          <Textarea
            placeholder={
              format === "moment"
                ? "Ungeschönt. Jetzt."
                : format === "pulse"
                  ? "Kurzer Gedanke…"
                  : "Schreibe…"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={format === "depth" ? 10 : 5}
            className="text-[15px] leading-relaxed resize-y"
          />

          {(format === "frame" || format === "moment") && (
            <Input
              placeholder="Bild-URL (optional)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              type="url"
            />
          )}

          {format !== "moment" && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Sichtbarkeit
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(
                  [
                    ["inner", "Innenkreis"],
                    ["orbit", "Orbit"],
                    ["horizon", "Raum"],
                    ["public", "Öffentlich / Drift"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVisibility(id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm border",
                      visibility === id
                        ? "bg-secondary border-primary/40 text-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibility === "horizon" && (
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={spaceId ?? ""}
              onChange={(e) => setSpaceId(e.target.value ? Number(e.target.value) : undefined)}
              required
            >
              <option value="">Raum wählen…</option>
              {spaces.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <Button
            type="submit"
            size="lg"
            className="rounded-full w-full sm:w-auto px-8"
            disabled={create.isPending || !content.trim()}
          >
            {create.isPending ? "Sendet…" : "Veröffentlichen"}
          </Button>
        </form>
      </div>
    </div>
  );
}
