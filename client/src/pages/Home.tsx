import { BRAND, FEED_LENSES, SIGNAL_TYPES } from "@shared/brand";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1800&q=80";

const PILLARS = [
  {
    title: "Vier Linsen",
    text: "Pulse, Canvas, Stream und Depth in einem Netzwerk — Format folgt Absicht, nicht App-Silo.",
  },
  {
    title: "Algorithmus-Regler",
    text: "Chronologie und Discovery mischst du selbst. Transparent. Exportierbar. Kein Blackbox-Gefühl.",
  },
  {
    title: "Signale statt Likes",
    text: "Amplify, Echo, Agree, Collect — Absicht statt leerer Herzchen-Ökonomie.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Full-bleed hero — brand first */}
      <section className="relative min-h-[100dvh] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Menschen in Gemeinschaft"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.03_165)] via-[oklch(0.22_0.04_165_/0.55)] to-[oklch(0.3_0.04_160_/0.25)]" />
        <div className="absolute inset-0 grain" />

        <div className="relative container flex min-h-[100dvh] flex-col justify-end pb-16 pt-28 text-white">
          <motion.p
            className="animate-rise text-sm uppercase tracking-[0.28em] text-white/70"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Arbeitsname · Social Portal
          </motion.p>
          <motion.h1
            className="mt-3 max-w-3xl font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
          >
            {BRAND.name}
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-lg text-white/85 sm:text-xl text-balance"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            {BRAND.tagline}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28 }}
          >
            <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90">
              <Link href="/feed">
                Feed öffnen <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/konzept">Warum es das noch nicht gibt</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="container py-20 md:py-28">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Das Beste aus allem</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl md:text-5xl text-balance">
          Nicht noch eine App. Eine Schicht darüber.
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              className="border-t border-primary/30 pt-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="font-display text-2xl">{p.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,oklch(0.92_0.03_155),oklch(0.95_0.04_85_/0.5),oklch(0.93_0.02_170))]" />
        <div className="relative container">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm uppercase tracking-[0.18em]">Vier Linsen</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEED_LENSES.map((l) => (
              <div key={l.id} className="mist-panel rounded-2xl p-5">
                <p className="font-display text-2xl">{l.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{l.blurb}</p>
                <p className="mt-4 text-[11px] uppercase tracking-wider text-primary/80">
                  {l.inspiredBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20 md:py-28">
        <h2 className="font-display text-4xl md:text-5xl">Signale mit Absicht</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Statt eines Likes wählst du, was du meinst — Reichweite, Kontext, Zustimmung oder Sammlung.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNAL_TYPES.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card/60 p-5">
              <span className="text-2xl" aria-hidden>
                {s.emoji}
              </span>
              <p className="mt-2 font-display text-xl">{s.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/feed">Jetzt ausprobieren</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
