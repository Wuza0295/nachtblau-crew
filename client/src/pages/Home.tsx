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
  Swords,
} from "lucide-react";
import { SITE } from "@/lib/site";

const HERO_LINKS = [
  { href: "/free-games", label: "Loot & Gratis" },
  { href: "/news", label: "Gilden-Intel" },
  { href: "/forum", label: "Gilden-Halle" },
  { href: "/ueber-uns", label: "Gilden-Rang" },
] as const;

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden border-b border-white/8"
      style={{
        background:
          "radial-gradient(ellipse 80% 120% at 50% -20%, oklch(0.28 0.12 265 / 0.55) 0%, transparent 55%), radial-gradient(ellipse 40% 50% at 80% 100%, oklch(0.32 0.14 320 / 0.18) 0%, transparent 60%), oklch(0.14 0.03 262)",
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${SITE.heroBgUrl})` }}
      />
      <div className="stars-bg absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative z-10 py-4 md:py-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <img
            src={SITE.logoUrl}
            alt="NachtBlau Crew Logo"
            className="h-6 w-6 object-contain"
          />
          <p className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
            Gilde unter dem Mondlicht
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            wach
          </span>
        </div>

        <h1 className="mt-2 text-[1.65rem] leading-[1.05] font-black sm:text-4xl md:text-5xl">
          Willkommen in der{" "}
          <span className="gradient-text">NachtBlau</span>{" "}
          <span className="text-[oklch(0.78_0.15_330)]">Crew</span>
        </h1>
        <p className="mt-2 text-[11px] sm:text-xs tracking-[0.18em] text-foreground/65">
          Eine Gilde · Ein Mond · Unendlich Loot
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Loot sammeln, Intel teilen, Quests pinnen. Die Eule wacht, die Crew spielt zusammen.
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Link href="/forum">
            <Button className="h-9 bg-[oklch(0.58_0.2_280)] hover:bg-[oklch(0.52_0.2_280)] text-white">
              <Swords className="mr-2 h-4 w-4" />
              Gilden-Halle
            </Button>
          </Link>
          <Link href="/portal">
            <Button variant="outline" className="h-9 border-white/15 bg-white/5 backdrop-blur-sm">
              Crew-Tafel
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-3 flex max-w-sm items-center justify-between rounded-full border border-white/10 bg-black/35 px-4 py-1.5 text-[11px] text-muted-foreground backdrop-blur-sm">
          <span>
            <span className="font-semibold text-foreground">17</span> Loot
          </span>
          <span className="text-white/20">·</span>
          <span>
            <span className="font-semibold text-foreground">25</span> Intel
          </span>
          <span className="text-white/20">·</span>
          <span>
            <span className="font-semibold text-foreground">63</span> Crew
          </span>
        </div>

        <nav className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {HERO_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="text-xs text-foreground/70 underline-offset-4 hover:text-foreground hover:underline">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
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
              Loot & Gratis
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
              Gilden-Intel
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
              Gilden-Halle
            </h2>
            <p className="text-muted-foreground mt-1">Diskutiere mit der Crew</p>
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
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="container grid grid-cols-1 gap-3 py-4 sm:grid-cols-3 sm:gap-6">
        {[
          {
            icon: Zap,
            title: "Live Updates",
            desc: "Loot und Angebote, sobald sie fallen",
          },
          {
            icon: Newspaper,
            title: "Gilden-Intel",
            desc: "PC, Konsole und Steam an einem Ort",
          },
          {
            icon: Users,
            title: "Crew",
            desc: "Quests, Taktik und der gemeinsame Tisch",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 sm:justify-center">
            <div className="rounded-full bg-primary/15 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
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
