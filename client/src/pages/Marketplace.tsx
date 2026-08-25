import { useMemo, useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import CardTile from "@/components/marketplace/CardTile";
import ListingRow from "@/components/marketplace/ListingRow";
import GameSidebar from "@/components/marketplace/GameSidebar";
import Breadcrumbs from "@/components/marketplace/Breadcrumbs";
import MarketplaceFilters, { type FilterState } from "@/components/marketplace/MarketplaceFilters";
import { useMarketplaceSearch } from "@/lib/useMarketplace";
import type { CardCondition, TcgGame } from "@/lib/marketplaceStore";
import { GAME_LABELS } from "@/lib/marketplaceConstants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Shield, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

function useQueryParam(key: string): string | null {
  const search = useSearch();
  return new URLSearchParams(search).get(key);
}

type ViewMode = "list" | "grid";

const defaultFilters = (game: string): FilterState => ({
  query: "",
  game,
  condition: "all",
  language: "all",
  sort: "best_offer",
  minPrice: "",
  maxPrice: "",
  foilOnly: false,
  gradedOnly: false,
  minSellerSales: "",
});

export default function Marketplace() {
  const gameParam = useQueryParam("game");

  const [filters, setFilters] = useState<FilterState>(() =>
    defaultFilters(gameParam ?? "all")
  );
  const [applied, setApplied] = useState(filters);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("autic-mp-view") as ViewMode) || "list";
  });

  useEffect(() => {
    if (gameParam) {
      const f = { ...filters, game: gameParam };
      setFilters(f);
      setApplied(f);
    }
  }, [gameParam]);

  const searchInput = useMemo(
    () => ({
      query: applied.query || undefined,
      game: applied.game !== "all" ? (applied.game as TcgGame) : undefined,
      condition:
        applied.condition !== "all" ? (applied.condition as CardCondition) : undefined,
      language: applied.language !== "all" ? applied.language : undefined,
      foilOnly: applied.foilOnly || undefined,
      gradedOnly: applied.gradedOnly || undefined,
      minSellerSales: applied.minSellerSales
        ? parseInt(applied.minSellerSales, 10)
        : undefined,
      sort: applied.sort as
        | "price_asc"
        | "price_desc"
        | "newest"
        | "popular"
        | "best_offer",
      minPrice: applied.minPrice ? parseFloat(applied.minPrice) : undefined,
      maxPrice: applied.maxPrice ? parseFloat(applied.maxPrice) : undefined,
      limit: 48,
    }),
    [applied]
  );

  const { data, isLoading } = useMarketplaceSearch(searchInput);

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    localStorage.setItem("autic-mp-view", mode);
  };

  const activeGame = applied.game !== "all" ? applied.game : gameParam ?? "all";
  const gameLabel =
    activeGame !== "all" ? GAME_LABELS[activeGame as TcgGame] ?? activeGame : "Alle TCGs";

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumbs
        items={[
          { label: "Start", href: "/" },
          { label: "Marktplatz", href: "/marktplatz" },
          ...(activeGame !== "all" ? [{ label: gameLabel }] : []),
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="hidden lg:block w-52 shrink-0 space-y-4">
          <div className="sticky top-20 space-y-3">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <GameSidebar activeGame={activeGame} />
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Käuferschutz
              </p>
              <p>Registrierung Pflicht · Kauf nur per ATC · Auszahlung ab 50 €</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{gameLabel}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data ? `${data.total} Produkte mit aktiven Angeboten` : "Lade Marktplatz…"}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-0.5">
              <Button
                size="sm"
                variant="ghost"
                className={cn("h-8 px-2.5", view === "list" && "bg-primary/15 text-primary")}
                onClick={() => setViewMode("list")}
                aria-label="Listenansicht"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn("h-8 px-2.5", view === "grid" && "bg-primary/15 text-primary")}
                onClick={() => setViewMode("grid")}
                aria-label="Kachelansicht"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="lg:hidden">
            <GameSidebar activeGame={activeGame} variant="pills" />
          </div>

          <MarketplaceFilters
            filters={filters}
            onChange={setFilters}
            onSearch={(next) => setApplied(next ?? { ...filters })}
          />

          {isLoading ? (
            view === "list" ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 sm:h-40 rounded-lg" />
                ))}
              </div>
            )
          ) : data?.results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl space-y-3">
              <p className="text-lg text-foreground">Noch keine echten Angebote</p>
              <p className="text-sm max-w-md mx-auto">
                Keine Platzhalter – der Marktplatz füllt sich nur mit Angeboten angemeldeter Nutzer.
                Verkaufserlös als ATC · Auszahlung ab 50 € per PayPal/Überweisung.
              </p>
              <Link href="/verkaufen">
                <Button className="mt-2">
                  <Tag className="h-4 w-4 mr-2" />
                  Angebot einstellen
                </Button>
              </Link>
            </div>
          ) : view === "list" ? (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Produkt</span>
                <span className="w-24 text-center">Bewertung</span>
                <span className="w-28 text-right pr-10">ab Preis</span>
              </div>
              {data?.results.map(({ card, listing, listingCount }) => (
                <ListingRow
                  key={card.id}
                  cardId={card.id}
                  name={card.name}
                  setName={card.setName}
                  game={card.game}
                  imageUrl={card.imageUrl}
                  price={listing.price}
                  listingCount={listingCount}
                  avgRating={card.avgRating}
                  condition={listing.condition}
                  language={listing.language}
                  sellerName={listing.sellerName}
                  isFoil={listing.isFoil}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {data?.results.map(({ card, listing, listingCount }) => (
                <CardTile
                  key={card.id}
                  cardId={card.id}
                  name={card.name}
                  setName={card.setName}
                  game={card.game}
                  imageUrl={card.imageUrl}
                  price={listing.price}
                  listingCount={listingCount}
                  avgRating={card.avgRating}
                  isFoil={listing.isFoil}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
