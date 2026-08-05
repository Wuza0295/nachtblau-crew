import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Sparkles, Users } from "lucide-react";

export type FeedMode = "following" | "discover" | "chronological";

const MODES: { id: FeedMode; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: "discover", label: "Für dich", icon: Sparkles, hint: "Interessen & Engagement" },
  { id: "following", label: "Following", icon: Users, hint: "Menschen & Kreise" },
  { id: "chronological", label: "Chronologisch", icon: Clock, hint: "Kein Algorithmus" },
];

export function FeedModePicker({
  value,
  onChange,
}: {
  value: FeedMode;
  onChange: (m: FeedMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-muted/50 border border-border/60">
      {MODES.map(({ id, label, icon: Icon, hint }) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          title={hint}
          className={cn(
            "gap-2 rounded-lg flex-1 sm:flex-none",
            value === id && "bg-primary/15 text-primary shadow-sm"
          )}
          onClick={() => onChange(id)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
