import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { MiraShell, ModeSwitcher } from "@/components/mira/MiraShell";
import { PostCard } from "@/components/mira/PostCard";
import { MomentRail } from "@/components/mira/MomentRail";
import { FEED_MODES } from "@shared/mira";
import { CheckCircle2, Infinity as InfinityIcon } from "lucide-react";

export default function FeedPage() {
  const [mode, setMode] = useState<"nahe" | "fokus" | "drift">("nahe");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.mira.feed.useQuery({ mode });
  const recipes = trpc.mira.recipes.useQuery();
  const resonate = trpc.mira.toggleResonance.useMutation({
    onSuccess: () => utils.mira.feed.invalidate(),
  });
  const save = trpc.mira.toggleSave.useMutation({
    onSuccess: () => {
      utils.mira.feed.invalidate();
      utils.mira.vault.invalidate();
    },
  });
  const setRecipe = trpc.mira.setActiveRecipe.useMutation({
    onSuccess: () => {
      utils.mira.recipes.invalidate();
      utils.mira.feed.invalidate();
    },
  });

  const modeMeta = FEED_MODES.find((m) => m.id === mode)!;

  return (
    <MiraShell>
      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-700 tracking-tight">
                {modeMeta.label}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {modeMeta.blurb}
              </p>
            </div>
            <ModeSwitcher mode={mode} onChange={setMode} />
          </div>

          <div className="fade-up fade-up-delay-1">
            <MomentRail />
          </div>

          <div className="glass rounded-2xl px-4 py-3 flex items-start gap-3 fade-up fade-up-delay-2">
            {data?.finite ? (
              <CheckCircle2 className="size-5 text-[var(--mira-jade)] shrink-0 mt-0.5" />
            ) : (
              <InfinityIcon className="size-5 text-[var(--mira-gold)] shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-medium">
                {data?.finite
                  ? "Endlicher Feed – wenn alle gelesen haben, ist Schluss."
                  : "Entdeckungsmodus – gesteuert von Interesse und Rezept."}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Inspiriert von {modeMeta.inspiredBy}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4"
            >
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="glass rounded-2xl h-48 mira-shimmer"
                    />
                  ))}
                </div>
              )}
              {data?.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onResonate={() => resonate.mutate({ postId: post.id })}
                  onSave={() => save.mutate({ postId: post.id })}
                />
              ))}
              {data?.finite && data.posts.length > 0 && (
                <div className="text-center py-10 fade-up">
                  <p className="font-display text-xl font-600 text-gradient">
                    Du bist durch.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Dein Dorf hat gesprochen. Komm später wieder – oder wechsle
                    zu Fokus / Drift, wenn du magst.
                  </p>
                </div>
              )}
              {!isLoading && data?.posts.length === 0 && (
                <div className="glass rounded-2xl p-10 text-center">
                  <p className="font-display text-lg">Noch still hier.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tritt Circles bei oder wechsle den Modus.
                  </p>
                  <Link
                    href="/circles"
                    className="inline-block mt-4 text-sm text-[var(--mira-jade)] hover:underline"
                  >
                    Circles entdecken →
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block space-y-4">
          <div className="glass rounded-2xl p-4 sticky top-20">
            <h2 className="font-display font-600 text-sm mb-3">
              Aktives Rezept
            </h2>
            <div className="space-y-2">
              {recipes.data?.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    setRecipe.mutate({ id: r.active ? null : r.id })
                  }
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                    r.active
                      ? "bg-[var(--mira-jade)]/12 border border-[var(--mira-jade)]/30"
                      : "hover:bg-secondary/80"
                  }`}
                >
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {r.intent}
                  </div>
                </button>
              ))}
            </div>
            <Link
              href="/recipes"
              className="block mt-3 text-xs text-[var(--mira-jade)] hover:underline"
            >
              Rezepte verwalten →
            </Link>
          </div>
        </aside>
      </div>
    </MiraShell>
  );
}
