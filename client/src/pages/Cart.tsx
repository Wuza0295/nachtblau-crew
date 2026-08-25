import { useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cartCount,
  cartTotal,
  clearCart,
  getCart,
  getCartVersion,
  removeFromCart,
  subscribeCart,
} from "@/lib/cartStore";
import { usePurchaseListing } from "@/lib/useMarketplace";
import { useTradingProfile, profileSetupPath } from "@/lib/useTradingProfile";
import { formatEuro } from "@/lib/marketplaceConstants";
import type { PaymentMethodId } from "@/lib/paymentMethods";
import PaymentMethodPicker from "@/components/marketplace/PaymentMethodPicker";
import {
  formatAtc,
  formatEuroAmount,
  getAtcBalance,
  getAtcVersion,
  subscribeAtc,
} from "@/lib/atcWalletStore";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Shield, CheckCircle, Coins } from "lucide-react";

export default function CartPage() {
  const { isAuthenticated, user } = useAuth();
  const { profile, isComplete } = useTradingProfile(user?.id);
  const [, navigate] = useLocation();
  const version = useSyncExternalStore(subscribeCart, getCartVersion, getCartVersion);
  void version;
  const atcV = useSyncExternalStore(subscribeAtc, getAtcVersion, getAtcVersion);
  void atcV;
  const items = getCart();
  const total = cartTotal();
  const balance = user?.id ? getAtcBalance(user.id) : 0;
  const canAfford = balance >= total && total > 0;
  const purchaseMutation = usePurchaseListing();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | "">("atc");

  const ensureBuyer = () => {
    if (!isAuthenticated) {
      toast.message("Bitte registrieren oder anmelden");
      navigate(`/registrieren?next=${encodeURIComponent("/warenkorb")}`);
      return false;
    }
    if (!isComplete) {
      toast.message("Käuferprofil erforderlich");
      navigate(profileSetupPath("/warenkorb"));
      return false;
    }
    return true;
  };

  const checkout = () => {
    if (!ensureBuyer()) return;
    if (items.length === 0) return;
    if (!paymentMethod) {
      toast.message("Bitte ATC-Verrechnung wählen");
      return;
    }
    if (!canAfford) {
      toast.error(
        balance <= 0
          ? "Kein ATC-Guthaben. Bitte aufladen – ohne Aufladung keine Käufe."
          : "Nicht genug ATC. Bitte unter Guthaben aufladen."
      );
      navigate("/guthaben");
      return;
    }

    let ok = 0;
    let fail = 0;
    const snapshot = [...items];
    for (const item of snapshot) {
      purchaseMutation.mutate(
        {
          listingId: item.listingId,
          buyerId: user?.id,
          buyerName: profile?.displayName ?? user?.name,
          paymentMethod,
        },
        {
          onSuccess: (result) => {
            removeFromCart(item.listingId);
            ok += 1;
            if (ok + fail === snapshot.length) {
              toast.success(
                `${ok} Kauf${ok === 1 ? "" : "e"} abgeschlossen · ${result.paymentMethod}`
              );
              if (fail) toast.error(`${fail} Angebote nicht verfügbar`);
            }
          },
          onError: (err) => {
            fail += 1;
            if (ok + fail === snapshot.length) {
              if (ok) toast.success(`${ok} Kauf${ok === 1 ? "" : "e"} abgeschlossen`);
              toast.error(err.message || `${fail} Angebote nicht verfügbar`);
              if (/ATC|Guthaben|aufladen/i.test(err.message)) {
                navigate("/guthaben");
              }
            }
          },
        }
      );
    }
  };

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-7 w-7 text-primary" />
          Warenkorb
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cartCount()} Artikel · Käufe nur mit ATC-Guthaben
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Dein Warenkorb ist leer.</p>
            <Link href="/marktplatz">
              <Button>Zum Marktplatz</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {items.map((item) => (
              <div
                key={item.listingId}
                className="flex gap-4 p-4 bg-card/40 hover:bg-card/70 transition-colors animate-rise"
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-14 h-[4.5rem] object-cover rounded border border-border"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/karte/${item.cardId}`}>
                    <p className="font-medium hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </p>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.condition} · {item.language} · {item.sellerName}
                  </p>
                  <p className="font-bold text-primary mt-1">{formatEuro(item.price)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(item.listingId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Summe</span>
                <span className="text-xl font-bold text-primary">{formatEuro(total)}</span>
              </div>

              <div
                className={`rounded-lg border p-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                  canAfford
                    ? "border-primary/30 bg-primary/5"
                    : "border-destructive/40 bg-destructive/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Coins className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Dein ATC: {formatAtc(balance)} ≈ {formatEuroAmount(balance)}
                    </p>
                    {!canAfford && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {balance <= 0
                          ? "Ladung ist ausgegeben bzw. leer – bitte aufladen. Ohne ATC keine Käufe."
                          : `Es fehlen ${formatAtc(Math.round((total - balance) * 100) / 100)}. Ohne ausreichendes Guthaben kein Kauf.`}
                      </p>
                    )}
                  </div>
                </div>
                {!canAfford && (
                  <Link href="/guthaben">
                    <Button size="sm" variant="default">
                      Jetzt aufladen
                    </Button>
                  </Link>
                )}
              </div>

              <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Käufe nur mit ATC. Ist die Ladung leer, unter{" "}
                <Link href="/guthaben" className="text-primary underline-offset-2 hover:underline">
                  Guthaben
                </Link>{" "}
                erneut aufladen – ohne Guthaben keine Käufe.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="font-bold"
                  onClick={checkout}
                  disabled={!paymentMethod || !canAfford}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {canAfford ? "Kauf bestätigen" : "Zuerst aufladen"}
                </Button>
                <Button variant="outline" onClick={() => clearCart()}>
                  Leeren
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
