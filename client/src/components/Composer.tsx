import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useMood } from "@/contexts/MoodContext";
import { MOODS } from "@shared/site";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PenLine, Send } from "lucide-react";
import { toast } from "sonner";

const kinds = [
  { id: "text" as const, label: "Text" },
  { id: "image" as const, label: "Bild" },
  { id: "pulse" as const, label: "Pulse" },
  { id: "longform" as const, label: "Essay" },
  { id: "moment" as const, label: "Echtzeit" },
];

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const { mood } = useMood();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("text");
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const utils = trpc.useUtils();

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Gesendet — Resonanz startet bei null.");
      setBody("");
      setTitle("");
      setOpen(false);
      utils.social.feed.invalidate();
      onPosted?.();
    },
  });

  const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? mood;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-3xl border border-dashed border-primary/30 bg-card/70 px-5 py-4 flex items-center gap-3 text-left hover:border-primary/50 hover:bg-card transition animate-fade-scale"
      >
        <span className="grid place-items-center size-10 rounded-2xl bg-primary/10 text-primary">
          <PenLine className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-sm">In „{moodLabel}“ schreiben…</p>
          <p className="text-xs text-muted-foreground">
            Text, Pulse, Essay oder Echtzeit-Moment
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 animate-fade-scale">
      <div className="flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition",
              kind === k.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      {kind === "longform" && (
        <Input
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
        />
      )}
      <Textarea
        placeholder={
          kind === "moment"
            ? "Dein echter Moment — ohne Filter-Theater"
            : kind === "pulse"
              ? "Kurzer visueller Impuls…"
              : "Was soll schwingen?"
        }
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-28 rounded-xl resize-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Frequenz: <strong className="text-foreground">{moodLabel}</strong>
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={!body.trim() || create.isPending}
            onClick={() =>
              create.mutate({
                kind,
                mood,
                body: body.trim(),
                title: title.trim() || undefined,
              })
            }
            className="gap-2"
          >
            <Send className="size-4" />
            Senden
          </Button>
        </div>
      </div>
    </div>
  );
}
