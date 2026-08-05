import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import PostCard from "@/components/PostCard";
import { toast } from "sonner";

export default function Profile() {
  const params = useParams<{ handle: string }>();
  const handle = params.handle ?? "";
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.social.profile.useQuery(
    { handle },
    { enabled: !!handle }
  );
  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => {
      utils.social.profile.invalidate({ handle });
      toast.success("Orbit aktualisiert");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-48 rounded-2xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <p className="font-display text-2xl font-bold">Profil nicht gefunden</p>
        <Link href="/app" className="mt-4 inline-block text-primary hover:underline">
          Zum Feed
        </Link>
      </div>
    );
  }

  const { profile, posts, isFollowing, isSelf } = data;

  return (
    <div className="container py-8 sm:py-10 max-w-2xl">
      <header className="relative overflow-hidden rounded-3xl border border-border/70 mb-8">
        <div
          className="h-28 sm:h-36"
          style={{
            background: `linear-gradient(120deg, ${profile.accent}, ${profile.accent}88 40%, oklch(0.94 0.03 150) 100%)`,
          }}
        />
        <div className="px-6 pb-6 -mt-10">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ring-4 ring-background shadow-md"
            style={{ background: profile.accent }}
          >
            {profile.avatar}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">{profile.name}</h1>
              <p className="text-muted-foreground">@{profile.handle}</p>
              <p className="mt-3 text-sm leading-relaxed max-w-md">{profile.bio}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{profile.followerCount}</span> Follower ·{" "}
                <span className="font-semibold text-foreground">{profile.followingCount}</span> Following
              </p>
            </div>
            {!isSelf && (
              <button
                type="button"
                onClick={() => follow.mutate({ userId: profile.id })}
                className={
                  isFollowing
                    ? "rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                    : "rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                }
              >
                {isFollowing ? "Following" : "Folgen"}
              </button>
            )}
            {isSelf && (
              <span className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground">
                Dein Profil · Demo
              </span>
            )}
          </div>
        </div>
      </header>

      <h2 className="font-display text-xl font-bold mb-4">Beiträge</h2>
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch keine Beiträge.</p>
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
