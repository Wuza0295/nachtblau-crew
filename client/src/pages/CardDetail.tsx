import { useEffect, useState, useSyncExternalStore } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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
import Breadcrumbs from "@/components/marketplace/Breadcrumbs";
import PaymentMethodPicker from "@/components/marketplace/PaymentMethodPicker";
import {
  useCreateReview,
  useMarketplaceCard,
  usePurchaseListing,
} from "@/lib/useMarketplace";
import { useTradingProfile, profileSetupPath } from "@/lib/useTradingProfile";
import { CONDITION_LABELS, GAME_LABELS, formatEuro } from "@/lib/marketplaceConstants";
import type { CardCondition, TcgGame } from "@/lib/marketplaceStore";
import { getSellerProfile } from "@/lib/marketplaceStore";
import type { PaymentMethodId } from "@/lib/paymentMethods";
import { addToCart } from "@/lib/cartStore";
import {
  getWantsVersion,
  isWanted,
  subscribeWants,
  toggleWant,
} from "@/lib/wantsStore";
import { pushRecent } from "@/lib/recentStore";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShoppingCart,
  Shield,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Heart,
  BadgeCheck,
} from "lucide-react";

export default function CardDetail() {
  const [, params] = useRoute("/karte/:id");
  const cardId = params?.id ?? "";
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { profile, isComplete } = useTradingProfile(user?.id);
  const wantsV = useSyncExternalStore(subscribeWants, getWantsVersion, getWantsVersion);
  void wantsV;
  const wanted = isWanted(cardId);

  const ensureCanTrade = () => {
    if (!isAuthenticated) {
      toast.message("Bitte registrieren, um zu kaufen");
      navigate(`/registrieren?next=${encodeURIComponent(`/karte/${cardId}`)}`);
      return false;
    }
    if (!isComplete) {
      toast.message("Käuferprofil erforderlich");
      navigate(profileSetupPath(`/karte/${cardId}`));
      return false;
    }
    return true;
  };

  const [buyDialog, setBuyDialog] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | "">("atc");
  const [reviewDialog, setReviewDialog] = useState<{ sellerId: number; listingId: string } | null>(
    null
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useMarketplaceCard(cardId);
  const purchaseMutation = usePurchaseListing();
  const reviewMutation = useCreateReview();

  useEffect(() => {
    if (cardId) pushRecent(cardId);
  }, [cardId]);

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

  const handleWant = () => {
    const on = toggleWant(cardId);
    toast.success(on ? "Zur Merkliste hinzugefügt" : "Von Merkliste entfernt");
  };

  const handleAddCart = (listingId: string) => {
    if (!ensureCanTrade()) return;
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    addToCart({
      listingId: listing.id,
      cardId: card.id,
      title: listing.title || card.name,
      imageUrl: listing.imageUrl || card.imageUrl,
      price: listing.price,
      condition: CONDITION_LABELS[listing.condition as CardCondition],
      language: listing.language,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
    });
    toast.success("In den Warenkorb gelegt");
  };

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumbs
        items={[
          { label: "Start", href: "/" },
          { label: "Marktplatz", href: "/marktplatz" },
          { label: GAME_LABELS[card.game as TcgGame], href: `/marktplatz?game=${card.game}` },
          { label: displayTitle },
        ]}
      />

      <Link href="/marktplatz">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Marktplatz
        </Button>
      </Link>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <div className="space-y-4">
          <div className="relative aspect-[5/7] max-w-[280px] mx-auto lg:mx-0 rounded-xl overflow-hidden border border-border shadow-2xl bg-secondary/30 animate-card-in">
            <img
              src={heroImage}
              alt={displayTitle}
              className="w-full h-full object-cover object-top"
            />
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
                Marktpreis: {formatEuro(card.marketPrice)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 min-w-0 animate-rise">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                {GAME_LABELS[card.game as TcgGame]}
              </Badge>
              <Badge variant="outline">{card.rarity}</Badge>
              <Badge variant="outline">#{card.number}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{displayTitle}</h1>
            <p className="text-muted-foreground mt-1">{card.setName}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <StarRating rating={card.avgRating} showValue size="md" />
              <span className="text-sm text-muted-foreground">
                ({card.reviewCount} Bewertungen)
              </span>
              <Button
                size="sm"
                variant={wanted ? "default" : "outline"}
                className="gap-1.5"
                onClick={handleWant}
              >
                <Heart className={`h-3.5 w-3.5 ${wanted ? "fill-current" : ""}`} />
                {wanted ? "Gemerkt" : "Merken"}
              </Button>
            </div>
          </div>

          {cheapest && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-muted-foreground">Günstigstes Angebot</p>
              <p className="text-3xl font-bold text-primary mt-1">{formatEuro(cheapest.price)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {CONDITION_LABELS[cheapest.condition as CardCondition]} · {cheapest.language} ·{" "}
                {cheapest.sellerName}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  className="bg-primary hover:bg-primary/80 font-bold"
                  size="lg"
                  onClick={() => {
                    if (!ensureCanTrade()) return;
                    setBuyDialog(cheapest.id);
                  }}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Sofort kaufen
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleAddCart(cheapest.id)}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  In den Warenkorb
                </Button>
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground mt-2">
                  Kauf nur nach Registrierung ·{" "}
                  <Link href="/registrieren" className="text-primary underline-offset-2 hover:underline">
                    Konto erstellen
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-lg border border-border/80 bg-card/40 p-3">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              Angebote sortiert nach Preis. Verkäufer-Reputation (Verkäufe & Sterne) hilft bei der
              Auswahl – analog zu Cardmarket / TCGPlayer.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-lg">
              {listings.length} Angebot{listings.length !== 1 ? "e" : ""}
            </h2>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/20">
                <span>Verkäufer / Zustand</span>
                <span className="w-20 text-center">Sprache</span>
                <span className="w-24 text-right">Preis</span>
                <span className="w-36" />
              </div>
              {listings.map((listing) => {
                const seller = getSellerProfile(listing.sellerId)?.seller;
                return (
                  <div
                    key={listing.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card/40 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex gap-3 min-w-0 flex-1">
                      <img
                        src={listing.imageUrl}
                        alt=""
                        className="w-11 h-14 object-cover object-top rounded border border-border shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {listing.title || card.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {CONDITION_LABELS[listing.condition as CardCondition]}
                          </Badge>
                          {listing.isFoil && (
                            <Badge className="text-[10px] bg-amber-500/20 text-amber-300">
                              Foil
                            </Badge>
                          )}
                          {listing.isGraded && listing.grade && (
                            <Badge className="text-[10px]" variant="secondary">
                              {listing.grade}
                            </Badge>
                          )}
                        </div>
                        <Link href={`/verkaeufer/${listing.sellerId}`}>
                          <p className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                            {seller?.verified && <BadgeCheck className="h-3 w-3 text-primary" />}
                            {listing.sellerName}
                            {seller && (
                              <span>
                                · ★ {seller.rating} · {seller.salesCount} Verkäufe
                              </span>
                            )}
                          </p>
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 self-end sm:self-center">
                      <span className="text-xs text-muted-foreground w-10 text-center hidden sm:block">
                        {listing.language}
                      </span>
                      <span className="font-bold text-primary w-24 text-right">
                        {formatEuro(listing.price)}
                      </span>
                      <div className="flex gap-1.5 w-36 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => handleAddCart(listing.id)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!ensureCanTrade()) return;
                            setBuyDialog(listing.id);
                          }}
                        >
                          Kaufen
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!buyDialog}
        onOpenChange={(open) => {
          if (!open) {
            setBuyDialog(null);
            setPaymentMethod("atc");
          }
        }}
      >
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
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
          <PaymentMethodPicker
            value={paymentMethod}
            onChange={setPaymentMethod}
            compact
            checkoutOnly
            className="py-1"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <Shield className="h-4 w-4 text-primary" />
            Verkäufer erhält ATC-Guthaben · Auszahlung ab 50 €
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/80"
            onClick={() => {
              if (!paymentMethod) {
                toast.message("Bitte ATC-Verrechnung wählen");
                return;
              }
              buyDialog &&
                purchaseMutation.mutate(
                  {
                    listingId: buyDialog,
                    buyerId: user?.id,
                    buyerName: profile?.displayName ?? user?.name ?? undefined,
                    paymentMethod,
                  },
                  {
                    onSuccess: (result) => {
                      toast.success(result.message);
                      setBuyDialog(null);
                      setPaymentMethod("atc");
                      setReviewDialog({
                        sellerId: result.listing.sellerId,
                        listingId: result.listing.id,
                      });
                    },
                    onError: (err) => toast.error(err.message),
                  }
                );
            }}
            disabled={purchaseMutation.isPending || !paymentMethod}
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
