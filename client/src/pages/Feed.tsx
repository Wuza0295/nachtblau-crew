import { ComposeBox } from "@/components/social/ComposeBox";
import { FeedModePicker, type FeedMode } from "@/components/social/FeedModePicker";
import { PostCard } from "@/components/social/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Feed() {
  const [mode, setMode] = useState<FeedMode>("discover");
  const { data, isLoading } = trpc.social.getFeed.useQuery({
    mode,
    postKind: "feed",
    limit: 30,
  });

  return (
    <div className="container py-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Feed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          X-Threads-Speed, Instagram-Medien, LinkedIn-Tiefe — mit Feed-Wahl wie Bluesky.
        </p>
      </header>

      <div className="space-y-6">
        <FeedModePicker value={mode} onChange={setMode} />
        <ComposeBox />
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        {data?.map((item) => (
          <PostCard key={item.post.id} item={item} />
        ))}
        {!isLoading && data?.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Noch keine Beiträge — starte mit dem ersten Post oder wechsle den Feed-Modus.
          </p>
        )}
      </div>
    </div>
  );
}
