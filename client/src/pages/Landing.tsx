import { Link } from "wouter";
import { motion } from "framer-motion";
import { SITE } from "@/lib/site";
import { PLATFORM_DNA, FEED_MODES } from "@shared/mira";
import {
  ArrowRight,
  Compass,
  Radio,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* Atmospheric blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-[var(--mira-jade)]/15 blur-3xl drift" />
        <div
          className="absolute top-1/3 -right-20 size-[380px] rounded-full bg-[var(--mira-gold)]/20 blur-3xl drift"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 size-[300px] rounded-full bg-[oklch(0.7_0.06_220)]/20 blur-3xl pulse-soft"
        />
      </div>

      <header className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-9 rounded-full bg-[var(--mira-jade)] text-primary-foreground grid place-items-center font-display font-700 shadow-[0_10px_30px_oklch(0.48_0.1_175/0.35)]">
            M
          </span>
          <span className="font-display font-700 text-xl">{SITE.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Name folgt
          </span>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--mira-ink)] text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Öffnen
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Hero – brand first, one composition */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 sm:pt-24 pb-20 min-h-[85dvh] flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-3xl"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-6">
            Arbeitstitel · Social Portal
          </p>
          <h1 className="font-display font-800 text-[clamp(3.5rem,12vw,8rem)] leading-[0.9] tracking-tight text-gradient">
            {SITE.name}
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-[var(--mira-slate)] max-w-xl leading-snug">
            {SITE.tagline}
          </p>
          <p className="mt-4 text-base text-muted-foreground max-w-lg">
            Das Beste aus Instagram, TikTok, Discord, Bluesky, LinkedIn, Reddit
            und BeReal – neu zusammengesetzt um Absicht, nicht um Sucht.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--mira-jade)] text-primary-foreground px-6 py-3 text-sm font-semibold shadow-[0_16px_40px_oklch(0.48_0.1_175/0.35)] hover:scale-[1.02] transition-transform"
            >
              Feed betreten
              <Waves className="size-4" />
            </Link>
            <a
              href="#dna"
              className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Die DNA ansehen
            </a>
          </div>
        </motion.div>

        {/* Full-bleed visual plane */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-y-8 right-0 w-[42%] hidden lg:block pointer-events-none"
        >
          <div className="relative h-full rounded-l-[3rem] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1506905929186-6ce5c8baf3c5?auto=format&fit=crop&w=1200&h=1600&q=80"
              alt=""
              className="absolute inset-0 w-full h-full object-cover drift"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[oklch(0.97_0.012_200)]" />
            <div className="absolute bottom-10 left-10 right-10 glass-strong rounded-2xl p-4">
              <div className="flex gap-2 mb-3">
                {FEED_MODES.map((m) => (
                  <span
                    key={m.id}
                    className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary"
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium">Drei Modi. Eine Absicht.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Modes */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-display text-3xl sm:text-4xl font-700 tracking-tight max-w-lg">
          Drei Wege, online zu sein
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md">
          Du wählst den Modus – nicht ein Algorithmus, der dich hält.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { ...FEED_MODES[0], icon: Radio },
            { ...FEED_MODES[1], icon: Users },
            { ...FEED_MODES[2], icon: Compass },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative pt-2"
              >
                <div className="absolute -top-1 left-0 font-display text-6xl font-800 text-[var(--mira-jade)]/10 leading-none">
                  0{i + 1}
                </div>
                <Icon className="size-6 text-[var(--mira-jade)] mb-4" />
                <h3 className="font-display text-2xl font-700">{m.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {m.blurb}
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
                  {m.inspiredBy}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* DNA */}
      <section id="dna" className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-700 tracking-tight">
              Best of — neu verdrahtet
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg">
              Nicht ein weiteres Netzwerk. Eine Mischung aus dem, was jede
              Plattform am besten kann – ohne den Ballast.
            </p>
          </div>
          <Sparkles className="size-6 text-[var(--mira-gold)] hidden sm:block" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8">
          {PLATFORM_DNA.map((item, i) => (
            <motion.div
              key={item.from}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="border-t border-border pt-4"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {item.from}
              </p>
              <p className="font-display font-600 text-lg mt-2">{item.take}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">
                {item.why}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative rounded-[2rem] overflow-hidden min-h-[320px] flex items-center">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&h=700&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[var(--mira-ink)]/55" />
          <div className="relative px-8 sm:px-14 py-16 max-w-xl text-white">
            <h2 className="font-display text-3xl sm:text-5xl font-700 tracking-tight">
              Bereit für Absicht statt Autopilot?
            </h2>
            <p className="mt-4 text-white/75">
              Name kommt im Nachhinein. Das Erlebnis startet jetzt.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 mt-8 rounded-full bg-white text-[var(--mira-ink)] px-6 py-3 text-sm font-semibold hover:scale-[1.02] transition-transform"
            >
              MIRA öffnen
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 border-t border-border/60 flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
        <span className="font-display font-600 text-foreground">{SITE.name}</span>
        <span>Arbeitstitel · Finaler Name folgt</span>
      </footer>
    </div>
  );
}
