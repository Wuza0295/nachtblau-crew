import { FEED_LENSES, type FeedLens } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function LensSwitcher({
  value,
  onChange,
}: {
  value: FeedLens | "all";
  onChange: (lens: FeedLens | "all") => void;
}) {
  const setLens = trpc.social.setLens.useMutation();

  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-secondary/80 p-1">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-all",
          value === "all" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
        )}
      >
        Alle
      </button>
      {FEED_LENSES.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => {
            onChange(l.id);
            setLens.mutate({ lens: l.id });
          }}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-all",
            value === l.id ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
          )}
          title={l.blurb}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
