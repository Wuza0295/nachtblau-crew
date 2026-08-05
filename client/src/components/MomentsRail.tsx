import { Link } from "wouter";
import type { CSSProperties } from "react";
import type { PostWithMeta } from "@shared/social";
import { motion } from "framer-motion";

type Props = {
  moments: PostWithMeta[];
};

export default function MomentsRail({ moments }: Props) {
  if (!moments.length) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Moments</h2>
          <p className="text-xs text-muted-foreground">Authentisch · verschwindet in 24h</p>
        </div>
        <Link href="/compose?type=moment" className="text-xs font-semibold text-primary hover:underline">
          Deinen Moment teilen
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {moments.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="snap-start"
          >
            <Link
              href={`/post/${m.id}`}
              className="relative block h-36 w-28 sm:h-40 sm:w-32 overflow-hidden rounded-2xl shadow-sm ring-2 ring-offset-2 ring-offset-background"
              style={{
                background: m.mediaGradient ?? m.author.accent,
                ["--tw-ring-color"]: m.author.accent,
              } as CSSProperties}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div
                className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/80"
                style={{ background: m.author.accent }}
              >
                {m.author.avatar}
              </div>
              <p className="absolute bottom-2 left-2 right-2 text-[11px] font-medium leading-snug text-white line-clamp-3">
                {m.content}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
