import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PriceChart from "@/components/marketplace/PriceChart";
import StarRating from "@/components/marketplace/StarRating";
import {
  useCreateReview,
  useMarketplaceCard,
  usePurchaseListing,
} from "@/lib/useMarketplace";
import { useTradingProfile, profileSetupPath } from "@/lib/useTradingProfile";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShoppingCart,
  Shield,
  CheckCircle,
  Sparkles,
  MessageSquare,
} from "lucide-react";

const CONDITION_LABELS: Record<string, string> = {
  mint: "Mint (M)",
  near_mint: "Near Mint (NM)",
  excellent: "Excellent (EX)",
  good: "Good (GD)",
  played: "Played (PL)",
};

const GAME_LABELS: Record<string, string> = {
  pokemon: "Pokémon",
  yugioh: "Yu-Gi-Oh!",
  mtg: "Magic: The Gathering",
  onepiece: "One Piece",
  lorcana: "Disney Lorcana",
  sports: "Sportkarten",
  digimon: "Digimon",
};

export default function CardDetail() {
  const [, params] = useRoute("/karte/:id");
  const cardId = params?.id ?? "";
  const [, navigate] = useLocation();
  const { isAuthenticated, loginDemo, user } = useAuth();
  const { profile, isComplete } = useTradingProfile(user?.id);

  const ensureCanTrade = () => {
    if (!isAuthenticated) {
      if (isOAuthConfigured()) {
        window.location.href = getLoginUrl();
        return false;
      }
      loginDemo();
      toast.message("Bitte zuerst dein Händlerprofil anlegen");
      navigate(profileSetupPath(`/karte/${cardId}`));
      return false;
    }
    if (!isComplete) {
      toast.message("Profil erforderlich zum Kaufen");
      navigate(profileSetupPath(`/karte/${cardId}`));
      return false;
    }
    return true;
  };

  const [buyDialog, setBuyDialog] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ sellerId: number; listingId: string } | null>(
    null
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useMarketplaceCard(cardId);
  const purchaseMutation = usePurchaseListing();
  const reviewMutation = useCreateReview();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse h-96 bg-card rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Karte nicht gefunden</p>
        <Link href="/marktplatz">
          <Button variant="ghost" className="mt-4">
            Zurück zum Marktplatz
          </Button>
        </Link>
      </div>
    );
  }

  const { card, listings } = data;
  const cheapest = listings[0];
  const heroImage = cheapest?.imageUrl || card.imageUrl;
  const displayTitle = cheapest?.title || card.name;

  return (
    <div className="container py-8">
      <Link href="/marktplatz">
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Marktplatz
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-[5/7] max-w-sm mx-auto rounded-xl overflow-hidden border border-border shadow-2xl">
            <img src={heroImage} alt={displayTitle} className="w-full h-full object-cover" />
            {cheapest?.isFoil && (
              <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-400/40 to-purple-400/40 text-amber-100 border-amber-400/50">
                <Sparkles className="h-3 w-3 mr-1" />
                Foil
              </Badge>
            )}
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Preisverlauf (30 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart data={card.priceHistory} />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Marktpreis: €{card.marketPrice.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                {GAME_LABELS[card.game]}
              </Badge>
              <Badge variant="outline">{card.rarity}</Badge>
              <Badge variant="outline">#{card.number}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{displayTitle}</h1>
            <p className="text-muted-foreground mt-1">{card.setName}</p>
            <div className="flex items-center gap-3 mt-3">
              <StarRating rating={card.avgRating} showValue size="md" />
              <span className="text-sm text-muted-foreground">
                ({card.reviewCount} Bewertungen)
              </span>
            </div>
          </div>

          {cheapest && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-muted-foreground">Günstigstes Angebot</p>
              <p className="text-3xl font-bold text-primary mt-1">€{cheapest.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {CONDITION_LABELS[cheapest.condition]} · {cheapest.language} · {cheapest.sellerName}
              </p>
              <Button
                className="mt-3 w-full bg-primary hover:bg-primary/80 font-bold"
                size="lg"
                onClick={() => {
                  if (!ensureCanTrade()) return;
                  setBuyDialog(cheapest.id);
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Jetzt kaufen
              </Button>
              {!isComplete && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Zum Kauf brauchst du ein Händlerprofil.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-bold text-lg">
              {listings.length} Angebot{listings.length !== 1 ? "e" : ""}
            </h2>
            {listings.map((listing) => (
              <Card key={listing.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <img
                      src={listing.imageUrl}
                      alt=""
                      className="w-12 h-16 object-cover rounded border border-border shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{listing.title || card.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg text-primary">
                          €{listing.price.toFixed(2)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {CONDITION_LABELS[listing.condition]}
                        </Badge>
                        {listing.isFoil && (
                          <Badge className="text-xs bg-amber-500/20 text-amber-300">Foil</Badge>
                        )}
                      </div>
                      <Link href={`/verkaeufer/${listing.sellerId}`}>
                        <p className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                          {listing.sellerName} · {listing.language} · {listing.quantity}x
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {listing.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => {
                      if (!ensureCanTrade()) return;
                      setBuyDialog(listing.id);
                    }}
                  >
                    Kaufen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!buyDialog} onOpenChange={() => setBuyDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Kauf bestätigen</DialogTitle>
            <DialogDescription>
              Du kaufst als <strong>{profile?.displayName}</strong> –{" "}
              <strong>
                {listings.find((l) => l.id === buyDialog)?.title || card.name}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Shield className="h-4 w-4 text-primary" />
            Käuferschutz durch Verkäufer-Bewertungen
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/80"
            onClick={() =>
              buyDialog &&
              purchaseMutation.mutate(
                {
                  listingId: buyDialog,
                  buyerId: user?.id,
                  buyerName: profile?.displayName ?? user?.name ?? undefined,
                },
                {
                  onSuccess: (result) => {
                    toast.success(result.message);
                    setBuyDialog(null);
                    setReviewDialog({
                      sellerId: result.listing.sellerId,
                      listingId: result.listing.id,
                    });
                  },
                  onError: (err) => toast.error(err.message),
                }
              )
            }
            disabled={purchaseMutation.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {purchaseMutation.isPending ? "Wird verarbeitet…" : "Kauf abschließen"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Verkäufer bewerten</DialogTitle>
            <DialogDescription>
              Wie war dein Einkauf? Deine Bewertung hilft anderen Käufern.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-colors ${n <= rating ? "text-amber-400" : "text-muted-foreground/30"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Deine Erfahrung mit dem Verkäufer…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            <Button
              className="w-full"
              onClick={() =>
                reviewDialog &&
                reviewMutation.mutate(
                  {
                    sellerId: reviewDialog.sellerId,
                    listingId: reviewDialog.listingId,
                    rating,
                    comment,
                    buyerId: user?.id,
                    buyerName: profile?.displayName ?? user?.name ?? undefined,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Bewertung abgegeben – danke!");
                      setReviewDialog(null);
                      setComment("");
                      setRating(5);
                    },
                    onError: (err) => toast.error(err.message),
                  }
                )
              }
              disabled={reviewMutation.isPending || comment.length < 5}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Bewertung abgeben
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
