import { FrequencySwitcher } from "@/components/FrequencySwitcher";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import type { FrequencyId } from "@shared/site";
import { FREQUENCIES } from "@shared/site";
import { useSearch } from "wouter";

function useFrequency(): FrequencyId {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const f = params.get("f") as FrequencyId | null;
  if (f && FREQUENCIES.some((x) => x.id === f)) return f;
  return "orbit";
}

export default function Feed() {
  const frequency = useFrequency();
  const { data, isLoading } = trpc.feed.get.useQuery({ frequency });

  const meta = FREQUENCIES.find((f) => f.id === frequency);

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-xl py-8">
        <div className="mb-8 animate-rise">
          <FrequencySwitcher active={frequency} className="mb-5" />
          <h1 className="font-display text-2xl font-bold tracking-tight">{meta?.label}</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{meta?.description}</p>
          {frequency === "drift" && (
            <p className="text-xs text-muted-foreground/80 mt-2 border-l-2 border-accent pl-3">
              Drift-Ranking: Resonanz + Merken×2 + Weitergeben×3 — sichtbar, nicht geheim.
            </p>
          )}
        </div>

        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 py-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.posts.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">
            Noch nichts auf dieser Frequenz. Schreib etwas — oder wechsle den Kreis.
          </p>
        )}

        <div>
          {data?.posts.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
