import { AppShell } from "@/components/social/AppShell";
import { PostCard } from "@/components/social/PostCard";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function ProfilePage({ handle }: { handle: string }) {
  const { data, isLoading } = trpc.social.profileByHandle.useQuery({ handle });
  const utils = trpc.useUtils();
  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => utils.social.profileByHandle.invalidate({ handle }),
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Lädt…</p>
      </AppShell>
    );
  }

  if (!data?.profile) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Profil nicht gefunden.</p>
      </AppShell>
    );
  }

  const { profile, posts, following } = data;
  const isMe = profile.id === "me";

  return (
    <AppShell title={profile.displayName}>
      <div className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card/50">
        <div
          className="h-28"
          style={{
            background: `linear-gradient(120deg, ${profile.avatarColor}55, transparent)`,
          }}
        />
        <div className="-mt-8 px-5 pb-5">
          <UserAvatar
            initials={profile.avatarInitials}
            color={profile.avatarColor}
            size="xl"
            className="ring-4 ring-background"
          />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">
                {profile.displayName}
                {profile.isVerified && (
                  <span className="ml-2 text-sm font-medium text-tide">✓ Signal</span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
              <p className="mt-3 max-w-md text-sm leading-relaxed">{profile.bio}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {profile.followers.toLocaleString("de-DE")} Follower ·{" "}
                {profile.following.toLocaleString("de-DE")} folgend
                {profile.location ? ` · ${profile.location}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests.map((i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                    #{i}
                  </span>
                ))}
              </div>
            </div>
            {!isMe && (
              <Button
                size="sm"
                variant={following ? "secondary" : "default"}
                onClick={() => follow.mutate({ userId: profile.id })}
              >
                {following ? "Folgst du" : "Folgen"}
              </Button>
            )}
          </div>
        </div>
      </div>
      <h2 className="mb-2 font-display text-lg font-bold">Beiträge</h2>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      {posts.length === 0 && (
        <p className="text-sm text-muted-foreground">Noch keine Beiträge.</p>
      )}
    </AppShell>
  );
}
