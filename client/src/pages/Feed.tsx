import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PostCard from "@/components/PostCard";
import MomentsRail from "@/components/MomentsRail";
import type { LensId } from "@shared/social";
import { LENSES } from "@shared/site";
import { Link } from "wouter";
import { Radio } from "lucide-react";
import { motion } from "framer-motion";

function lensFromPath(path: string): LensId {
  if (path.includes("/orbit")) return "orbit";
  if (path.includes("/depth")) return "depth";
  if (path.includes("/circles")) return "circles";
  return "pulse";
}

export default function Feed() {
  const [location] = useLocation();
  const lens = lensFromPath(location);
  const meta = LENSES.find((l) => l.id === lens)!;

  const { data: feed, isLoading } = trpc.social.feed.useQuery({ lens });
  const { data: moments } = trpc.social.moments.useQuery(undefined, {
    enabled: lens === "pulse" || lens === "orbit",
  });
  const { data: gatherings } = trpc.social.gatherings.useQuery(undefined, {
    enabled: lens === "pulse" || lens === "circles",
  });
  const { data: suggested } = trpc.social.suggested.useQuery();

  const title = useMemo(() => meta.label, [meta]);

  return (
    <div className="container py-6 sm:py-10">
      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div>
          <header className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{meta.from}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--lyra-teal-deep)] mt-1">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">{meta.description}</p>
          </header>

          {(lens === "pulse" || lens === "orbit") && moments && (
            <MomentsRail moments={moments} />
          )}

          {lens === "pulse" && gatherings && gatherings.length > 0 && (
            <section className="mb-6">
              <h2 className="font-display text-lg font-bold mb-3">Live Gatherings</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {gatherings.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/circles/${g.circle.slug}`}
                      className="relative flex min-w-[220px] items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 hover:border-primary/30 transition"
                    >
                      <span className="relative flex h-3 w-3">
                        <span
                          className="absolute inset-0 rounded-full bg-[var(--lyra-ember)] animate-lyra-pulse-ring"
                        />
                        <span className="relative h-3 w-3 rounded-full bg-[var(--lyra-ember)]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{g.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.circle.name} · {g.participantCount} dabei
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-4">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-secondary/60 animate-pulse"
                />
              ))}
            {!isLoading && feed?.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="font-display text-xl font-semibold">Noch ruhig hier</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lens === "orbit"
                    ? "Folge Menschen, damit Orbit sich füllt."
                    : lens === "circles"
                      ? "Tritt Circles bei, um Community-Posts zu sehen."
                      : "Sei der erste Beitrag."}
                </p>
                <Link
                  href="/compose"
                  className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Compose öffnen
                </Link>
              </div>
            )}
            {feed?.map((post) => (
              <PostCard key={post.id} post={post} featured={post.type === "signal"} />
            ))}
          </div>
        </div>

        <aside className="hidden lg:block space-y-6 sticky top-24">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Radio className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.18em]">Resonance</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Spark · Depth · Echo — reagiere darauf, wie ein Beitrag ankommt, nicht nur ob du ihn „liked“.
            </p>
          </div>

          {suggested && (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <h2 className="font-display text-lg font-bold mb-4">Entdecken</h2>
              <ul className="space-y-3">
                {suggested.map((p) => (
                  <li key={p.id}>
                    <Link href={`/u/${p.handle}`} className="flex items-center gap-3 group">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: p.accent }}
                      >
                        {p.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">@{p.handle}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
