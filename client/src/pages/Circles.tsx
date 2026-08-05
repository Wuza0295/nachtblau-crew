import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MiraShell } from "@/components/mira/MiraShell";
import { PostCard } from "@/components/mira/PostCard";
import {
  Focus,
  Headphones,
  MapPin,
  Palette,
  Radio,
  Users,
} from "lucide-react";

const ICONS: Record<string, typeof Palette> = {
  Palette,
  Radio,
  MapPin,
  Focus,
  Headphones,
  Users,
};

export default function CirclesPage() {
  const utils = trpc.useUtils();
  const { data: circles } = trpc.mira.circles.useQuery();
  const toggle = trpc.mira.toggleCircle.useMutation({
    onSuccess: () => utils.mira.circles.invalidate(),
  });

  return (
    <MiraShell>
      <div className="mb-8 fade-up">
        <h1 className="font-display text-3xl font-700 tracking-tight">
          Circles
        </h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Discord-tiefe Räume mit Reddit-Qualitätssignal. Themen, Kanäle,
          Menschen – ohne endlosen Global-Feed.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {circles?.map((c, i) => {
          const Icon = ICONS[c.icon] ?? Users;
          return (
            <article
              key={c.id}
              className="glass rounded-2xl overflow-hidden fade-up group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={c.cover}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--mira-ink)]/70 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2 text-white">
                    <Icon className="size-5" />
                    <h2 className="font-display font-700 text-xl">{c.name}</h2>
                  </div>
                  <span className="text-white/80 text-xs">
                    {c.memberCount.toLocaleString("de")} Mitglieder
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.channels.map((ch) => (
                    <span
                      key={ch.id}
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                    >
                      {ch.kind === "voice" ? "🎙" : "#"} {ch.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Link
                    href={`/circles/${c.slug}`}
                    className="text-sm font-medium text-[var(--mira-jade)] hover:underline"
                  >
                    Öffnen →
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle.mutate({ id: c.id })}
                    className={`ml-auto text-sm px-3 py-1.5 rounded-full transition-colors ${
                      c.joined
                        ? "bg-secondary text-foreground"
                        : "bg-[var(--mira-jade)] text-primary-foreground"
                    }`}
                  >
                    {c.joined ? "Beigetreten" : "Beitreten"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </MiraShell>
  );
}

export function CircleDetailPage({ slug }: { slug: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.mira.circle.useQuery({ slug });
  const resonate = trpc.mira.toggleResonance.useMutation({
    onSuccess: () => utils.mira.circle.invalidate({ slug }),
  });
  const save = trpc.mira.toggleSave.useMutation({
    onSuccess: () => utils.mira.circle.invalidate({ slug }),
  });
  const toggle = trpc.mira.toggleCircle.useMutation({
    onSuccess: () => utils.mira.circle.invalidate({ slug }),
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
        <p>Circle nicht gefunden.</p>
      </MiraShell>
    );
  }

  const { circle, posts } = data;

  return (
    <MiraShell>
      <div className="relative rounded-2xl overflow-hidden h-48 mb-6 fade-up">
        <img
          src={circle.cover}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--mira-ink)]/80 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-700 text-white">
              {circle.name}
            </h1>
            <p className="text-white/75 text-sm mt-1 max-w-lg">
              {circle.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggle.mutate({ id: circle.id })}
            className="shrink-0 rounded-full bg-white text-[var(--mira-ink)] px-4 py-2 text-sm font-medium"
          >
            {circle.joined ? "Mitglied" : "Beitreten"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
        {circle.channels.map((ch) => (
          <span
            key={ch.id}
            className="shrink-0 glass rounded-full px-3 py-1.5 text-sm"
          >
            {ch.kind === "voice" ? "🎙" : "#"} {ch.name}
          </span>
        ))}
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
        {posts.length === 0 && (
          <p className="text-muted-foreground text-sm">Noch keine Posts.</p>
        )}
      </div>
    </MiraShell>
  );
}
