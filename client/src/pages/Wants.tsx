import { useMemo, useSyncExternalStore } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import CardTile from "@/components/marketplace/CardTile";
import { getWants, getWantsVersion, removeWant, subscribeWants } from "@/lib/wantsStore";
import { getCardById, getListingsForCard } from "@/lib/marketplaceStore";
import { Heart, Trash2 } from "lucide-react";

export default function WantsPage() {
  const version = useSyncExternalStore(subscribeWants, getWantsVersion, getWantsVersion);
  const ids = useMemo(() => {
    void version;
    return getWants();
  }, [version]);

  const items = ids
    .map((id) => {
      const card = getCardById(id);
      if (!card) return null;
      const listings = getListingsForCard(id);
      const cheapest = listings[0];
      return { card, cheapest, listingCount: listings.length };
    })
    .filter(Boolean) as {
    card: NonNullable<ReturnType<typeof getCardById>>;
    cheapest: ReturnType<typeof getListingsForCard>[0] | undefined;
    listingCount: number;
  }[];

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Heart className="h-7 w-7 text-primary" />
          Merkliste
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deine Wants – inspiriert von Cardmarket. Merke Karten und vergleiche Angebote später.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">Noch keine Karten gemerkt.</p>
          <Link href="/marktplatz">
            <Button>Marktplatz durchsuchen</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {items.map(({ card, cheapest, listingCount }) => (
            <div key={card.id} className="relative group">
              <CardTile
                cardId={card.id}
                name={card.name}
                setName={card.setName}
                game={card.game}
                imageUrl={card.imageUrl}
                price={cheapest?.price ?? card.marketPrice}
                listingCount={listingCount}
                avgRating={card.avgRating}
                isFoil={cheapest?.isFoil}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-1 right-1 h-7 w-7 opacity-90"
                onClick={() => removeWant(card.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
