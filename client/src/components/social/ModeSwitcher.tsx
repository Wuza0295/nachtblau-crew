import type { FeedMode } from "@shared/social";
import { Button } from "@/components/ui/button";

const MODES: { id: FeedMode; label: string; hint: string }[] = [
  { id: "chronik", label: "Chronik", hint: "Folge · zeitlich" },
  { id: "nah", label: "Nah", hint: "Enge Kreise" },
  { id: "entdecken", label: "Entdecken", hint: "Interesse" },
  { id: "fokus", label: "Fokus", hint: "Tiefe" },
];

export function ModeSwitcher({
  value,
  onChange,
}: {
  value: FeedMode;
  onChange: (mode: FeedMode) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-secondary/60 border border-border/50 overflow-x-auto">
      {MODES.map((m) => {
        const active = value === m.id;
        return (
          <Button
            key={m.id}
            variant="ghost"
            size="sm"
            onClick={() => onChange(m.id)}
            className={`flex-1 min-w-[5.5rem] flex-col h-auto py-2 gap-0.5 rounded-xl ${
              active
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="font-display font-semibold text-sm">{m.label}</span>
            <span className={`text-[10px] ${active ? "opacity-80" : "opacity-60"}`}>{m.hint}</span>
          </Button>
        );
      })}
    </div>
  );
}
