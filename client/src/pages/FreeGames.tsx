import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, ExternalLink, Clock, Users, RefreshCw, Filter } from "lucide-react";
import MaintenanceNotice from "@/components/MaintenanceNotice";

const PLATFORMS = [
  { value: "", label: "Alle Plattformen" },
  { value: "pc", label: "PC" },
  { value: "steam", label: "Steam" },
  { value: "epic-games-store", label: "Epic Games" },
  { value: "gog", label: "GOG" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
];

const TYPES = [
  { value: "", label: "Alle Typen" },
  { value: "game", label: "Spiele" },
  { value: "loot", label: "DLC / Loot" },
  { value: "beta", label: "Beta Keys" },
];

function GameCard({ game }: { game: ReturnType<typeof useGames>[0] }) {
  const isExpiringSoon =
    game.endDate &&
    game.endDate !== "N/A" &&
    new Date(game.endDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <a href={game.openGiveawayUrl} target="_blank" rel="noopener noreferrer" className="group block">
      <Card className="card-glow bg-card border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = game.thumbnail;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />

          {/* Worth badge */}
          <Badge
            className={`absolute top-2 right-2 text-xs font-bold ${
              game.worth !== "N/A"
                ? "bg-primary text-primary-foreground"
                : "bg-green-600/90 text-white"
            }`}
          >
            {game.worth !== "N/A" ? `Wert: ${game.worth}` : "Kostenlos"}
          </Badge>

          {/* Type badge */}
          <Badge
            variant="outline"
            className="absolute top-2 left-2 text-xs border-white/20 bg-black/40 text-white backdrop-blur-sm"
          >
            {game.type}
          </Badge>

          {isExpiringSoon && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3" />
              Läuft bald ab!
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {game.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{game.description}</p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{game.platforms}</span>
              {game.endDate && game.endDate !== "N/A" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  bis {new Date(game.endDate).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
            {game.users > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {game.users.toLocaleString("de-DE")}
              </span>
            )}
          </div>

          <Button
            size="sm"
            className="w-full mt-1 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 hover:border-primary transition-all duration-200 gap-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Jetzt holen
          </Button>
        </CardContent>
      </Card>
    </a>
  );
}

// Helper type
function useGames() {
  return [] as {
    id: number;
    title: string;
    worth: string;
    thumbnail: string;
    image: string;
    description: string;
    platforms: string;
    type: string;
    endDate: string;
    publishedDate: string;
    openGiveawayUrl: string;
    gamerPowerUrl: string;
    status: string;
    users: number;
  }[];
}

export default function FreeGames() {
  const [platform, setPlatform] = useState("");
  const [type, setType] = useState("");

  const { data, isLoading, refetch, isFetching } = trpc.games.getFreeGames.useQuery({
    platform: platform || undefined,
    type: type || undefined,
  });

  const games = data?.games ?? [];

  return (
    <div className="py-12">
      <div className="container space-y-6">
        <MaintenanceNotice />
        {/* Header */}
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/15 text-primary">
              <Gift className="h-6 w-6" />
            </div>
            <h1
              className="text-3xl font-bold gradient-text"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Kostenlose Spiele
            </h1>
          </div>
          <p className="text-muted-foreground">
            Aktuell kostenlose Spiele und Giveaways – täglich aktualisiert via GamerPower.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={platform === value ? "default" : "outline"}
                className={`text-xs h-7 ${
                  platform === value
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
                onClick={() => setPlatform(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="w-px bg-border hidden sm:block" />

          <div className="flex flex-wrap gap-2">
            {TYPES.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={type === value ? "default" : "outline"}
                className={`text-xs h-7 ${
                  type === value
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
                onClick={() => setType(value)}
              >
                {label}
              </Button>
            ))}
          </div>

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

        {/* Error */}
        {data?.error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-6">
            {data.error}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Keine Spiele gefunden</p>
            <p className="text-sm mt-1">Versuche einen anderen Filter</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {games.length} Angebot{games.length !== 1 ? "e" : ""} gefunden
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </>
        )}

        {/* Attribution */}
        <p className="text-xs text-muted-foreground text-center mt-10">
          Daten bereitgestellt von{" "}
          <a
            href="https://www.gamerpower.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GamerPower.com
          </a>
        </p>
      </div>
    </div>
  );
}
