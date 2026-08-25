import { useMemo, useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ATC_DENOMINATIONS,
  formatAtc,
  getActiveIssuedCoupons,
  getAtcBalance,
  getAtcTransactions,
  getAtcVersion,
  issueCoupon,
  redeemCoupon,
  subscribeAtc,
  topUpAtc,
  type AtcDenomination,
} from "@/lib/atcWalletStore";
import { toast } from "sonner";
import {
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  QrCode,
  Shield,
  Ticket,
  Wallet,
  Copy,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

function DenomCard({
  denom,
  disabled,
  onIssue,
}: {
  denom: AtcDenomination;
  disabled?: boolean;
  onIssue: (value: number) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onIssue(denom.value)}
      className={cn(
        "group relative text-left rounded-xl border border-border overflow-hidden transition-all duration-300",
        "bg-card/60 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_24px_oklch(0.72_0.14_65_/_0.2)]",
        "disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:shadow-none"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-b from-background/40 to-secondary/40",
          denom.kind === "coin" ? "aspect-square" : "aspect-[16/10]"
        )}
      >
        <img
          src={denom.imageUrl}
          alt={`${denom.name} – ${formatAtc(denom.value)}`}
          className={cn(
            "w-full h-full transition-transform duration-500 group-hover:scale-105",
            denom.kind === "coin" ? "object-cover object-center" : "object-cover object-center"
          )}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
        <Badge
          variant="outline"
          className="absolute top-2 right-2 text-[10px] bg-background/70 backdrop-blur-sm border-primary/30"
        >
          {denom.kind === "coin" ? "Münze" : "Schein"}
        </Badge>
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm font-serif text-primary tracking-wide">{denom.name}</p>
        <p className="text-xs text-muted-foreground">{denom.blurb}</p>
        <p className="text-sm font-bold text-foreground pt-0.5">{formatAtc(denom.value)}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Tippen → Coupon erzeugen
        </p>
      </div>
    </button>
  );
}

export default function Guthaben() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const v = useSyncExternalStore(subscribeAtc, getAtcVersion, getAtcVersion);
  void v;

  const userId = user?.id;
  const balance = userId ? getAtcBalance(userId) : 0;
  const txs = useMemo(() => (userId ? getAtcTransactions(userId) : []), [userId, v]);
  const coupons = useMemo(() => (userId ? getActiveIssuedCoupons(userId) : []), [userId, v]);

  const [topupAmount, setTopupAmount] = useState("50");
  const [redeemCode, setRedeemCode] = useState("");
  const [lastCouponCode, setLastCouponCode] = useState<string | null>(null);

  if (!isAuthenticated || !userId) {
    return (
      <div className="container py-20 text-center space-y-4 max-w-lg">
        <Wallet className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Autics Balance (ATC)</h1>
        <p className="text-muted-foreground text-sm">
          Internes Guthaben für Online-Marktplatz und Flohmarkt. Bitte anmelden, um ATC zu nutzen.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => navigate("/anmelden?next=/guthaben")}>
            <LogIn className="mr-2 h-4 w-4" />
            Anmelden
          </Button>
          <Button variant="outline" onClick={() => navigate("/registrieren?next=/guthaben")}>
            Registrieren
          </Button>
        </div>
      </div>
    );
  }

  const handleTopup = () => {
    const amount = parseFloat(topupAmount.replace(",", "."));
    if (!(amount > 0)) {
      toast.error("Bitte einen gültigen Betrag eingeben");
      return;
    }
    try {
      topUpAtc(userId, amount, "Demo-Aufladung (extern später: PayPal/Überweisung)");
      toast.success(`${formatAtc(amount)} gutgeschrieben`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aufladung fehlgeschlagen");
    }
  };

  const handleIssue = (value: number) => {
    try {
      const coupon = issueCoupon(userId, value);
      setLastCouponCode(coupon.code);
      toast.success(`Coupon ${coupon.code} erzeugt – NUR INTERNES GUTHABEN`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Coupon fehlgeschlagen");
    }
  };

  const handleRedeem = () => {
    try {
      const coupon = redeemCoupon(userId, redeemCode);
      setRedeemCode("");
      toast.success(`${formatAtc(coupon.value)} eingelöst`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Einlösung fehlgeschlagen");
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code kopiert");
    } catch {
      toast.message(code);
    }
  };

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      <div className="space-y-2 animate-rise">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Autic Treasures · Internes Guthaben
        </p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Coins className="h-8 w-8 text-primary" />
          Autics Balance (ATC)
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Eine Währung, zwei Formen: digitales Konto online + physische Coupons (Münzen/Scheine) für
          den Flohmarkt. Kein gesetzliches Zahlungsmittel — <strong>NUR INTERNES GUTHABEN</strong>.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-card via-card to-primary/10 border-primary/30 animate-rise">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Aktuelles Guthaben</p>
            <p className="text-4xl sm:text-5xl font-black text-primary tracking-tight mt-1">
              {formatAtc(balance)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marktplatz">
              <Button variant="outline">Zum Marktplatz</Button>
            </Link>
            <Link href="/warenkorb">
              <Button variant="secondary">Warenkorb</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
              Aufladen
            </CardTitle>
            <CardDescription>
              Demo: ATC direkt gutschreiben. Später an PayPal / Überweisung / Paysafe koppeln.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[8rem] space-y-1">
              <label className="text-xs text-muted-foreground">Betrag (ATC)</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[25, 50, 100, 250].map((n) => (
                <Button key={n} type="button" size="sm" variant="outline" onClick={() => setTopupAmount(String(n))}>
                  {n}
                </Button>
              ))}
            </div>
            <Button onClick={handleTopup} className="font-semibold">
              Gutschreiben
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" />
              Coupon einlösen
            </CardTitle>
            <CardDescription>
              Flohmarkt-Schein/Münze scannen bzw. Code eingeben → ATC aufs Konto.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[12rem] space-y-1">
              <label className="text-xs text-muted-foreground">Coupon-Code</label>
              <Input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="ATC-50-XXXXXXXX"
                className="bg-secondary/50 border-border font-mono"
              />
            </div>
            <Button onClick={handleRedeem} variant="secondary" className="font-semibold">
              Einlösen
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-primary" />
              Flohmarkt-Coupons erzeugen
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              ATC vom Konto in physischen Träger wandeln (Druck / Laminat / Münze). Code mitnehmen.
            </p>
          </div>
          <Badge variant="outline" className="text-amber-300 border-amber-400/40">
            NUR INTERNES GUTHABEN
          </Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {ATC_DENOMINATIONS.map((d) => (
            <DenomCard
              key={d.value}
              denom={d}
              disabled={balance < d.value}
              onIssue={handleIssue}
            />
          ))}
        </div>
        {lastCouponCode && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Zuletzt erzeugt</p>
              <p className="font-mono font-bold text-lg text-primary">{lastCouponCode}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => copyCode(lastCouponCode)}>
              <Copy className="h-4 w-4 mr-1" />
              Kopieren
            </Button>
          </div>
        )}
      </section>

      {coupons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Aktive Coupons
          </h2>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-card/40">
                <div>
                  <p className="font-mono text-sm font-semibold">{c.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.denominationName} · {formatAtc(c.value)} · {c.disclaimer}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => copyCode(c.code)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Verlauf</h2>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Bewegungen.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {txs.slice(0, 12).map((t) => (
              <div key={t.id} className="flex justify-between gap-3 p-3 text-sm bg-card/30">
                <div>
                  <p className="font-medium">{t.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={t.amount >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                    {t.amount >= 0 ? "+" : ""}
                    {formatAtc(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">Stand {formatAtc(t.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-lg border border-border p-3 bg-secondary/20">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          ATC ist internes Plattform-/Event-Guthaben von Autic Treasures. Coupons sind Träger für
          denselben Wert – online und offline. Keine Weitergabe ohne Scan/Einlösung empfohlen.
        </p>
      </div>
    </div>
  );
}
