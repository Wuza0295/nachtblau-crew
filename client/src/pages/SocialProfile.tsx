import { AppNav } from "@/components/CadenceNav";
import { Avatar, PostCard } from "@/components/PostCard";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { formatScore } from "@shared/social";
import { Bookmark, BadgeCheck } from "lucide-react";
import { MOODS } from "@shared/site";

export default function SocialProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { data, isLoading } = trpc.social.profile.useQuery(
    { handle: handle ?? "mira" },
    { enabled: !!handle }
  );

  if (isLoading) {
    return (
      <div className="min-h-dvh">
        <AppNav />
        <p className="p-8 text-center text-muted-foreground">Lade Profil…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh">
        <AppNav />
        <p className="p-8 text-center">Profil nicht gefunden.</p>
        <p className="text-center">
          <Link href="/u/mira" className="text-primary font-semibold">
            Zu @mira
          </Link>
        </p>
      </div>
    );
  }

  const { user, posts, collections } = data;
  const mood = MOODS.find((m) => m.id === user.mood);

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <AppNav />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        <div className="rounded-3xl border border-border bg-card overflow-hidden animate-rise">
          <div
            className="h-28"
            style={{
              background: `linear-gradient(120deg, ${user.avatarGradient}, oklch(0.92 0.03 165))`,
            }}
          />
          <div className="px-6 pb-6 -mt-10">
            <Avatar gradient={user.avatarGradient} name={user.name} size="lg" />
            <div className="mt-3 flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{user.name}</h1>
              {user.verified && <BadgeCheck className="size-5 text-primary" />}
            </div>
            <p className="text-muted-foreground">@{user.handle}</p>
            <p className="mt-3 text-[15px] leading-relaxed">{user.bio}</p>
            {user.focus && (
              <p className="mt-2 text-sm font-medium text-primary">{user.focus}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span>
                <strong>{formatScore(user.followers)}</strong>{" "}
                <span className="text-muted-foreground">Follower</span>
              </span>
              <span>
                <strong>{formatScore(user.following)}</strong>{" "}
                <span className="text-muted-foreground">folgt</span>
              </span>
              {mood && (
                <span className="rounded-lg bg-secondary px-2 py-0.5 text-xs font-semibold">
                  Frequenz: {mood.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {collections.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Bookmark className="size-4 text-primary" />
              Sammlungen
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="shrink-0 w-40 rounded-2xl border border-border bg-card p-4"
                >
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.postIds.length} gespeichert
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold">Beiträge</h2>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      </div>
    </div>
  );
}
