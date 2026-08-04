import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  Gift,
  Newspaper,
  MessageSquare,
  ChevronRight,
  Gamepad2,
  Monitor,
  Flame,
  Users,
  Github,
  Globe,
  ExternalLink,
  Play,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { SITE } from "@/lib/site";

const STARS = [
  [8, 12], [18, 28], [27, 8], [35, 42], [44, 18], [52, 55], [61, 22],
  [69, 48], [78, 14], [86, 36], [12, 62], [23, 78], [41, 68], [58, 82],
  [72, 66], [91, 58], [6, 40], [33, 6], [48, 34], [64, 10], [82, 74],
  [15, 48], [39, 88], [55, 4], [75, 30], [94, 20], [4, 72], [29, 54],
  [67, 90], [88, 8], [21, 16], [46, 72], [73, 44], [97, 42], [10, 90],
  [50, 50], [31, 30], [80, 88], [60, 38], [42, 14],
] as const;

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {STARS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            width: i % 5 === 0 ? 2 : 1,
            height: i % 5 === 0 ? 2 : 1,
            left: `${x}%`,
            top: `${y}%`,
            opacity: 0.25 + (i % 4) * 0.15,
            animationDelay: `${(i % 7) * 0.4}s`,
            animationDuration: `${2.5 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  );
}

function HeroSection() {
  const { isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${SITE.heroBgUrl})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, oklch(0.08 0.03 250 / 0.96) 0%, oklch(0.09 0.025 250 / 0.82) 42%, oklch(0.1 0.04 252 / 0.55) 70%, oklch(0.1 0.03 250 / 0.75) 100%), linear-gradient(to top, oklch(0.09 0.025 250) 0%, transparent 45%)",
        }}
      />
      <StarField />

      <div
        className="absolute -right-20 top-1/4 h-[28rem] w-[28rem] rounded-full blur-3xl pointer-events-none opacity-30 animate-pulse-glow"
        style={{ background: "oklch(0.55 0.22 248)" }}
        aria-hidden
      />

      <div className="container relative z-10 pb-16 pt-28 md:py-24">
        <div className="max-w-2xl space-y-7">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-5"
          >
            <p
              className="text-xs tracking-[0.35em] uppercase text-primary/90"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Community Launcher
            </p>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.92] tracking-tight"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <span className="gradient-text text-glow block">NachtBlau</span>
              <span className="text-foreground">Crew</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
              Dein Hub für Free Games, Gaming-News und Community – alles an einem Ort.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-wrap gap-3"
          >
            {!isAuthenticated ? (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-xl shadow-primary/25 transition-all duration-200 hover:shadow-primary/40 hover:scale-[1.02]"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                Jetzt beitreten
              </Button>
            ) : (
              <Link href="/free-games">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-xl shadow-primary/25 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Free Games öffnen
                </Button>
              </Link>
            )}
            <Link href="/forum">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/35 text-foreground hover:bg-primary/10 hover:border-primary/55 font-semibold backdrop-blur-sm"
              >
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Zum Forum
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-none absolute right-4 bottom-8 hidden lg:block xl:right-12"
          aria-hidden
        >
          <div className="relative">
            <div
              className="absolute inset-8 rounded-full blur-3xl opacity-40"
              style={{ background: "oklch(0.55 0.22 248)" }}
            />
            <img
              src={SITE.logoUrl}
              alt=""
              className="relative h-56 w-56 xl:h-72 xl:w-72 object-contain animate-float drop-shadow-2xl opacity-90"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const MODULES = [
  {
    href: "/free-games",
    title: "Free Games",
    desc: "Aktuelle Giveaways von Epic, Steam und mehr – täglich frisch.",
    icon: Gift,
    accent: "from-sky-500/25 to-transparent",
  },
  {
    href: "/news",
    title: "Gaming News",
    desc: "PC, Konsolen und Steam/Valve – gefiltert und auf den Punkt.",
    icon: Newspaper,
    accent: "from-cyan-500/20 to-transparent",
  },
  {
    href: "/forum",
    title: "Community Forum",
    desc: "Diskussionen, Tipps und Crew-Austausch in allen Kategorien.",
    icon: MessageSquare,
    accent: "from-blue-500/25 to-transparent",
  },
] as const;

function LaunchModules() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-20 border-t border-border/60">
      <div className="container">
        <div className="mb-8 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Module starten</h2>
          <p className="text-muted-foreground mt-2">
            Wähle einen Bereich – der Launcher bringt dich direkt hin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODULES.map(({ href, title, desc, icon: Icon, accent }, index) => (
            <motion.div
              key={href}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <Link href={href} className="group block h-full">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card/80 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="relative p-6 flex flex-col gap-4 min-h-[11rem]">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedGiveaway() {
  const { data, isLoading, error } = trpc.games.getFreeGames.useQuery({ type: "game" });
  const featured = data?.games?.[0];
  const secondary = data?.games?.slice(1, 4) ?? [];
  const hasError = Boolean(error || data?.error);

  return (
    <section className="py-12 md:py-16 bg-card/25 border-y border-border/50">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Spotlight
            </h2>
            <p className="text-muted-foreground mt-1">Aktuell gratis – hervorgehoben im Launcher</p>
          </div>
          <Link href="/free-games">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1 shrink-0">
              Bibliothek <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {hasError && !isLoading ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            Kostenlose Spiele konnten nicht geladen werden. Bitte später erneut versuchen.
          </div>
        ) : isLoading || !featured ? (
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
            <div className="h-72 rounded-2xl bg-card animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[5.4rem] rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
            <a
              href={featured.openGiveawayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-2xl border border-border min-h-[18rem] bg-card"
            >
              <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary text-primary-foreground border-0">
                    {featured.worth !== "N/A" ? `Wert ${featured.worth}` : "Kostenlos"}
                  </Badge>
                  <Badge variant="outline" className="border-white/25 bg-black/35 text-white backdrop-blur-sm">
                    {featured.platforms}
                  </Badge>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight max-w-xl group-hover:text-primary transition-colors">
                  {featured.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-lg">{featured.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary mt-1">
                  <Play className="h-4 w-4" />
                  Jetzt holen
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </span>
              </div>
            </a>

            <div className="flex flex-col gap-3">
              {secondary.map((game) => (
                <a
                  key={game.id}
                  href={game.openGiveawayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-xl border border-border bg-card/90 p-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-card"
                >
                  <img
                    src={game.thumbnail || game.image}
                    alt=""
                    className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex flex-col justify-center gap-1 py-0.5">
                    <p className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {game.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{game.platforms}</p>
                    {game.endDate && game.endDate !== "N/A" && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        bis {new Date(game.endDate).toLocaleDateString("de-DE")}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function NewsRail() {
  const { data, isLoading, error } = trpc.news.getNews.useQuery({ category: "all", limit: 4 });
  const articles = data?.articles ?? [];
  const hasError = Boolean(error || data?.error);

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              News Feed
            </h2>
            <p className="text-muted-foreground mt-1">Frisch aus der Gaming-Welt</p>
          </div>
          <Link href="/news">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1 shrink-0">
              Alle News <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {hasError && !isLoading ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            Gaming News konnten nicht geladen werden. Bitte später erneut versuchen.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-card animate-pulse" />
                ))
              : articles.map((article) => (
                  <a
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                  >
                    {article.image ? (
                      <div className="relative h-32 overflow-hidden bg-muted">
                        <img
                          src={article.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            const wrap = (e.target as HTMLImageElement).parentElement;
                            if (wrap) wrap.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="h-1.5 bg-gradient-to-r from-primary/45 via-primary/15 to-transparent" />
                    )}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <Badge variant="outline" className="w-fit text-[10px] border-primary/30 text-primary">
                        {article.source}
                      </Badge>
                      <p className="font-semibold text-sm text-foreground line-clamp-3 group-hover:text-primary transition-colors leading-snug">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-auto pt-1">
                        {article.pubDate
                          ? new Date(article.pubDate).toLocaleDateString("de-DE")
                          : ""}
                      </p>
                    </div>
                  </a>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ForumPulse() {
  const { data: categories, isLoading } = trpc.forum.getCategories.useQuery();

  const ICONS: Record<string, React.ReactNode> = {
    MessageSquare: <MessageSquare className="h-5 w-5" />,
    Monitor: <Monitor className="h-5 w-5" />,
    Gamepad2: <Gamepad2 className="h-5 w-5" />,
    Flame: <Flame className="h-5 w-5" />,
    Gift: <Gift className="h-5 w-5" />,
    Users: <Users className="h-5 w-5" />,
  };

  return (
    <section className="py-12 md:py-16 bg-card/20 border-y border-border/50">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Forum Pulse
            </h2>
            <p className="text-muted-foreground mt-1">Kategorien der Crew</p>
          </div>
          <Link href="/forum">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1 shrink-0">
              Zum Forum <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (categories ?? []).length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 px-6 py-10 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-primary/50" />
            <p className="text-foreground font-medium">Noch keine Kategorien geladen</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Sobald die Datenbank verbunden ist, erscheinen hier die Forum-Bereiche der Crew.
            </p>
            <Link href="/forum" className="inline-block mt-4">
              <Button variant="outline" className="border-primary/35 text-primary hover:bg-primary/10">
                Forum öffnen
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(categories ?? []).map((cat) => (
              <Link key={cat.id} href={`/forum/kategorie/${cat.slug}`} className="group block">
                <div className="h-full rounded-xl border border-border bg-card/90 p-4 flex items-start gap-3 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 border border-primary/15">
                    {ICONS[cat.icon ?? "MessageSquare"] ?? <MessageSquare className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NetworkDock() {
  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">NachtBlau Netzwerk</h2>
          <p className="text-muted-foreground mt-2">
            Webspace und Repository – direkt aus dem Launcher erreichbar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={SITE.webspaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card/90 p-5 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5"
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <Globe className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {SITE.webspaceLabel}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">Offizielle NachtBlau GbR Website</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>

          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card/90 p-5 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5"
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <Github className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {SITE.githubLabel}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">Quellcode, Issues und Beiträge</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        </div>

        <div className="text-center mt-6">
          <Link href="/ueber-uns">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
              Mehr erfahren <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="launcher-home">
      <HeroSection />
      <LaunchModules />
      <FeaturedGiveaway />
      <NewsRail />
      <ForumPulse />
      <NetworkDock />
    </div>
  );
}
