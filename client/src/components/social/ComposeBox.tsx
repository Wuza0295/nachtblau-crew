import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const kinds = [
  { id: "thought" as const, label: "Gedanke" },
  { id: "depth" as const, label: "Depth" },
  { id: "spark" as const, label: "Spark" },
];

export function ComposeBox({ className }: { className?: string }) {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("thought");
  const utils = trpc.useUtils();

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      setBody("");
      setTitle("");
      utils.social.feed.invalidate();
      toast.success("Gepostet — Signal startet bei 1");
    },
  });

  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/70 p-4 backdrop-blur-sm", className)}>
      <div className="mb-3 flex gap-1">
        {kinds.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              kind === k.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      {kind === "depth" && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel für Depth…"
          className="mb-2 w-full bg-transparent font-display text-lg font-semibold outline-none placeholder:text-muted-foreground/60"
        />
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          kind === "spark"
            ? "Kurzer Hook für Discovery…"
            : kind === "depth"
              ? "Schreib zu Ende denken…"
              : "Was beschäftigt dich — ohne Performance?"
        }
        className="min-h-[88px] resize-none border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {kind === "thought" && "Wie Threads — dialogfähig"}
          {kind === "depth" && "Wie LinkedIn-Essays — ohne Karriere-Druck"}
          {kind === "spark" && "Wie TikTok — Interesse statt Follower"}
        </p>
        <Button
          size="sm"
          disabled={!body.trim() || create.isPending}
          onClick={() =>
            create.mutate({
              body: body.trim(),
              kind,
              title: title.trim() || undefined,
              topics: ["general"],
            })
          }
        >
          Posten
        </Button>
      </div>
    </div>
  );
}
