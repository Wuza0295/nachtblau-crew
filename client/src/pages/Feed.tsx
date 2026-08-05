import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import type { FeedMode } from "@shared/social";
import { ModeSwitcher } from "@/components/social/ModeSwitcher";
import { MomentRail } from "@/components/social/MomentRail";
import { PostCard } from "@/components/social/PostCard";
import { PresenceRings } from "@/components/social/PresenceRings";
import { Button } from "@/components/ui/button";
import { FEED_MODES } from "@shared/social";
import { PenSquare, Compass } from "lucide-react";

export default function Feed() {
  const [mode, setMode] = useState<FeedMode>("chronik");
  const utils = trpc.useUtils();

  const { data: posts = [], isLoading } = trpc.social.feed.useQuery({ mode });
  const resonate = trpc.social.resonate.useMutation({
    onSuccess: () => utils.social.feed.invalidate({ mode }),
  });

  const modeMeta = FEED_MODES.find((m) => m.id === mode);

  return (
    <div className="container py-6 md:py-8">
      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        <div className="min-w-0 max-w-2xl mx-auto lg:mx-0 w-full">
          <header className="mb-5 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold">Feed</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {modeMeta?.blurb}{" "}
                  <span className="text-primary/80">· {modeMeta?.inspiredBy}</span>
                </p>
              </div>
              <Button asChild size="sm" variant="secondary" className="shrink-0 gap-1.5">
                <Link href="/compose">
                  <PenSquare className="h-4 w-4" /> Posten
                </Link>
              </Button>
            </div>
            <ModeSwitcher
              value={mode}
              onChange={(m) => {
                setMode(m);
              }}
            />
            <MomentRail />
          </header>

          <div key={mode} className="animate-mode">
            {isLoading && (
              <div className="space-y-6 py-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            )}
            {!isLoading && posts.length === 0 && (
              <p className="text-muted-foreground py-12 text-center">
                Noch keine Posts in diesem Modus.
              </p>
            )}
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                onResonate={(id) => resonate.mutate({ postId: id })}
              />
            ))}
          </div>
        </div>

        <aside className="hidden lg:block space-y-8 sticky top-24 self-start">
          <PresenceRings />
          <div className="space-y-2 border border-border/40 rounded-2xl p-4 bg-secondary/20">
            <h2 className="font-display font-semibold text-sm">Radar steuern</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sag dem Algorithmus, was du willst — statt ihm hinterherzulaufen.
            </p>
            <Button asChild size="sm" variant="outline" className="w-full gap-2 mt-2">
              <Link href="/radar">
                <Compass className="h-4 w-4" /> Zum Radar
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
