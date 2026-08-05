import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Radio } from "lucide-react";

export default function Circles() {
  const utils = trpc.useUtils();
  const { data: circles = [], isLoading } = trpc.social.circles.useQuery();
  const toggle = trpc.social.toggleJoin.useMutation({
    onSuccess: () => utils.social.circles.invalidate(),
  });

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl md:text-4xl">Kreise</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Communities wie bei Reddit, Räume wie bei Discord, Intimität wie Close Friends — in einem
        Ort.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {isLoading && <p className="text-muted-foreground">Lade Kreise…</p>}
        {circles.map((c) => (
          <article key={c.id} className="mist-panel overflow-hidden rounded-2xl">
            <Link href={`/kreise/${c.slug}`}>
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={c.cover}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>
            </Link>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/kreise/${c.slug}`}>
                    <h2 className="font-display text-2xl hover:text-primary">{c.name}</h2>
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {c.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={c.joined ? "secondary" : "default"}
                  className="shrink-0 rounded-full"
                  onClick={() => toggle.mutate({ circleId: c.id })}
                >
                  {c.joined ? "Mitglied" : "Beitreten"}
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {c.members.toLocaleString("de-DE")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5" />
                  {c.roomsOnline} Rooms live
                </span>
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full bg-secondary px-2 py-0.5">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
