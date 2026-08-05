import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import PostCard from "@/components/PostCard";
import { ArrowLeft, Users } from "lucide-react";

export default function CircleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.social.circle.useQuery({ slug }, { enabled: !!slug });
  const join = trpc.social.joinCircle.useMutation({
    onSuccess: () => utils.social.circle.invalidate({ slug }),
  });
  const leave = trpc.social.leaveCircle.useMutation({
    onSuccess: () => utils.social.circle.invalidate({ slug }),
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-40 rounded-2xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <p className="font-display text-2xl font-bold">Circle nicht gefunden</p>
        <Link href="/circles" className="mt-4 inline-block text-primary hover:underline">
          Zurück zu Circles
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-10">
      <Link
        href="/circles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Alle Circles
      </Link>

      <header
        className="relative overflow-hidden rounded-3xl border border-border/70 p-6 sm:p-8 mb-8"
        style={{
          background: `linear-gradient(135deg, ${data.accent}22, transparent 60%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {data.topic}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold mt-1">{data.name}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">{data.description}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {data.memberCount.toLocaleString("de-DE")} Mitglieder
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              data.isMember
                ? leave.mutate({ circleId: data.id })
                : join.mutate({ circleId: data.id })
            }
            className={
              data.isMember
                ? "rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                : "rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            }
          >
            {data.isMember ? "Mitgliedschaft beenden" : "Circle beitreten"}
          </button>
        </div>

        {data.norms?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/60">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Normen</p>
            <ul className="flex flex-wrap gap-2">
              {data.norms.map((n) => (
                <li
                  key={n}
                  className="rounded-full bg-background/80 border border-border/60 px-3 py-1.5 text-xs font-medium"
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.isGathering && data.gatheringTitle && (
          <p className="mt-5 text-sm font-semibold text-[var(--lyra-ember)]">
            ● Live Gathering: {data.gatheringTitle}
          </p>
        )}
      </header>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Beiträge</h2>
        <Link href={`/compose?circle=${data.id}`} className="text-sm font-semibold text-primary hover:underline">
          In diesen Circle posten
        </Link>
      </div>

      <div className="space-y-4 max-w-2xl">
        {data.posts.length === 0 && (
          <p className="text-sm text-muted-foreground py-8">Noch keine Beiträge in diesem Circle.</p>
        )}
        {data.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
