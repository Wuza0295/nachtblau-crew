import { Link } from "wouter";
import { motion } from "framer-motion";
import { SITE, LENSES } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const concept = trpc.social.concept.useQuery();

  return (
    <div>
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="absolute inset-0 aurora-plane" />
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-[oklch(0.7_0.1_185/0.35)] blur-3xl animate-drift" />
        <div className="absolute right-0 bottom-10 h-80 w-80 rounded-full bg-[oklch(0.8_0.1_75/0.3)] blur-3xl animate-drift" style={{ animationDelay: "2s" }} />

        <div className="container relative z-10 pt-20 pb-16 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-5">
              Arbeitsname · Social Spectrum Portal
            </p>
            <h1 className="font-display text-[clamp(3.2rem,10vw,6.5rem)] leading-[0.92] font-bold brand-mark">
              {SITE.name}
            </h1>
            <p className="mt-6 text-2xl sm:text-3xl font-display text-foreground/90 max-w-2xl">
              {SITE.heroLine}
            </p>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl leading-relaxed">
              {SITE.supportLine}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/home">
                <Button size="lg" className="rounded-full px-7 h-12 text-base shadow-lg shadow-primary/25">
                  Spektrum öffnen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/algorithm">
                <Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-base bg-white/40">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Dein Algorithmus
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold max-w-2xl">
            Das Beste aus allen Welten — ohne App-Chaos
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Jede große Plattform hat eine Stärke. Aether macht daraus Linsen auf dasselbe soziale Leben.
          </p>
        </motion.div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LENSES.map((lens, i) => (
            <motion.div
              key={lens.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group"
            >
              <Link href={lens.href} className="block">
                <div className="pb-4 border-b border-border/80 group-hover:border-primary/50 transition-colors">
                  <div className="text-xs uppercase tracking-[0.2em] text-primary mb-2">{lens.from}</div>
                  <h3 className="font-display text-2xl font-semibold">{lens.label}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{lens.blurb}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="aether-shell rounded-[2rem] p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/2 aurora-plane opacity-40 pointer-events-none" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-bold">Was es so noch nicht gibt</h2>
            <ul className="mt-6 space-y-4">
              {(concept.data?.unique ?? [
                "Linsen statt App-Silos",
                "Session-Intent formt Feed und UI",
                "Algorithmus-Gewichte, die du siehst und steuerst",
              ]).map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/ueber">
                <Button variant="outline" className="rounded-full bg-white/50">
                  Forschungs-Konzept lesen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
