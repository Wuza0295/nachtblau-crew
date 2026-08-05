import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function CirclesPage() {
  const utils = trpc.useUtils();
  const { data: circles, isLoading } = trpc.social.circles.useQuery();
  const join = trpc.social.joinCircle.useMutation({
    onSuccess: () => utils.social.circles.invalidate(),
  });
  const leave = trpc.social.leaveCircle.useMutation({
    onSuccess: () => utils.social.circles.invalidate(),
  });

  return (
    <div className="container py-8 sm:py-12">
      <header className="max-w-2xl mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Reddit · Discord
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-[var(--lyra-teal-deep)] mt-1">
          Circles
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Mikro-Communities mit Normen, Stewardship und Gatherings, die wieder verschwinden —
          wenn die Energie weg ist.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-secondary/60 animate-pulse" />
          ))}
        {circles?.map((c, i) => (
          <motion.article
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-6"
          >
            <div
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ background: c.accent }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/circles/${c.slug}`}>
                  <h2 className="font-display text-2xl font-bold hover:text-primary transition-colors">
                    {c.name}
                  </h2>
                </Link>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.topic}
                </p>
              </div>
              {c.isGathering && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lyra-ember)]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--lyra-ember)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lyra-ember)] animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
            {c.isGathering && c.gatheringTitle && (
              <p className="mt-3 text-sm font-medium text-foreground/90">
                Gathering: {c.gatheringTitle}
              </p>
            )}
            <div className="mt-5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {c.memberCount.toLocaleString("de-DE")} Mitglieder
              </span>
              <button
                type="button"
                onClick={() =>
                  c.isMember
                    ? leave.mutate({ circleId: c.id })
                    : join.mutate({ circleId: c.id })
                }
                className={
                  c.isMember
                    ? "rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-secondary"
                    : "rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                }
              >
                {c.isMember ? "Mitglied" : "Beitreten"}
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
