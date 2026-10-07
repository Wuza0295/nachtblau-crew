import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Gift,
  Newspaper,
  MessageSquare,
  ChevronRight,
  Gamepad2,
  Monitor,
  Flame,
  Users,
  Zap,
  Github,
  Globe,
  ExternalLink,
  Shield,
  Swords,
} from "lucide-react";
import { SITE } from "@/lib/site";

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            opacity: Math.random() * 0.7 + 0.1,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 3 + "s",
          }}
        />
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden border-b border-white/5"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, oklch(0.18 0.06 252 / 0.35) 0%, transparent 55%), oklch(0.16 0.02 260)",
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${SITE.heroBgUrl})` }}
      />
      <StarField />

      <div className="container relative z-10 py-5 md:py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <img
            src={SITE.logoUrl}
            alt="NachtBlau Crew Logo"
            className="h-5 w-5 object-contain"
          />
          <p className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
            NachtBlau Crew · Gilde unter dem Mondlicht
          </p>
        </div>
        <p className="mt-1.5 text-[11px] sm:text-xs tracking-[0.14em] text-foreground/70">
          « Eine Gilde · Ein Mond · Unendlich Loot »
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Gilde wach — Loot & Intel live · Gilde aktiv
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-foreground/80">
            <Shield className="h-3 w-3" />
            Offizielle NachtBlau-Gilde
          </span>
        </div>

        <h1
          className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Willkommen in der
          <br />
          <span className="gradient-text">NachtBlau</span>
          <br />
          <span className="text-[oklch(0.72_0.18_330)]">Crew</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
          Eure Gaming-Gilde unter dem Mondlicht — Loot sammeln, Intel teilen, Quests pinnen.
          Die Eule wacht, die Crew spielt zusammen.
        </p>

        <div className="mx-auto mt-4 grid max-w-lg grid-cols-3 gap-2">
          {[
            { value: "17", label: "Loot & Beute" },
            { value: "25", label: "Gilden-Intel" },
            { value: "63", label: "Crew aktiv" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-black/20 px-2 py-2.5"
            >
              <Shield className="mx-auto mb-1 h-3.5 w-3.5 text-primary/80" />
              <div className="text-2xl font-semibold text-[oklch(0.78_0.12_290)]">{stat.value}</div>
              <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link href="/forum">
            <Button className="h-9 bg-[oklch(0.62_0.2_290)] hover:bg-[oklch(0.58_0.2_290)] text-white">
              <Swords className="mr-2 h-4 w-4" />
              Gilden-Halle
            </Button>
          </Link>
          <Link href="/portal">
            <Button variant="outline" className="h-9 border-white/15 bg-black/20">
              Crew-Tafel
            </Button>
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {[
            { href: "/free-games", label: "Loot & Gratis" },
            { href: "/news", label: "Gilden-Intel" },
            { href: "/forum", label: "Crew-Tafel" },
            { href: "/ueber-uns", label: "Gilden-Rang" },
          ].map((item) => (
            <Link key={item.href + item.label} href={item.href}>
              <span className="inline-flex rounded-lg border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-foreground/80 hover:border-primary/40 hover:text-foreground">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreeGamesPreview() {
  const { data, isLoading, error } = trpc.games.getFreeGames.useQuery({ type: "game" });
  const games = data?.games?.slice(0, 3) ?? [];
  const hasError = error || data?.error;

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <Gift className="inline h-6 w-6 text-primary mr-2" />
              Kostenlose Spiele
            </h2>
            <p className="text-muted-foreground mt-1">Aktuell gratis erhältliche Spiele</p>
          </div>
          <Link href="/free-games">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
              Alle anzeigen <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hasError && !isLoading ? (
            <div className="col-span-full p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <p className="text-sm">Kostenlose Spiele konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>
            </div>
          ) : games.length === 0 && !isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
              ))
            : isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
              ))
            : games.map((game) => (
                <a
                  key={game.id}
                  href={game.openGiveawayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="card-glow bg-card border-border overflow-hidden transition-all duration-300 hover:-translate-y-1">
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs">
                        {game.worth !== "N/A" ? game.worth : "Kostenlos"}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {game.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{game.platforms}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
        </div>
      </div>
    </section>
  );
}

function NewsPreview() {
  const { data, isLoading, error } = trpc.news.getNews.useQuery({ category: "all", limit: 3 });
  const articles = data?.articles ?? [];
  const hasError = error || data?.error;

  return (
    <section className="py-16 bg-card/30">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <Newspaper className="inline h-6 w-6 text-primary mr-2" />
              Gaming News
            </h2>
            <p className="text-muted-foreground mt-1">Aktuelle Nachrichten aus der Gaming-Welt</p>
          </div>
          <Link href="/news">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
              Alle News <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hasError && !isLoading ? (
            <div className="col-span-full p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <p className="text-sm">Gaming News konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>
            </div>
          ) : articles.length === 0 && !isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
              ))
            : isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
              ))
            : articles.map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="card-glow bg-card border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full">
                    {article.image && (
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      </div>
                    )}
                    <CardContent className="p-3 space-y-1">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        {article.source}
                      </Badge>
                      <p className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {article.pubDate
                          ? new Date(article.pubDate).toLocaleDateString("de-DE")
                          : ""}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
        </div>
      </div>
    </section>
  );
}

function ForumPreview() {
  const { data: categories } = trpc.forum.getCategories.useQuery();

  const ICONS: Record<string, React.ReactNode> = {
    MessageSquare: <MessageSquare className="h-5 w-5" />,
    Monitor: <Monitor className="h-5 w-5" />,
    Gamepad2: <Gamepad2 className="h-5 w-5" />,
    Flame: <Flame className="h-5 w-5" />,
    Gift: <Gift className="h-5 w-5" />,
    Users: <Users className="h-5 w-5" />,
  };

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <MessageSquare className="inline h-6 w-6 text-primary mr-2" />
              Community Forum
            </h2>
            <p className="text-muted-foreground mt-1">Diskutiere mit der Community</p>
          </div>
          <Link href="/forum">
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
              Zum Forum <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories ?? []).map((cat) => (
            <Link key={cat.id} href={`/forum/kategorie/${cat.slug}`}>
              <Card className="card-glow bg-card border-border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    {ICONS[cat.icon ?? "MessageSquare"] ?? <MessageSquare className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBanner() {
  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: Zap,
              title: "Live Updates",
              desc: "Kostenlose Spiele und Angebote in Echtzeit",
            },
            {
              icon: Newspaper,
              title: "Gaming News",
              desc: "PC, Konsolen, Steam/Valve – alles an einem Ort",
            },
            {
              icon: Users,
              title: "Community",
              desc: "Tausche dich mit Gleichgesinnten aus",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/15 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3
                className="font-bold text-foreground"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NetworkLinksSection() {
  return (
    <section className="py-16 bg-card/30 border-t border-border">
      <div className="container">
        <div className="text-center mb-8">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            NachtBlau Netzwerk
          </h2>
          <p className="text-muted-foreground mt-1">
            Verknüpft mit unserem Webspace und dem GitHub-Repository
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <a
            href={SITE.webspaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="card-glow bg-card border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {SITE.webspaceLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Offizielle NachtBlau GbR Website
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </a>
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="card-glow bg-card border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Github className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {SITE.githubLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Quellcode, Issues und Beiträge
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
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
    <div>
      <HeroSection />
      <FeatureBanner />
      <FreeGamesPreview />
      <NewsPreview />
      <ForumPreview />
      <NetworkLinksSection />
    </div>
  );
}
