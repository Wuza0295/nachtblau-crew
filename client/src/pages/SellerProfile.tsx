import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/marketplace/StarRating";
import { useMarketplaceSeller } from "@/lib/useMarketplace";
import { ArrowLeft, Shield, Clock, Package, MessageSquare } from "lucide-react";

const CONDITION_LABELS: Record<string, string> = {
  mint: "Mint (M)",
  near_mint: "Near Mint (NM)",
  excellent: "Excellent (EX)",
  good: "Good (GD)",
  played: "Played (PL)",
};

export default function SellerProfile() {
  const [, params] = useRoute("/verkaeufer/:id");
  const sellerId = parseInt(params?.id ?? "0");

  const { data, isLoading } = useMarketplaceSeller(sellerId);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse h-64 bg-card rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Verkäufer nicht gefunden</p>
      </div>
    );
  }

  const { seller, reviews, activeListings } = data;

  return (
    <div className="container py-8 space-y-8">
      <Link href="/marktplatz">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Marktplatz
        </Button>
      </Link>

      {/* Seller header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-xl bg-card border border-border">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
          {seller.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{seller.name}</h1>
            {seller.verified && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Shield className="h-3 w-3 mr-1" />
                Verifiziert
              </Badge>
            )}
          </div>
          <StarRating rating={seller.rating} showValue size="md" />
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {seller.salesCount} Verkäufe
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {seller.reviewCount} Bewertungen
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Antwortzeit {seller.responseTime}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Mitglied seit {seller.memberSince}</p>
        </div>
      </div>

      {/* Active listings */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          Aktive Angebote ({activeListings.length})
        </h2>
        <div className="grid gap-3">
          {activeListings.map((listing) => (
            <Link key={listing.id} href={`/karte/${listing.cardId}`}>
              <Card className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <img
                    src={listing.imageUrl}
                    alt=""
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary">€{listing.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {CONDITION_LABELS[listing.condition]} · {listing.language}
                      {listing.isFoil && " · Foil"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-bold mb-4">Bewertungen ({reviews.length})</h2>
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Bewertungen</p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.buyerName}</span>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.cardName}</p>
                  <p className="text-sm">{review.comment}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
