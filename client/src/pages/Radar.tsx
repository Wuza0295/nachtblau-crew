import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Compass } from "lucide-react";

export default function Radar() {
  const utils = trpc.useUtils();
  const { data: interests = [], isLoading } = trpc.social.radar.useQuery();
  const setInterest = trpc.social.setRadarInterest.useMutation({
    onSuccess: () => utils.social.radar.invalidate(),
  });
  const applyPrompt = trpc.social.applyRadarPrompt.useMutation({
    onSuccess: () => {
      setPrompt("");
      utils.social.radar.invalidate();
      utils.social.feed.invalidate();
    },
  });
  const [prompt, setPrompt] = useState("");

  return (
    <div className="container py-8 max-w-2xl">
      <header className="mb-8 space-y-3 text-center">
        <div className="relative mx-auto h-28 w-28">
          <div className="absolute inset-0 rounded-full border border-primary/30 animate-radar" />
          <div className="absolute inset-3 rounded-full border border-dashed border-primary/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold">Radar</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Dein Algorithmus, sichtbar und steuerbar. Sag was du willst — z.&nbsp;B. »mehr Reisen,
          weniger Drama«.
        </p>
      </header>

      <form
        className="flex gap-2 mb-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (!prompt.trim()) return;
          applyPrompt.mutate({ prompt: prompt.trim() });
        }}
      >
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="mehr Fotografie, weniger Clickbait…"
          className="flex-1"
        />
        <Button type="submit" disabled={!prompt.trim() || applyPrompt.isPending}>
          Anwenden
        </Button>
      </form>

      {isLoading && <div className="h-40 rounded-2xl bg-muted animate-pulse" />}

      <div className="space-y-6">
        {interests.map((item) => (
          <div key={item.topic} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium capitalize">{item.topic}</span>
              <span
                className={`text-sm tabular-nums ${
                  item.weight >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {item.weight > 0 ? "+" : ""}
                {item.weight}
              </span>
            </div>
            <Slider
              value={[item.weight]}
              min={-100}
              max={100}
              step={5}
              onValueChange={([v]) =>
                setInterest.mutate({ topic: item.topic, weight: v ?? 0 })
              }
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Weniger</span>
              <span>Mehr</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-10 leading-relaxed">
        Inspiration: Instagram »Your Algorithm« — hier als Kernprodukt, nicht als verstecktes
        Setting. Wirkt auf Entdecken-Feed und Pulse.
      </p>
    </div>
  );
}
