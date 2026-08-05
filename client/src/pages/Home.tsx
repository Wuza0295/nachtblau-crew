import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { SITE } from "@/lib/site";
import {
  ArrowRight,
  Compass,
  Orbit,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Home() {
  const { data: manifesto } = trpc.social.manifesto.useQuery();

  return (
    <div className="overflow-hidden">
      {/* Hero — one composition */}
      <section className="relative min-h-[100svh] flex items-end pb-16 md:pb-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${SITE.heroBgUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.12_0.03_195)] via-[oklch(0.12_0.03_195_/0.75)] to-[oklch(0.14_0.028_195_/0.35)]" />
        <div className="absolute inset-0 flux-mesh opacity-40 mix-blend-soft-light" />

        <div className="container relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="font-display text-5xl md:text-7xl font-extrabold flux-gradient-text tracking-tight">
                {SITE.name}
              </span>
              <span className="self-start mt-3 text-[10px] uppercase tracking-[0.2em] text-primary/90 border border-primary/40 rounded-full px-2.5 py-1">
                Name folgt
              </span>
            </div>
            <p className="text-xl md:text-2xl text-foreground/90 font-medium max-w-xl leading-snug">
              {SITE.tagline}
            </p>
            <p className="text-muted-foreground max-w-lg leading-relaxed">
              Das Beste aus allen Social-Apps — in einem Portal, das du steuerst. Kein
              Einheits-Algorithmus. Modi, Radar, Circles, Moments.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 font-semibold">
                <Link href="/feed">
                  Feed öffnen <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/radar">
                  <Compass className="h-4 w-4" /> Radar entdecken
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* One job: what makes FLUX different */}
      <section className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Aus allen Welten. Neu zusammengesetzt.
          </h2>
          <p className="text-muted-foreground text-lg">
            Recherche-Synthese: Was Nutzer wirklich wollen — Kontrolle, Nähe, Discovery und
            Substanz — ohne fünf Apps parallel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {(manifesto?.pillars ?? []).map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="space-y-2 border-t border-border/50 pt-5"
            >
              <div className="text-[11px] uppercase tracking-widest text-primary/80">
                Inspiration: {p.from}
              </div>
              <h3 className="font-display text-xl font-semibold">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* One job: enter the product surfaces */}
      <section className="border-t border-border/40 bg-secondary/20">
        <div className="container py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              href: "/feed",
              icon: Radio,
              title: "Feed-Modi",
              text: "Chronik · Nah · Entdecken · Fokus",
            },
            {
              href: "/pulse",
              icon: Zap,
              title: "Pulse",
              text: "Vertikales Entdecken mit Absicht",
            },
            {
              href: "/circles",
              icon: Orbit,
              title: "Circles",
              text: "Reddit-Threads + Discord-Live",
            },
            {
              href: "/radar",
              icon: Compass,
              title: "Radar",
              text: "»Mehr X, weniger Y« — sofort",
            },
          ].map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={item.href}
                className="block group h-full p-5 rounded-2xl border border-border/40 hover:border-primary/40 bg-background/40 transition-colors"
              >
                <item.icon className="h-6 w-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-display font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-16 text-center space-y-4">
        <Sparkles className="h-6 w-6 text-primary mx-auto" />
        <p className="font-display text-2xl font-semibold">
          Name kommt im Nachhinein — das System steht.
        </p>
        <Button asChild size="lg">
          <Link href="/feed">Jetzt rein</Link>
        </Button>
      </section>
    </div>
  );
}
