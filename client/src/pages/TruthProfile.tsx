import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MiraShell } from "@/components/mira/MiraShell";
import { PostCard } from "@/components/mira/PostCard";
import { Sun, Clock } from "lucide-react";

export default function TruthPage() {
  const utils = trpc.useUtils();
  const feed = trpc.mira.feed.useQuery({ mode: "nahe" });
  const resonate = trpc.mira.toggleResonance.useMutation({
    onSuccess: () => utils.mira.feed.invalidate(),
  });
  const save = trpc.mira.toggleSave.useMutation({
    onSuccess: () => utils.mira.feed.invalidate(),
  });

  const truths = feed.data?.posts.filter((p) => p.kind === "truth") ?? [];
  const windowOpen = true;

  return (
    <MiraShell>
      <div className="max-w-xl mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden mb-8 fade-up min-h-[220px] flex items-end">
          <img
            src="https://images.unsplash.com/photo-1499750310169-2dd2bd5e1d1a?auto=format&fit=crop&w=1200&h=600&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[var(--mira-ink)]/50" />
          <div className="relative p-6 text-white">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] mb-3 text-white/80">
              <Sun className="size-4 text-[var(--mira-gold)]" />
              Truth-Fenster
            </div>
            <h1 className="font-display text-3xl font-700">Jetzt. Echt.</h1>
            <p className="text-white/75 text-sm mt-2 max-w-sm">
              Einmal am Tag öffnet sich ein Fenster. Kein Filter, kein Retry –
              inspiriert von BeReal, eingebettet in dein Dorf.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm glass-strong rounded-full px-3 py-1.5 text-[var(--mira-ink)]">
              <Clock className="size-3.5" />
              {windowOpen ? "Fenster offen · 14 Min übrig" : "Fenster geschlossen"}
            </div>
          </div>
        </div>

        {windowOpen && (
          <Link
            href="/compose"
            className="block glass rounded-2xl p-5 mb-6 text-center hover:bg-secondary/50 transition-colors fade-up"
          >
            <Sun className="size-6 mx-auto text-[var(--mira-gold)] mb-2" />
            <p className="font-display font-600">Truth posten</p>
            <p className="text-xs text-muted-foreground mt-1">
              Zeig, wo du gerade bist
            </p>
          </Link>
        )}

        <div className="space-y-4">
          {truths.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onResonate={() => resonate.mutate({ postId: post.id })}
              onSave={() => save.mutate({ postId: post.id })}
            />
          ))}
          {truths.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Noch keine Truths in deinem Dorf.
            </p>
          )}
        </div>
      </div>
    </MiraShell>
  );
}

export function MiraProfilePage({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.mira.user.useQuery({ id });
  const resonate = trpc.mira.toggleResonance.useMutation({
    onSuccess: () => utils.mira.user.invalidate({ id }),
  });
  const save = trpc.mira.toggleSave.useMutation({
    onSuccess: () => utils.mira.user.invalidate({ id }),
  });

  if (isLoading) {
    return (
      <MiraShell>
        <div className="glass rounded-2xl h-64 mira-shimmer" />
      </MiraShell>
    );
  }
  if (!data) {
    return (
      <MiraShell>
        <p>Profil nicht gefunden.</p>
      </MiraShell>
    );
  }

  const { user, posts } = data;

  return (
    <MiraShell>
      <div className="relative rounded-2xl overflow-hidden mb-6 fade-up">
        <img
          src={user.cover}
          alt=""
          className="h-40 sm:h-52 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div className="relative -mt-16 px-2 mb-8 fade-up">
        <img
          src={user.avatar}
          alt=""
          className="size-24 rounded-full border-4 border-background bg-secondary shadow-lg"
        />
        <h1 className="font-display text-2xl font-700 mt-3">{user.name}</h1>
        <p className="text-muted-foreground text-sm">@{user.handle}</p>
        <p className="mt-3 text-sm max-w-lg leading-relaxed">{user.bio}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {user.facets.map((f) => (
            <span
              key={f}
              className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary"
            >
              {f}
            </span>
          ))}
          <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--mira-jade)]/15 text-[var(--mira-jade)]">
            {user.craft}
          </span>
        </div>
        <div className="flex gap-6 mt-4 text-sm">
          <span>
            <strong>{user.followerCount.toLocaleString("de")}</strong>{" "}
            <span className="text-muted-foreground">Follower</span>
          </span>
          <span>
            <strong>{user.followingCount.toLocaleString("de")}</strong>{" "}
            <span className="text-muted-foreground">Folgt</span>
          </span>
          <span>
            <strong>{user.villageIds.length}</strong>{" "}
            <span className="text-muted-foreground">Dorf</span>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onResonate={() => resonate.mutate({ postId: post.id })}
            onSave={() => save.mutate({ postId: post.id })}
          />
        ))}
      </div>
    </MiraShell>
  );
}
