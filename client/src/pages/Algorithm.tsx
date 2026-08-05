import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "wouter";

const LABELS: Record<string, { title: string; blurb: string }> = {
  recency: { title: "Recency", blurb: "Wie stark frische Posts gewinnen." },
  relevance: { title: "Relevance", blurb: "Engagement und thematische Passung." },
  diversity: { title: "Diversity", blurb: "Mehr Linsen-Mix und Überraschung." },
  quiet: { title: "Quiet", blurb: "Weniger Lärm, Videos und Hype." },
  social: { title: "Social", blurb: "Priorisiere Menschen, denen du folgst." },
};

export default function Algorithm() {
  const algo = trpc.social.algorithm.useQuery();
  const utils = trpc.useUtils();
  const [weights, setWeights] = useState({
    recency: 55,
    relevance: 70,
    diversity: 45,
    quiet: 35,
    social: 60,
  });

  useEffect(() => {
    if (algo.data?.weights) setWeights(algo.data.weights);
  }, [algo.data?.weights]);

  const save = trpc.social.setAlgorithm.useMutation({
    onSuccess: () => {
      toast.success("Algorithmus gespeichert");
      utils.social.algorithm.invalidate();
      utils.social.feed.invalidate();
    },
  });

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Dein Algorithmus</h1>
      <p className="mt-2 text-muted-foreground">
        Inspiriert von Research wie Gobo und Bonsai: Du siehst die Gewichte — und stellst sie selbst.
        Kein Blackbox-Engagement-Zwang.
      </p>

      <div className="mt-8 aether-shell rounded-2xl p-6 space-y-7">
        {(Object.keys(LABELS) as (keyof typeof weights)[]).map((key) => (
          <div key={key}>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="font-display font-semibold">{LABELS[key].title}</div>
                <div className="text-sm text-muted-foreground">{LABELS[key].blurb}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums">{weights[key]}</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[key]}
              onChange={(e) =>
                setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
              }
              className="mt-3 w-full accent-[oklch(0.48_0.1_195)]"
            />
          </div>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button className="rounded-full" onClick={() => save.mutate(weights)}>
            Gewichte speichern
          </Button>
          <Link href="/home">
            <Button variant="outline" className="rounded-full">
              Feed mit neuem Mix öffnen
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 text-sm text-muted-foreground leading-relaxed">
        Session-Intent (Browse / Connect / Create / Focus) multipliziert diese Gewichte zusätzlich.
        Stell Intent im Feed um — der Algorithmus bleibt transparent.
      </div>
    </div>
  );
}
