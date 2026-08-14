import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
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
  Star,
  Users,
  Zap,
  Github,
  Globe,
  ExternalLink,
  Smartphone,
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
  const { isAuthenticated } = useAuth();

  return (
    <section
      className="relative min-h-[85vh] flex items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 70% 50%, oklch(0.18 0.06 252 / 0.4) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, oklch(0.14 0.05 260 / 0.3) 0%, transparent 50%), oklch(0.09 0.025 250)",
      }}
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url(${SITE.heroBgUrl})`,
        }}
      />
      <StarField />

      {/* Glow orb */}
      <div
        className="absolute right-1/4 top-1/3 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.62 0.22 245)" }}
      />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 text-xs tracking-widest uppercase"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <Star className="h-3 w-3 mr-1 fill-primary" />
              Gaming Community
            </Badge>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-none"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <span className="gradient-text text-glow">NachtBlau</span>
              <br />
              <span className="text-foreground">Crew</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Deine Gaming Community für PC, Konsolen und Steam. Entdecke kostenlose Spiele,
              aktuelle News und tausche dich im Forum aus.
            </p>

            <div className="flex flex-wrap gap-3">
              {!isAuthenticated && (
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-xl shadow-primary/25 transition-all duration-200 hover:shadow-primary/40 hover:scale-105"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Jetzt beitreten
                </Button>
              )}
              <Link href="/portal">
                <Button
                  size="lg"
                  className="font-bold shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-r from-[oklch(0.65_0.22_310)] to-[oklch(0.62_0.2_25)] text-white border-0"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Social Portal
                </Button>
              </Link>
              <Link href="/launcher">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-semibold transition-all duration-200"
                >
                  <Smartphone className="mr-2 h-5 w-5" />
                  Android Launcher
                </Button>
              </Link>
              <Link href="/forum">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-semibold transition-all duration-200"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Zum Forum
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-2">
              {[
                { icon: Users, label: "Community", value: "Aktiv" },
                { icon: Gift, label: "Free Games", value: "Täglich" },
                { icon: Newspaper, label: "News", value: "24/7" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-30"
                style={{ background: "oklch(0.62 0.22 245)" }}
              />
              <img
                src={SITE.logoUrl}
                alt="NachtBlau Crew"
                className="relative w-72 h-72 md:w-96 md:h-96 object-contain animate-float drop-shadow-2xl"
              />
            </div>
          </div>
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
            Webspace, Launcher und GitHub — alles im NachtBlau-Netzwerk
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
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
          <Link href="/launcher" className="group block">
            <Card className="card-glow bg-card border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {SITE.launcherLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Android-App und Live-Hub
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
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
