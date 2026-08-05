import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { PULSE_TOPICS } from "@shared/site";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Explore() {
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const { data, isLoading } = trpc.feed.get.useQuery({
    mode: "explore",
    topic: topic as never,
    limit: 24,
  });
  const { data: featured } = trpc.circles.list.useQuery({ featured: true });

  return (
    <div className="container py-8 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground">
          Discovery wie TikTok — aber nach Themen, die du wählst.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={!topic ? "default" : "outline"}
          onClick={() => setTopic(undefined)}
        >
          Alles
        </Button>
        {PULSE_TOPICS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={topic === t.id ? "default" : "outline"}
            onClick={() => setTopic(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {featured && featured.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-lg">Featured Circles</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((c) => (
              <Link
                key={c.id}
                href={`/circles/${c.slug}`}
                className="shrink-0 w-56 rounded-2xl overflow-hidden atmosphere-panel"
              >
                <div className="h-16" style={{ background: c.coverGradient ?? undefined }} />
                <div className="p-3">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 max-w-2xl">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        {data?.map((item) => (
          <PostCard key={item.post.id} item={item} compact />
        ))}
      </div>
    </div>
  );
}
