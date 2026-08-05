import { AppShell } from "@/components/social/AppShell";
import { ComposeBox } from "@/components/social/ComposeBox";
import { LensSwitcher } from "@/components/social/LensSwitcher";
import { MomentRail } from "@/components/social/MomentRail";
import { PostCard } from "@/components/social/PostCard";
import { trpc } from "@/lib/trpc";
import type { LensId } from "@shared/social";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedPage() {
  const [lens, setLens] = useState<LensId>("signal");
  const { data: lenses = [] } = trpc.social.lenses.useQuery();
  const { data, isLoading } = trpc.social.feed.useQuery({ lens });

  return (
    <AppShell title="Feed">
      <div className="space-y-5">
        <MomentRail />
        <LensSwitcher lenses={lenses} active={lens} onChange={setLens} />
        <ComposeBox />
        {data?.meta && (
          <div className="flex flex-wrap gap-3 rounded-xl bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              Frische <strong className="text-foreground">{Math.round(data.meta.weights.freshness * 100)}%</strong>
            </span>
            <span>
              Nähe <strong className="text-foreground">{Math.round(data.meta.weights.affinity * 100)}%</strong>
            </span>
            <span>
              Signal <strong className="text-foreground">{Math.round(data.meta.weights.signal * 100)}%</strong>
            </span>
            <span>
              Exploration{" "}
              <strong className="text-foreground">
                {Math.round(data.meta.weights.exploration * 100)}%
              </strong>
            </span>
          </div>
        )}
        <div>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 border-b border-border/50 py-5">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          {data?.items.map((post) => (
            <PostCard key={post.id} post={post} showReasons />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
