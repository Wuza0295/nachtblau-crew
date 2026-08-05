import { FEED_LENSES, type FeedLens } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function ComposeBox({ defaultLens }: { defaultLens?: FeedLens }) {
  const { data: prefs } = trpc.social.preferences.useQuery();
  const utils = trpc.useUtils();
  const [lens, setLens] = useState<FeedLens>(defaultLens ?? prefs?.activeLens ?? "pulse");
  const [body, setBody] = useState("");

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      setBody("");
      utils.social.feed.invalidate();
      toast.success("Beitrag ist live");
    },
  });

  return (
    <div className="mist-panel rounded-2xl p-4">
      <div className="flex flex-wrap gap-1.5">
        {FEED_LENSES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLens(l.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition-colors",
              lens === l.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3 min-h-[96px] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        placeholder={
          lens === "pulse"
            ? "Was bewegt dich — kurz und klar?"
            : lens === "canvas"
              ? "Beschreibe dein visuelles Moment…"
              : lens === "stream"
                ? "Hook für deinen Stream…"
                : "Schreibe in die Tiefe…"
        }
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {FEED_LENSES.find((l) => l.id === lens)?.inspiredBy}
        </p>
        <Button
          size="sm"
          className="rounded-full"
          disabled={!body.trim() || create.isPending}
          onClick={() => create.mutate({ lens, body: body.trim() })}
        >
          Veröffentlichen
        </Button>
      </div>
    </div>
  );
}
