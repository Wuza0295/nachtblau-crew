import { AppNav, MoodSwitcher } from "@/components/CadenceNav";
import { Composer } from "@/components/Composer";
import { MomentsRail } from "@/components/MomentsRail";
import { PostCard } from "@/components/PostCard";
import { useMood } from "@/contexts/MoodContext";
import { MOODS } from "@shared/site";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  const { mood } = useMood();
  const moodMeta = MOODS.find((m) => m.id === mood)!;
  const { data: feed = [], isLoading } = trpc.social.feed.useQuery({ mood });

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <AppNav />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="space-y-3 animate-rise">
          <MoodSwitcher />
          <div>
            <h1 className="font-display text-2xl font-bold">{moodMeta.label}</h1>
            <p className="text-sm text-muted-foreground">
              {moodMeta.description} · {moodMeta.inspiredBy}
            </p>
          </div>
        </div>

        {mood === "nah" && <MomentsRail />}

        <Composer />

        <div className="space-y-4">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          {feed.map((post, i) => (
            <div key={post.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <PostCard post={post} featured={i === 0 && mood === "entdecken"} />
            </div>
          ))}
          {!isLoading && feed.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              Noch still auf dieser Frequenz. Sei der erste Impuls.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
