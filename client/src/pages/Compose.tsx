import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { MiraShell } from "@/components/mira/MiraShell";
import type { PostKind } from "@shared/mira";
import { Camera, Type, Waves, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS: {
  id: PostKind;
  label: string;
  blurb: string;
  icon: typeof Type;
}[] = [
  {
    id: "signal",
    label: "Signal",
    blurb: "Gedanke / Thread – wie X & Threads",
    icon: Type,
  },
  {
    id: "frame",
    label: "Frame",
    blurb: "Bild mit Kontext – wie Instagram",
    icon: Camera,
  },
  {
    id: "pulse",
    label: "Pulse",
    blurb: "Kurzer Clip – wie TikTok",
    icon: Waves,
  },
  {
    id: "truth",
    label: "Truth",
    blurb: "Authentisch jetzt – wie BeReal",
    icon: Sun,
  },
];

export default function ComposePage() {
  const [, setLoc] = useLocation();
  const utils = trpc.useUtils();
  const circles = trpc.mira.circles.useQuery();
  const create = trpc.mira.createPost.useMutation({
    onSuccess: () => {
      utils.mira.feed.invalidate();
      setLoc("/app");
    },
  });
  const [kind, setKind] = useState<PostKind>("signal");
  const [body, setBody] = useState("");
  const [facet, setFacet] = useState<"personal" | "craft" | "public">(
    "personal"
  );
  const [circleId, setCircleId] = useState<string>("");
  const [tags, setTags] = useState("");

  return (
    <MiraShell>
      <div className="max-w-xl mx-auto fade-up">
        <h1 className="font-display text-3xl font-700 tracking-tight mb-2">
          Neu
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Ein Format wählen. Facet setzen. Absicht behalten.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {KINDS.map((k) => {
            const Icon = k.icon;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={cn(
                  "text-left rounded-2xl p-3 border transition-all",
                  kind === k.id
                    ? "border-[var(--mira-jade)] bg-[var(--mira-jade)]/10"
                    : "border-border/60 glass hover:bg-secondary/50"
                )}
              >
                <Icon className="size-4 text-[var(--mira-jade)] mb-2" />
                <div className="font-medium text-sm">{k.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {k.blurb}
                </div>
              </button>
            );
          })}
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            create.mutate({
              kind,
              body: body.trim(),
              facet,
              circleId: circleId || undefined,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              mediaUrl:
                kind === "frame" || kind === "pulse" || kind === "truth"
                  ? `https://images.unsplash.com/photo-${
                      kind === "truth" ? 1556911220 : 1469474968028
                    }?auto=format&fit=crop&w=900&h=1100&q=80`
                  : undefined,
            });
          }}
        >
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              kind === "truth"
                ? "Was siehst du gerade – ungefiltert?"
                : kind === "signal"
                  ? "Was bewegt dich?"
                  : "Beschreibung…"
            }
            rows={5}
            className="w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-[var(--mira-jade)]/30 outline-none"
          />

          <div className="flex flex-wrap gap-2">
            {(["personal", "craft", "public"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFacet(f)}
                className={cn(
                  "text-xs uppercase tracking-wider px-3 py-1.5 rounded-full",
                  facet === f
                    ? "bg-[var(--mira-ink)] text-white"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={circleId}
            onChange={(e) => setCircleId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Kein Circle</option>
            {circles.data
              ?.filter((c) => c.joined)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, kommagetrennt"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          />

          <button
            type="submit"
            disabled={create.isPending}
            className="w-full rounded-full bg-[var(--mira-jade)] text-primary-foreground py-3 text-sm font-semibold shadow-[0_12px_28px_oklch(0.48_0.1_175/0.3)] disabled:opacity-60"
          >
            {create.isPending ? "Senden…" : `${KINDS.find((k) => k.id === kind)?.label} posten`}
          </button>
        </form>
      </div>
    </MiraShell>
  );
}
