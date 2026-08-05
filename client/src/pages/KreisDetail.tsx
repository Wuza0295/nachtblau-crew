import { ComposeBox } from "@/components/social/ComposeBox";
import { FeedModePicker, type FeedMode } from "@/components/social/FeedModePicker";
import { PostCard } from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";

export default function KreisDetail() {
  const [, params] = useRoute("/kreise/:slug");
  const slug = params?.slug ?? "";
  const [mode, setMode] = useState<FeedMode>("chronological");
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.social.getCommunity.useQuery({ slug }, { enabled: !!slug });
  const community = data?.community;

  const { data: posts, isLoading: postsLoading } = trpc.social.getFeed.useQuery(
    {
      mode,
      postKind: "feed",
      communityId: community?.id,
      limit: 30,
    },
    { enabled: !!community?.id }
  );

  const join = trpc.social.joinCommunity.useMutation({
    onSuccess: () => {
      utils.social.getCommunity.invalidate({ slug });
      toast.success("Du bist dem Kreis beigetreten");
    },
  });

  if (isLoading || !community) {
    return (
      <div className="container py-8 max-w-2xl">
        <Skeleton className="h-32 w-full rounded-xl mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div
        className={`h-36 bg-gradient-to-r ${community.coverGradient ?? "from-violet-600 to-cyan-500"}`}
      />
      <div className="container max-w-2xl -mt-12 relative pb-10">
        <div className="flex items-end gap-4 mb-8">
          <span className="text-5xl bg-card rounded-2xl p-3 border border-border shadow-lg">
            {community.iconEmoji}
          </span>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-bold">{community.name}</h1>
            <p className="text-sm text-muted-foreground">{community.memberCount} Mitglieder</p>
          </div>
          {isAuthenticated && !data?.isMember && (
            <Button onClick={() => join.mutate({ communityId: community.id })}>Beitreten</Button>
          )}
          {data?.isMember && (
            <span className="text-xs text-primary font-medium px-3 py-1 rounded-full bg-primary/10">
              Mitglied
            </span>
          )}
        </div>
        <p className="text-muted-foreground mb-6">{community.description}</p>

        <div className="space-y-6">
          <FeedModePicker value={mode} onChange={setMode} />
          <ComposeBox communityId={community.id} placeholder={`Post in ${community.name}…`} />
          {postsLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          {posts?.map((item) => (
            <PostCard key={item.post.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
