import { AppShell } from "@/components/social/AppShell";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function ExplorePage() {
  const { data } = trpc.social.explore.useQuery();

  return (
    <AppShell title="Explore">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Explore</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organische Entdeckung — Menschen, Circles, Topics. Kein For-You-Zwang.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold">Menschen</h2>
        <ul className="mt-3 space-y-3">
          {(data?.people ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-3"
            >
              <Link href={`/app/u/${p.handle}`} className="flex items-center gap-3">
                <UserAvatar initials={p.avatarInitials} color={p.avatarColor} />
                <div>
                  <p className="font-semibold">{p.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{p.handle}</p>
                </div>
              </Link>
              <FollowButton userId={p.id} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold">Themen</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(data?.topics ?? []).map((t) => (
            <span
              key={t.topic}
              className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold"
            >
              #{t.topic}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Offene Circles</h2>
        <ul className="mt-3 space-y-2">
          {(data?.circles ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/app/circles/${c.slug}`}
                className="block rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/50"
              >
                <span className="font-semibold" style={{ color: c.accent }}>
                  {c.name}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {c.memberCount} Mitglieder
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function FollowButton({ userId }: { userId: string }) {
  const utils = trpc.useUtils();
  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => {
      utils.social.explore.invalidate();
      utils.social.feed.invalidate();
    },
  });
  return (
    <Button size="sm" variant="outline" onClick={() => follow.mutate({ userId })}>
      Folgen
    </Button>
  );
}
