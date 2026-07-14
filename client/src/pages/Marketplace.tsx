import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import CardTile from "@/components/marketplace/CardTile";
import MarketplaceFilters, { type FilterState } from "@/components/marketplace/MarketplaceFilters";
import { Skeleton } from "@/components/ui/skeleton";

function useQueryParam(key: string): string | null {
  const search = useSearch();
  return new URLSearchParams(search).get(key);
}

export default function Marketplace() {
  const gameParam = useQueryParam("game");

  const [filters, setFilters] = useState<FilterState>({
    query: "",
    game: gameParam ?? "all",
    condition: "all",
    sort: "popular",
    minPrice: "",
    maxPrice: "",
  });

  const [applied, setApplied] = useState(filters);

  useEffect(() => {
    if (gameParam) {
      const f = { ...filters, game: gameParam };
      setFilters(f);
      setApplied(f);
    }
  }, [gameParam]);

  const { data, isLoading } = trpc.marketplace.search.useQuery({
    query: applied.query || undefined,
    game:
      applied.game !== "all"
        ? (applied.game as
            | "pokemon"
            | "yugioh"
            | "mtg"
            | "onepiece"
            | "lorcana"
            | "sports"
            | "digimon")
        : undefined,
    condition:
      applied.condition !== "all"
        ? (applied.condition as "mint" | "near_mint" | "excellent" | "good" | "played")
        : undefined,
    sort: applied.sort as "price_asc" | "price_desc" | "newest" | "popular",
    minPrice: applied.minPrice ? parseFloat(applied.minPrice) : undefined,
    maxPrice: applied.maxPrice ? parseFloat(applied.maxPrice) : undefined,
    limit: 24,
  });

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marktplatz</h1>
        <p className="text-muted-foreground mt-1">
          {data ? `${data.total} Karten gefunden` : "Karten werden geladen…"}
        </p>
      </div>

      <MarketplaceFilters
        filters={filters}
        onChange={setFilters}
        onSearch={() => setApplied({ ...filters })}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[5/7] rounded-xl" />
          ))}
        </div>
      ) : data?.results.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Keine Karten gefunden</p>
          <p className="text-sm mt-2">Versuche andere Filter oder Suchbegriffe</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
  );
}
