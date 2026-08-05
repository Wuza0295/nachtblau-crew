import { AppNav } from "@/components/CadenceNav";
import { PostCard } from "@/components/PostCard";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { formatScore } from "@shared/social";
import { Flame, TrendingUp } from "lucide-react";
import { useMood } from "@/contexts/MoodContext";
import { useEffect } from "react";

export default function Discover() {
  const { setMood } = useMood();
  useEffect(() => {
    setMood("entdecken");
  }, [setMood]);

  const { data: feed = [] } = trpc.social.feed.useQuery({ mood: "entdecken" });
  const pulses = feed.filter((p) => p.kind === "pulse" || p.kind === "image");
  const rising = [...feed].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
        <div className="animate-rise">
          <h1 className="font-display text-3xl font-bold">Entdecken</h1>
          <p className="text-muted-foreground mt-1">
            Visuelle Impulse und Stimmen, die gerade schwingen — TikTok-Energie, ohne
            den Sog der Endlosschleife allein.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {pulses.map((post, i) => (
              <div
                key={post.id}
                className="animate-rise"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-4 text-primary" />
                <h2 className="font-display font-bold">Höchste Resonanz</h2>
              </div>
              <ul className="space-y-3">
                {rising.map((p) => (
                  <li key={p.id} className="flex gap-3 items-start">
                    <Flame className="size-4 text-accent mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {p.title || p.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        @{p.author.handle} · {formatScore(p.score)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="mt-4 block text-center text-sm font-semibold text-primary hover:underline"
              >
                Zur Frequenz
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
