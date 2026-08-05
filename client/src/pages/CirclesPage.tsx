import { AppShell } from "@/components/social/AppShell";
import { PostCard } from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function CirclesPage() {
  const { data: circles = [] } = trpc.social.circles.useQuery();
  const utils = trpc.useUtils();
  const join = trpc.social.joinCircle.useMutation({
    onSuccess: () => utils.social.circles.invalidate(),
  });

  return (
    <AppShell title="Circles">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Circles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discord-Energie ohne 47 ungelesene Channels — klare Räume, echte Nähe.
        </p>
      </header>
      <div className="grid gap-4">
        {circles.map((c) => (
          <article
            key={c.id}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card/60"
          >
            <div className="h-24" style={{ background: c.coverGradient }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/app/circles/${c.slug}`}
                    className="font-display text-xl font-bold hover:underline"
                    style={{ color: c.accent }}
                  >
                    {c.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.memberCount.toLocaleString("de-DE")} Mitglieder · {c.rooms.length} Räume
                  </p>
                </div>
                {!c.isJoined ? (
                  <Button size="sm" onClick={() => join.mutate({ id: c.id })}>
                    Beitreten
                  </Button>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-tide">
                    Mitglied
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.rooms.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
                  >
                    {r.kind === "voice" ? "Voice" : r.kind === "board" ? "Board" : "Chat"} · {r.name}
                    {r.unread ? ` · ${r.unread}` : ""}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

export function CircleDetailPage({ slug }: { slug: string }) {
  const { data } = trpc.social.circle.useQuery({ slug });
  if (!data?.circle) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Circle nicht gefunden.</p>
      </AppShell>
    );
  }
  const { circle, posts } = data;
  return (
    <AppShell title={circle.name}>
      <div
        className="mb-6 overflow-hidden rounded-2xl p-6"
        style={{ background: circle.coverGradient }}
      >
        <h1 className="font-display text-3xl font-bold" style={{ color: circle.accent }}>
          {circle.name}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-ink/80">{circle.description}</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {circle.rooms.map((r) => (
          <button
            key={r.id}
            type="button"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold"
          >
            {r.name}
          </button>
        ))}
      </div>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </AppShell>
  );
}
