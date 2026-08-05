import { Link } from "wouter";
import { motion } from "framer-motion";
import { SITE, MOODS } from "@shared/site";
import { Logo } from "@/components/CadenceNav";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Radio,
  Sparkles,
  Waves,
} from "lucide-react";

export default function Landing() {
  const { data: features = [] } = trpc.social.features.useQuery();

  return (
    <div className="min-h-dvh">
      {/* Hero — one composition, brand first, full-bleed atmosphere */}
      <section className="relative min-h-dvh flex flex-col overflow-hidden grain">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, oklch(0.92 0.04 175) 0%, oklch(0.88 0.05 190) 35%, oklch(0.78 0.07 175) 70%, oklch(0.45 0.08 175) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, transparent 0%, oklch(0.3 0.05 175 / 0.35) 100%), url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f766e' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        {/* Photographic atmosphere plane — abstract city/horizon as dominant visual */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(to top, oklch(0.35 0.06 175 / 0.85), transparent 45%), radial-gradient(ellipse at 70% 60%, oklch(0.7 0.08 85 / 0.4), transparent 50%)",
          }}
        />

        <header className="relative z-10 px-4 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
          <Logo />
          <Link
            href="/app"
            className="text-sm font-semibold text-[oklch(0.28_0.04_165_/0.8)] hover:text-foreground transition"
          >
            Öffnen
          </Link>
        </header>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 pb-20 max-w-6xl mx-auto w-full">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold tracking-wide text-primary-foreground/80 mb-4 md:text-primary/90"
            style={{ color: "oklch(0.28 0.04 175)" }}
          >
            {SITE.workingNameNote}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
            className="font-display text-[clamp(3.5rem,12vw,8rem)] font-extrabold leading-[0.9] text-[oklch(0.18_0.04_165)] max-w-4xl"
          >
            {SITE.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-xl md:text-2xl font-medium text-[oklch(0.28_0.04_165)] max-w-xl"
          >
            {SITE.tagline}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-3 text-base text-[oklch(0.32_0.03_165_/0.85)] max-w-lg"
          >
            Das Beste aus Instagram, TikTok, X, Discord, Reddit, Bluesky, BeReal und
            LinkedIn — in einem Portal, das Resonanz misst statt Aufmerksamkeit.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-2xl bg-[oklch(0.22_0.04_165)] text-white px-6 py-3.5 text-sm font-bold shadow-lg hover:brightness-110 transition"
            >
              Frequenz öffnen
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#warum"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/50 backdrop-blur px-6 py-3.5 text-sm font-semibold text-[oklch(0.25_0.04_165)] border border-white/40 hover:bg-white/70 transition"
            >
              Warum Cadence
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[oklch(0.28_0.04_165_/0.7)] text-xs font-medium"
        >
          <Waves className="size-4 animate-wave" />
          Scrollen
        </motion.div>
      </section>

      {/* Frequencies */}
      <section id="warum" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold text-primary mb-2">Eine Oberfläche, fünf Frequenzen</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold max-w-2xl leading-tight">
            Du wählst, wie das Netz klingt.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Statt eines Algorithmus für alles: fünf klare Modi — inspiriert vom Besten
            jeder Plattform, ohne deren schlechtesten Tricks.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MOODS.map((m, i) => (
              <div
                key={m.id}
                className="rounded-3xl border border-border bg-card/80 p-5 animate-rise"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <Radio className="size-5 text-primary mb-3" />
                <h3 className="font-display text-xl font-bold">{m.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {m.description}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-wide font-semibold text-primary/70">
                  {m.inspiredBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research synthesis */}
      <section className="py-24 px-4 bg-[oklch(0.22_0.04_165)] text-[oklch(0.95_0.01_160)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-teal-300 text-sm font-semibold mb-3">
            <Sparkles className="size-4" />
            Aus der Recherche 2026
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold max-w-3xl leading-tight">
            Was wir von jedem Netzwerk mitgenommen haben
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={f.from}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-rise"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300/90">
                  {f.from}
                </p>
                <p className="mt-2 font-medium">{f.take}</p>
                <p className="mt-2 text-sm text-white/65">→ {f.inCadence}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-4 atmosphere relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            Bereit für deine Frequenz?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Name folgt. Das Gefühl ist schon da.
          </p>
          <Link
            href="/app"
            className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-8 py-4 text-sm font-bold shadow-lg hover:brightness-110 transition"
          >
            Cadence öffnen
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <p>
          <span className="font-display font-bold text-foreground">{SITE.name}</span>
          {" · "}
          {SITE.workingNameNote}
        </p>
      </footer>
    </div>
  );
}
