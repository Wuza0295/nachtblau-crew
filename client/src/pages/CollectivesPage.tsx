import { AppShell } from "@/components/social/AppShell";
import { PostCard } from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function CollectivesPage() {
  const { data: items = [] } = trpc.social.collectives.useQuery();
  const utils = trpc.useUtils();
  const join = trpc.social.joinCollective.useMutation({
    onSuccess: () => utils.social.collectives.invalidate(),
  });

  return (
    <AppShell title="Collectives">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Collectives</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reddit-DNA: Themen-Hubs, in denen Signal zählt — nicht Lautstärke.
        </p>
      </header>
      <ul className="space-y-3">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/50 px-4 py-4"
          >
            <div>
              <Link
                href={`/app/collectives/${c.slug}`}
                className="font-display text-lg font-bold hover:underline"
                style={{ color: c.accent }}
              >
                c/{c.slug}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.members.toLocaleString("de-DE")} · {c.postsToday} Posts heute
              </p>
            </div>
            {!c.isJoined ? (
              <Button size="sm" variant="outline" onClick={() => join.mutate({ id: c.id })}>
                Folgen
              </Button>
            ) : (
              <span className="text-xs font-semibold text-tide">Aktiv</span>
            )}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

export function CollectiveDetailPage({ slug }: { slug: string }) {
  const { data } = trpc.social.collective.useQuery({ slug });
  if (!data?.collective) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Collective nicht gefunden.</p>
      </AppShell>
    );
  }
  return (
    <AppShell title={`c/${data.collective.slug}`}>
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="font-display text-3xl font-bold" style={{ color: data.collective.accent }}>
          c/{data.collective.slug}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.collective.description}</p>
      </header>
      {data.posts.map((p) => (
        <PostCard key={p.id} post={p} showReasons />
      ))}
      {data.posts.length === 0 && (
        <p className="text-sm text-muted-foreground">Noch keine Posts in diesem Collective.</p>
      )}
    </AppShell>
  );
}
