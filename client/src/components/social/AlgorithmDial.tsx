import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export default function AlgorithmDial() {
  const { data: prefs } = trpc.social.preferences.useQuery();
  const utils = trpc.useUtils();
  const setMix = trpc.social.setAlgorithmMix.useMutation({
    onSuccess: () => {
      utils.social.preferences.invalidate();
      utils.social.feed.invalidate();
    },
  });

  const mix = prefs?.algorithmMix ?? 35;

  return (
    <div className="mist-panel animate-dial rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-base">Algorithmus-Regler</h3>
        <span className="text-xs tabular-nums text-muted-foreground">{mix}%</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Du mischst Chronologie und Entdeckung — Bluesky-Kontrolle, TikTok-Reichweite.
      </p>
      <div className="mt-4 px-1">
        <Slider
          value={[mix]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => setMix.mutate({ mix: v ?? 0 })}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className={cn(mix < 40 && "text-primary font-semibold")}>Chronologie</span>
        <span className={cn(mix >= 40 && mix <= 70 && "text-primary font-semibold")}>
          Balance
        </span>
        <span className={cn(mix > 70 && "text-primary font-semibold")}>Discovery</span>
      </div>
    </div>
  );
}
