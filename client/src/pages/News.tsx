import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, RefreshCw, Monitor, Gamepad2, Flame, Globe } from "lucide-react";

const CATEGORIES = [
  { value: "all" as const, label: "Alle", icon: Globe },
  { value: "pc" as const, label: "PC Gaming", icon: Monitor },
  { value: "konsolen" as const, label: "Konsolen", icon: Gamepad2 },
  { value: "gaming" as const, label: "Gaming", icon: Newspaper },
  { value: "steam" as const, label: "Steam / Valve", icon: Flame },
];

type Category = (typeof CATEGORIES)[number]["value"];

function ArticleCard({
  article,
}: {
  article: {
    id: string;
    title: string;
    link: string;
    description: string;
    pubDate: string;
    image: string;
    source: string;
  };
}) {
  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className="group block h-full">
      <Card className="card-glow bg-card border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {article.image && (
          <div className="relative h-44 overflow-hidden flex-shrink-0">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
          </div>
        )}
        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="text-xs border-primary/30 text-primary bg-primary/5 flex-shrink-0"
            >
              {article.source}
            </Badge>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {article.pubDate ? new Date(article.pubDate).toLocaleDateString("de-DE") : ""}
            </span>
          </div>

          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug flex-1">
            {article.title}
          </h3>

          {article.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>
          )}

          <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors mt-auto pt-1">
            <ExternalLink className="h-3 w-3" />
            <span>Weiterlesen</span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default function News() {
  const [category, setCategory] = useState<Category>("all");

  const { data, isLoading, refetch, isFetching } = trpc.news.getNews.useQuery({
    category,
    limit: 20,
  });

  const articles = data?.articles ?? [];

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15 text-primary">
              <Newspaper className="h-6 w-6" />
            </div>
            <h1
              className="text-3xl font-bold gradient-text"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Gaming News
            </h1>
          </div>
          <p className="text-muted-foreground">
            Aktuelle Nachrichten aus PC-Gaming, Konsolen, Steam und der Gaming-Welt.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={category === value ? "default" : "outline"}
              className={`gap-2 transition-all duration-200 ${
                category === value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
              onClick={() => setCategory(value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Category description */}
        <div className="mb-6 p-3 rounded-lg bg-card/50 border border-border/50">
          <p className="text-sm text-muted-foreground">
            {category === "all" && "Alle Gaming-News aus verschiedenen Quellen"}
            {category === "pc" && "PC Gaming News von PCGamer und Rock Paper Shotgun"}
            {category === "konsolen" && "Konsolen-News von Eurogamer und IGN"}
            {category === "gaming" && "Gaming-News von Kotaku und GameSpot"}
            {category === "steam" && "Steam & Valve News von Steam und PCGamesN"}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Keine Artikel gefunden</p>
            <p className="text-sm mt-1">Bitte versuche es später erneut</p>
            <Button
              variant="outline"
              className="mt-4 border-primary/30 text-primary"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {articles.length} Artikel gefunden
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
