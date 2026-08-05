import { Link } from "wouter";
import { SITE, LENSES, RESONANCE } from "@shared/site";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: stats } = trpc.social.stats.useQuery();

  return (
    <div className="lyra-grain relative overflow-hidden">
      {/* Hero — one composition, brand first */}
      <section className="relative min-h-[100svh] flex flex-col justify-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden
        >
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[oklch(0.88_0.06_160/0.55)] blur-3xl animate-lyra-float" />
          <div className="absolute bottom-10 right-[-10%] h-[380px] w-[380px] rounded-full bg-[oklch(0.88_0.08_50/0.4)] blur-3xl" />
          <div className="absolute top-1/3 left-[-8%] h-[280px] w-[280px] rounded-full bg-[oklch(0.9_0.04_200/0.35)] blur-3xl" />
          {/* Dominant visual plane */}
          <div
            className="absolute inset-x-0 bottom-0 h-[42%] opacity-90"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, oklch(0.55 0.08 170 / 0.12) 40%, oklch(0.42 0.09 170 / 0.28) 100%)",
            }}
          />
          <svg
            className="absolute inset-x-0 bottom-0 w-full h-[38%] text-primary/20"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,144C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L0,320Z"
            />
          </svg>
        </div>

        <div className="container relative pt-10 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-3xl"
          >
            <p className="font-display text-[clamp(4.5rem,14vw,9rem)] font-extrabold leading-[0.85] tracking-tight text-[var(--lyra-teal-deep)]">
              {SITE.name}
            </p>
            <h1 className="mt-6 font-display text-2xl sm:text-4xl font-semibold text-balance text-foreground/90 max-w-xl">
              {SITE.tagline}
            </h1>
            <p className="mt-4 max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed">
              Discovery wie TikTok. Nähe wie Instagram. Circles wie Reddit und Discord.
              Tiefe wie LinkedIn. Authentizität wie BeReal — in einem Netzwerk, mit Resonance statt Likes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
              >
                Eintreten
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-6 py-3.5 text-sm font-semibold backdrop-blur hover:bg-secondary/60"
              >
                Das Konzept
              </Link>
            </div>
            {stats && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 text-sm text-muted-foreground"
              >
                <span className="font-semibold text-foreground">{stats.posts}</span> Beiträge ·{" "}
                <span className="font-semibold text-foreground">{stats.circles}</span> Circles ·{" "}
                <span className="font-semibold text-foreground">{stats.gatherings}</span> Live Gatherings
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* One job: Lenses */}
      <section className="container py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--lyra-teal-deep)]">
            Vier Lenses. Eine Welt.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Dieselbe Inhalte — unterschiedliche Sicht. Wechsle die Frequenz, nicht die App.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {LENSES.map((lens, i) => (
            <motion.div
              key={lens.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="border-t border-border pt-5"
            >
              <p className="font-display text-2xl font-bold">{lens.label}</p>
              <p className="mt-2 text-muted-foreground leading-relaxed">{lens.description}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-primary/80">{lens.from}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* One job: Resonance */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.42 0.09 170 / 0.08), oklch(0.62 0.14 45 / 0.1))",
          }}
        />
        <div className="container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Resonance</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--lyra-teal-deep)]">
              Kein Like. Drei Signale.
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Spark trifft. Depth berührt. Echo trägt weiter. So siehst du, wie Inhalte wirklich ankommen —
              nicht nur, wie laut sie sind.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {RESONANCE.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-background/70 border border-border/70 p-6 backdrop-blur"
              >
                <p className="font-display text-xl font-bold">{r.label}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 sm:py-28 text-center">
        <h2 className="font-display text-3xl sm:text-5xl font-bold text-balance text-[var(--lyra-teal-deep)]">
          Bereit für eine andere Frequenz?
        </h2>
        <p className="mt-4 text-muted-foreground">Demo-Daten sind geladen — einfach eintreten und spielen.</p>
        <Link
          href="/app"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--lyra-ember)] px-8 py-4 text-sm font-bold text-accent-foreground shadow-lg transition hover:brightness-105"
        >
          Zur App
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
