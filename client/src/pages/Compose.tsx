import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { POST_TYPES } from "@shared/site";
import type { PostType } from "@shared/social";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Compose() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialType = (params.get("type") as PostType) || "pulse";
  const initialCircle = params.get("circle");

  const [type, setType] = useState<PostType>(initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [circleId, setCircleId] = useState<number | null>(
    initialCircle ? Number(initialCircle) : null
  );

  const { data: circles } = trpc.social.circles.useQuery();
  const create = trpc.social.createPost.useMutation({
    onSuccess: (post) => {
      toast.success("Beitrag veröffentlicht");
      setLocation(`/post/${post.id}`);
    },
    onError: () => toast.error("Konnte nicht speichern"),
  });

  useEffect(() => {
    if (initialType) setType(initialType);
  }, [initialType]);

  const canSubmit = content.trim().length > 0 && (type !== "signal" || title.trim().length > 0);

  return (
    <div className="container py-8 sm:py-12 max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--lyra-teal-deep)]">
          Compose
        </h1>
        <p className="mt-2 text-muted-foreground">
          Einmal schreiben — in jeder Lens sichtbar. Wähle die Form, die zum Gedanken passt.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {POST_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id as PostType)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              type === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {POST_TYPES.find((t) => t.id === type)?.description}
      </p>

      <div className="space-y-4 rounded-2xl border border-border/70 bg-background/80 p-5 sm:p-6">
        {type === "signal" && (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel deines Signals"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 font-display text-xl font-semibold outline-none focus:ring-2 focus:ring-ring"
          />
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === "moment"
              ? "Was passiert genau jetzt?"
              : type === "frame"
                ? "Beschreibe dein Bild oder den Moment…"
                : type === "signal"
                  ? "Entfalte deinen Gedanken…"
                  : "Worüber denkst du nach?"
          }
          rows={type === "signal" ? 10 : 5}
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Circle (optional)
          </label>
          <select
            value={circleId ?? ""}
            onChange={(e) => setCircleId(e.target.value ? Number(e.target.value) : null)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Kein Circle — öffentlicher Stream</option>
            {circles?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!canSubmit || create.isPending}
            onClick={() =>
              create.mutate({
                type,
                content: content.trim(),
                title: title.trim() || undefined,
                circleId,
              })
            }
            className="rounded-full bg-[var(--lyra-ember)] px-6 py-3 text-sm font-bold text-accent-foreground disabled:opacity-50 hover:brightness-105 transition"
          >
            {create.isPending ? "Sendet…" : "Veröffentlichen"}
          </button>
        </div>
      </div>
    </div>
  );
}
