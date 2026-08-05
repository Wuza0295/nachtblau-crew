import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Headphones, MessageSquareText, Users } from "lucide-react";

function channelIcon(kind: string) {
  if (kind === "voice") return Headphones;
  if (kind === "thread") return Hash;
  return MessageSquareText;
}

export default function Circles() {
  const { data: circles = [], isLoading } = trpc.social.circles.useQuery();
  const utils = trpc.useUtils();
  const toggle = trpc.social.toggleJoinCircle.useMutation({
    onSuccess: () => utils.social.circles.invalidate(),
  });

  return (
    <div className="container py-8 max-w-4xl">
      <header className="mb-8 max-w-xl">
        <h1 className="font-display text-3xl font-bold mb-2">Circles</h1>
        <p className="text-muted-foreground">
          Hybrid aus Reddit und Discord: suchbare Threads für Wissen, Live- und Voice-Kanäle für
          Präsenz — in einer Community.
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid gap-5">
        {circles.map((c, i) => (
          <article
            key={c.id}
            className="animate-rise overflow-hidden rounded-2xl border border-border/50 bg-secondary/15"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="relative h-36 md:h-44">
              <img src={c.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <Link href={`/circles/${c.slug}`}>
                    <h2 className="font-display text-xl md:text-2xl font-bold hover:text-primary transition-colors">
                      {c.name}
                    </h2>
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Users className="h-3.5 w-3.5" />
                    {c.memberCount.toLocaleString("de-DE")} Mitglieder
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={c.isJoined ? "secondary" : "default"}
                  onClick={() => toggle.mutate({ id: c.id })}
                >
                  {c.isJoined ? "Beigetreten" : "Beitreten"}
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              <div className="flex flex-wrap gap-2">
                {c.channels.map((ch) => {
                  const Icon = channelIcon(ch.kind);
                  return (
                    <Badge key={ch.id} variant="outline" className="gap-1.5 font-normal">
                      <Icon className="h-3 w-3" />
                      {ch.name}
                      <span className="text-[10px] uppercase opacity-60">{ch.kind}</span>
                    </Badge>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {c.topics.map((t) => (
                  <span key={t} className="text-xs text-primary/90">
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
