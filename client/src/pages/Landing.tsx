import { SITE, PLATFORM_DNA } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Sparkles, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-dvh">
      {/* Hero — one composition: brand, headline, support, CTA, full-bleed visual */}
      <section className="relative min-h-[100dvh] overflow-hidden">
        <div className="atmosphere absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="grain absolute inset-0" />

        <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-center px-6 py-20">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl font-extrabold tracking-tight text-coral sm:text-7xl md:text-8xl"
          >
            {SITE.name}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground"
          >
            Arbeitstitel · Name folgt
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 max-w-xl font-display text-3xl font-bold leading-[1.1] text-balance sm:text-4xl md:text-5xl"
          >
            Das Socialnetz, das dir die Kontrolle gibt.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {SITE.tagline} Lenses statt Blackbox, Circles statt Chaos, Signal statt Vanity-Likes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link href="/app">
              <Button size="lg" className="rounded-full px-8">
                Feed öffnen <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <a href="#dna">
              <Button size="lg" variant="outline" className="rounded-full bg-card/50 px-8 backdrop-blur">
                Was steckt drin
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <section id="dna" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Bestes aus allen Welten</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Kein Clone — eine neue Zusammensetzung. Jede Plattform hat eine Stärke. Lumen nimmt
          genau die und lässt den Ballast weg.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_DNA.map((item, i) => (
            <motion.li
              key={item.from}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05 }}
              className="border-t border-border pt-5"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-coral">{item.from}</p>
              <p className="mt-2 font-medium leading-snug">{item.takes}</p>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border/70 bg-card/40 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-3">
          {[
            {
              icon: Eye,
              title: "Lenses",
              text: "Chrono, Signal, Discover, Focus — du wählst die Gewichte. Jeder Post kann erklären, warum er da ist.",
            },
            {
              icon: Users,
              title: "Circles & Collectives",
              text: "Discord-Räume ohne Channel-Chaos. Reddit-Themen mit Signal-Voting statt Karma-Theater.",
            },
            {
              icon: Sparkles,
              title: "Signal-Score",
              text: "Antworten und Saves zählen mehr als Ragebait-Hearts. Qualität wird messbar belohnt.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <f.icon className="h-6 w-6 text-tide" />
              <h3 className="mt-4 font-display text-2xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold sm:text-5xl">Bereit für deinen Feed?</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Demo mit Live-Daten im Speicher — posten, Lenses wechseln, Circles beitreten.
        </p>
        <Link href="/app">
          <Button size="lg" className="mt-8 rounded-full px-10">
            Jetzt ausprobieren
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border/60 px-6 py-8 text-center text-xs text-muted-foreground">
        {SITE.name} · Arbeitstitel · Name kommt im Nachhinein · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
