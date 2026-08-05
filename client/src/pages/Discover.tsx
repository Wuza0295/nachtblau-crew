import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MiraShell } from "@/components/mira/MiraShell";
import { PostCard } from "@/components/mira/PostCard";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function DiscoverPage() {
  const utils = trpc.useUtils();
  const { data } = trpc.mira.discover.useQuery();
  const gatherings = trpc.mira.gatherings.useQuery();
  const toggleG = trpc.mira.toggleGathering.useMutation({
    onSuccess: () => utils.mira.gatherings.invalidate(),
  });
  const toggleC = trpc.mira.toggleCircle.useMutation({
    onSuccess: () => utils.mira.discover.invalidate(),
  });
  const resonate = trpc.mira.toggleResonance.useMutation({
    onSuccess: () => utils.mira.discover.invalidate(),
  });
  const save = trpc.mira.toggleSave.useMutation({
    onSuccess: () => utils.mira.discover.invalidate(),
  });

  return (
    <MiraShell>
      <div className="mb-8 fade-up">
        <h1 className="font-display text-3xl font-700 tracking-tight">
          Entdecken
        </h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Drift mit Absicht – TikTok-Entdeckung, Pinterest-Sammeln, Facebook
          Gatherings. Ohne Ragebait-Maschine.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="font-display text-xl font-600 mb-4">Gatherings</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {gatherings.data?.map((g) => (
            <article key={g.id} className="glass rounded-2xl p-4 fade-up">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="size-3.5" />
                {format(new Date(g.when), "EEE d. MMM · HH:mm", { locale: de })}
              </div>
              <h3 className="font-display font-600 text-lg leading-snug">
                {g.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {g.description}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {g.where}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs inline-flex items-center gap-1">
                  <Users className="size-3.5" />
                  {g.attendeeCount}
                </span>
                <button
                  type="button"
                  onClick={() => toggleG.mutate({ id: g.id })}
                  className={`text-sm px-3 py-1.5 rounded-full ${
                    g.going
                      ? "bg-secondary"
                      : "bg-[var(--mira-jade)] text-primary-foreground"
                  }`}
                >
                  {g.going ? "Zugesagt" : "Zusagen"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-xl font-600 mb-4">Neue Circles</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {data?.circles.map((c) => (
            <div
              key={c.id}
              className="shrink-0 w-56 glass rounded-2xl overflow-hidden"
            >
              <img
                src={c.cover}
                alt=""
                className="h-28 w-full object-cover"
              />
              <div className="p-3">
                <Link
                  href={`/circles/${c.slug}`}
                  className="font-medium text-sm hover:underline"
                >
                  {c.name}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleC.mutate({ id: c.id })}
                  className="mt-2 w-full text-xs py-1.5 rounded-full bg-[var(--mira-jade)] text-primary-foreground"
                >
                  Beitreten
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-xl font-600 mb-4">Menschen</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data?.people.map((u) => (
            <Link
              key={u.id}
              href={`/profil/${u.id}`}
              className="glass rounded-2xl p-4 text-center hover:bg-secondary/40 transition-colors"
            >
              <img
                src={u.avatar}
                alt=""
                className="size-14 rounded-full mx-auto bg-secondary"
              />
              <p className="font-medium text-sm mt-2 truncate">{u.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {u.craft}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-600 mb-4">Trending</h2>
        <div className="space-y-4">
          {data?.trending.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onResonate={() => resonate.mutate({ postId: post.id })}
              onSave={() => save.mutate({ postId: post.id })}
            />
          ))}
        </div>
      </section>
    </MiraShell>
  );
}
