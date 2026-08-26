import { useMemo, useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ATC_DENOMINATIONS,
  ATC_EUR_RATE,
  ATC_PAYOUT_MIN_EUR,
  ATC_PAYPAL_EMAIL,
  PAYOUT_METHODS,
  TOP_UP_METHODS,
  atcToEuro,
  cancelPayoutRequest,
  cancelTopUpRequest,
  confirmPayoutRequest,
  confirmTopUpCode,
  createPayoutRequest,
  createTopUpRequest,
  formatAtc,
  formatAtcWithEuro,
  formatEuroAmount,
  getActiveIssuedCoupons,
  getAtcBalance,
  getAtcTransactions,
  getAtcVersion,
  getPendingPayoutRequests,
  getPendingTopUpRequests,
  getPayoutByCode,
  getPayoutMethod,
  getTopUpByCode,
  getTopUpMethod,
  getUserPayoutRequests,
  getUserTopUpRequests,
  issueCoupon,
  payoutInstructions,
  redeemCoupon,
  rejectPayoutRequest,
  subscribeAtc,
  topUpInstructions,
  type AtcDenomination,
  type AtcPayoutRequest,
  type AtcTopUpRequest,
  type PayoutMethodId,
  type TopUpMethodId,
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
  Landmark,
  BadgeCheck,
  Mail,
  Banknote,
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
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
        <p className="text-xs text-primary/80">{formatEuroAmount(atcToEuro(denom.value))}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Tippen → Coupon erzeugen
        </p>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: AtcTopUpRequest["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-400/50 text-amber-300">
        Offen
      </Badge>
    );
  }
  if (status === "confirmed") {
    return (
      <Badge variant="outline" className="border-emerald-400/50 text-emerald-300">
        Bestätigt
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
      Storniert
    </Badge>
  );
}

function PayoutStatusBadge({ status }: { status: AtcPayoutRequest["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-400/50 text-amber-300">
        Offen
      </Badge>
    );
  }
  if (status === "paid") {
    return (
      <Badge variant="outline" className="border-emerald-400/50 text-emerald-300">
        Ausgezahlt
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="outline" className="border-rose-400/50 text-rose-300">
        Abgelehnt
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
      Storniert
    </Badge>
  );
}

export default function Guthaben() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const v = useSyncExternalStore(subscribeAtc, getAtcVersion, getAtcVersion);
  void v;

  const userId = user?.id;
  const balance = userId ? getAtcBalance(userId) : 0;
  const balanceEur = atcToEuro(balance);
  const txs = useMemo(() => (userId ? getAtcTransactions(userId) : []), [userId, v]);
  const coupons = useMemo(() => (userId ? getActiveIssuedCoupons(userId) : []), [userId, v]);
  const myTopUps = useMemo(() => (userId ? getUserTopUpRequests(userId) : []), [userId, v]);
  const myPayouts = useMemo(() => (userId ? getUserPayoutRequests(userId) : []), [userId, v]);
  const pendingTopUps = useMemo(() => (isAdmin ? getPendingTopUpRequests() : []), [isAdmin, v]);
  const pendingPayouts = useMemo(() => (isAdmin ? getPendingPayoutRequests() : []), [isAdmin, v]);

  const [topupAmount, setTopupAmount] = useState("50");
  const [topupMethod, setTopupMethod] = useState<TopUpMethodId>("paypal");
  const [payoutAmount, setPayoutAmount] = useState("50");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodId>("paypal");
  const [payoutDestination, setPayoutDestination] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [lastCouponCode, setLastCouponCode] = useState<string | null>(null);
  const [lastPayCode, setLastPayCode] = useState<AtcTopUpRequest | null>(null);
  const [lastPayout, setLastPayout] = useState<AtcPayoutRequest | null>(null);
  const [adminCode, setAdminCode] = useState("");
  const [adminPreview, setAdminPreview] = useState<AtcTopUpRequest | null>(null);
  const [adminPayoutCode, setAdminPayoutCode] = useState("");
  const [adminPayoutPreview, setAdminPayoutPreview] = useState<AtcPayoutRequest | null>(null);

  const previewEur = useMemo(() => {
    const amount = parseFloat(topupAmount.replace(",", "."));
    if (!(amount > 0)) return null;
    return atcToEuro(amount);
  }, [topupAmount]);

  const payoutPreviewEur = useMemo(() => {
    const amount = parseFloat(payoutAmount.replace(",", "."));
    if (!(amount > 0)) return null;
    return atcToEuro(amount);
  }, [payoutAmount]);

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

  const handleCreateTopUp = () => {
    const amount = parseFloat(topupAmount.replace(",", "."));
    if (!(amount > 0)) {
      toast.error("Bitte einen gültigen Betrag eingeben");
      return;
    }
    try {
      const req = createTopUpRequest(userId, amount, topupMethod);
      setLastPayCode(req);
      toast.success(`Code ${req.code} erzeugt – bitte zahlen und Code mitteilen`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Code fehlgeschlagen");
    }
  };

  const handleCreatePayout = () => {
    const amount = parseFloat(payoutAmount.replace(",", "."));
    if (!(amount > 0)) {
      toast.error("Bitte einen gültigen Betrag eingeben");
      return;
    }
    try {
      const req = createPayoutRequest(userId, amount, payoutMethod, payoutDestination);
      setLastPayout(req);
      toast.success(`Auszahlung ${req.code} beantragt – ATC reserviert`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auszahlung fehlgeschlagen");
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
      toast.success(`${formatAtcWithEuro(coupon.value)} eingelöst`);
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

  const handleAdminPreview = () => {
    const req = getTopUpByCode(adminCode);
    if (!req) {
      setAdminPreview(null);
      toast.error("Code nicht gefunden");
      return;
    }
    setAdminPreview(req);
  };

  const handleAdminConfirm = () => {
    try {
      const req = confirmTopUpCode(userId, adminCode);
      setAdminCode("");
      setAdminPreview(null);
      toast.success(
        `${formatAtc(req.amountAtc)} gutgeschrieben · ${formatEuroAmount(req.amountEur)} → ${ATC_PAYPAL_EMAIL}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bestätigung fehlgeschlagen");
    }
  };

  const handleAdminPayoutPreview = () => {
    const req = getPayoutByCode(adminPayoutCode);
    if (!req) {
      setAdminPayoutPreview(null);
      toast.error("Antrag nicht gefunden");
      return;
    }
    setAdminPayoutPreview(req);
  };

  const handleAdminPayoutConfirm = () => {
    try {
      const req = confirmPayoutRequest(userId, adminPayoutCode);
      setAdminPayoutCode("");
      setAdminPayoutPreview(null);
      toast.success(
        `${formatEuroAmount(req.amountEur)} als ausgezahlt markiert · ${getPayoutMethod(req.method)?.label}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bestätigung fehlgeschlagen");
    }
  };

  const handleAdminPayoutReject = () => {
    try {
      const req = rejectPayoutRequest(userId, adminPayoutCode, "Vom Team abgelehnt");
      setAdminPayoutCode("");
      setAdminPayoutPreview(null);
      toast.message(`${req.code} abgelehnt – ATC zurückgebucht`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ablehnung fehlgeschlagen");
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
          Kurs: <strong>1 ATC = {formatEuroAmount(ATC_EUR_RATE)}</strong>. Marktplatz-Käufe nur mit
          ATC – ist die Ladung ausgegeben, musst du hier erneut aufladen; ohne Guthaben keine Käufe.
          Aufladen per PayPal, Überweisung oder Paysafe. Auszahlung ab{" "}
          <strong>{formatEuroAmount(ATC_PAYOUT_MIN_EUR)}</strong> per PayPal oder Überweisung.
          ATC ist internes Plattform-Guthaben (kein gesetzliches Zahlungsmittel).
        </p>
      </div>

      <Card className="bg-gradient-to-br from-card via-card to-primary/10 border-primary/30 animate-rise">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Aktuelles Guthaben</p>
            <p className="text-4xl sm:text-5xl font-black text-primary tracking-tight mt-1">
              {formatAtc(balance)}
            </p>
            <p className="text-lg text-foreground/80 mt-1">≈ {formatEuroAmount(balanceEur)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Umrechnung 1∶{ATC_EUR_RATE} (ATC∶EUR)
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
              Code erzeugen, bezahlen, Code dem Team mitteilen. Nach Bestätigung: ATC aufs Konto,
              EUR-Verbucht auf PayPal <span className="font-mono">{ATC_PAYPAL_EMAIL}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
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
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setTopupAmount(String(n))}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            {previewEur != null && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Umrechnung: </span>
                <span className="font-semibold text-primary">
                  {formatAtc(parseFloat(topupAmount.replace(",", ".")) || 0)} ≈{" "}
                  {formatEuroAmount(previewEur)}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Zahlungsweg</p>
              <div className="grid sm:grid-cols-3 gap-2">
                {TOP_UP_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTopupMethod(m.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      topupMethod === m.id
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold block">{m.label}</span>
                    <span className="text-[10px] leading-snug block mt-0.5 opacity-80">
                      {m.shortLabel}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {getTopUpMethod(topupMethod)?.payHint}
              </p>
            </div>

            <Button onClick={handleCreateTopUp} className="font-semibold w-full sm:w-auto">
              Auflade-Code erzeugen
            </Button>

            {lastPayCode && lastPayCode.userId === userId && (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Dein Code (dem Team mitteilen)</p>
                    <p className="font-mono font-bold text-xl text-primary">{lastPayCode.code}</p>
                    <p className="text-sm mt-1">
                      {formatAtcWithEuro(lastPayCode.amountAtc)} ·{" "}
                      {getTopUpMethod(lastPayCode.method)?.label}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyCode(lastPayCode.code)}>
                    <Copy className="h-4 w-4 mr-1" />
                    Kopieren
                  </Button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {topUpInstructions(lastPayCode)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  PayPal-Empfänger: {ATC_PAYPAL_EMAIL}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" />
              Coupon einlösen
            </CardTitle>
            <CardDescription>
              Flohmarkt-Schein/Münze scannen bzw. Code eingeben → ATC aufs Konto (mit Euro-Anzeige).
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

      <Card className="bg-card/60 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-primary" />
            Auszahlung
          </CardTitle>
          <CardDescription>
            Ab {formatEuroAmount(ATC_PAYOUT_MIN_EUR)} per PayPal oder Überweisung. ATC wird beim
            Antrag reserviert; nach Auszahlung durchs Team ist der Antrag erledigt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[8rem] space-y-1">
              <label className="text-xs text-muted-foreground">Betrag (ATC)</label>
              <Input
                type="number"
                min={ATC_PAYOUT_MIN_EUR}
                step="1"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[50, 100, 250, 500].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={balance < n}
                  onClick={() => setPayoutAmount(String(n))}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {payoutPreviewEur != null && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Auszahlung: </span>
              <span className="font-semibold text-primary">
                {formatAtc(parseFloat(payoutAmount.replace(",", ".")) || 0)} ≈{" "}
                {formatEuroAmount(payoutPreviewEur)}
              </span>
              {payoutPreviewEur < ATC_PAYOUT_MIN_EUR && (
                <span className="block text-xs text-amber-300 mt-1">
                  Mindestbetrag: {formatEuroAmount(ATC_PAYOUT_MIN_EUR)}
                </span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Auszahlungsweg</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {PAYOUT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayoutMethod(m.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    payoutMethod === m.id
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="font-semibold block">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {getPayoutMethod(payoutMethod)?.destinationLabel}
            </label>
            <Input
              value={payoutDestination}
              onChange={(e) => setPayoutDestination(e.target.value)}
              placeholder={getPayoutMethod(payoutMethod)?.destinationPlaceholder}
              className="bg-secondary/50 border-border"
            />
          </div>

          <Button
            onClick={handleCreatePayout}
            className="font-semibold w-full sm:w-auto"
            disabled={balance < ATC_PAYOUT_MIN_EUR}
          >
            Auszahlung beantragen
          </Button>
          {balance < ATC_PAYOUT_MIN_EUR && (
            <p className="text-xs text-muted-foreground">
              Noch nicht genug Guthaben (mindestens {formatAtc(ATC_PAYOUT_MIN_EUR)}).
            </p>
          )}

          {lastPayout && lastPayout.userId === userId && lastPayout.status === "pending" && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Dein Auszahlungs-Code</p>
                  <p className="font-mono font-bold text-xl text-primary">{lastPayout.code}</p>
                  <p className="text-sm mt-1">
                    {formatAtcWithEuro(lastPayout.amountAtc)} ·{" "}
                    {getPayoutMethod(lastPayout.method)?.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    Ziel: {lastPayout.destination}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyCode(lastPayout.code)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Kopieren
                </Button>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {payoutInstructions(lastPayout)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Team: Auflade-Code bestätigen
            </CardTitle>
            <CardDescription>
              Nutzer teilt euch den Code mit. Nach Zahlungseingang Code eingeben → ATC gutschreiben.
              EUR-Betrag für PayPal <span className="font-mono">{ATC_PAYPAL_EMAIL}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[12rem] space-y-1">
                <label className="text-xs text-muted-foreground">Zahlungs-Code</label>
                <Input
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value.toUpperCase());
                    setAdminPreview(null);
                  }}
                  placeholder="PAY-XXXXXXXXXX"
                  className="bg-secondary/50 border-border font-mono"
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAdminPreview}>
                Prüfen
              </Button>
              <Button type="button" className="font-semibold" onClick={handleAdminConfirm}>
                Bestätigen & gutschreiben
              </Button>
            </div>

            {adminPreview && (
              <div className="rounded-lg border border-border bg-card/60 p-3 text-sm space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-mono font-bold">{adminPreview.code}</span>
                  <StatusBadge status={adminPreview.status} />
                </div>
                <p>
                  Nutzer-ID {adminPreview.userId} · {formatAtcWithEuro(adminPreview.amountAtc)} ·{" "}
                  {getTopUpMethod(adminPreview.method)?.label}
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5" />
                  Auszahlung/Verbuchung: {formatEuroAmount(adminPreview.amountEur)} →{" "}
                  {adminPreview.paypalEmail}
                </p>
              </div>
            )}

            {pendingTopUps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Offene Codes</p>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {pendingTopUps.slice(0, 8).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full text-left flex justify-between gap-3 p-3 text-sm bg-card/40 hover:bg-card/70"
                      onClick={() => {
                        setAdminCode(t.code);
                        setAdminPreview(t);
                      }}
                    >
                      <span className="font-mono font-semibold">{t.code}</span>
                      <span className="text-muted-foreground">
                        UID {t.userId} · {formatAtcWithEuro(t.amountAtc)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-primary" />
              Team: Auszahlung bearbeiten
            </CardTitle>
            <CardDescription>
              Nach PayPal-/SEPA-Zahlung an den Nutzer den Antrag als ausgezahlt markieren. Ablehnung
              bucht ATC zurück.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[12rem] space-y-1">
                <label className="text-xs text-muted-foreground">Auszahlungs-Code</label>
                <Input
                  value={adminPayoutCode}
                  onChange={(e) => {
                    setAdminPayoutCode(e.target.value.toUpperCase());
                    setAdminPayoutPreview(null);
                  }}
                  placeholder="OUT-XXXXXXXXXX"
                  className="bg-secondary/50 border-border font-mono"
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAdminPayoutPreview}>
                Prüfen
              </Button>
              <Button type="button" className="font-semibold" onClick={handleAdminPayoutConfirm}>
                Als ausgezahlt markieren
              </Button>
              <Button type="button" variant="destructive" onClick={handleAdminPayoutReject}>
                Ablehnen
              </Button>
            </div>

            {adminPayoutPreview && (
              <div className="rounded-lg border border-border bg-card/60 p-3 text-sm space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-mono font-bold">{adminPayoutPreview.code}</span>
                  <PayoutStatusBadge status={adminPayoutPreview.status} />
                </div>
                <p>
                  Nutzer-ID {adminPayoutPreview.userId} ·{" "}
                  {formatAtcWithEuro(adminPayoutPreview.amountAtc)} ·{" "}
                  {getPayoutMethod(adminPayoutPreview.method)?.label}
                </p>
                <p className="text-muted-foreground break-all">
                  Ziel: {adminPayoutPreview.destination}
                </p>
              </div>
            )}

            {pendingPayouts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Offene Auszahlungen
                </p>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {pendingPayouts.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left flex justify-between gap-3 p-3 text-sm bg-card/40 hover:bg-card/70"
                      onClick={() => {
                        setAdminPayoutCode(p.code);
                        setAdminPayoutPreview(p);
                      }}
                    >
                      <span className="font-mono font-semibold">{p.code}</span>
                      <span className="text-muted-foreground text-right">
                        UID {p.userId} · {formatAtcWithEuro(p.amountAtc)}
                        <span className="block text-[10px] truncate max-w-[14rem]">
                          {p.destination}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {myTopUps.some((t) => t.status === "pending") && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Offene Aufladungen</h2>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {myTopUps
              .filter((t) => t.status === "pending")
              .map((t) => (
                <div key={t.id} className="p-3 bg-card/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono font-semibold">{t.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAtcWithEuro(t.amountAtc)} · {getTopUpMethod(t.method)?.label}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={t.status} />
                      <Button size="sm" variant="ghost" onClick={() => copyCode(t.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          try {
                            cancelTopUpRequest(userId, t.code);
                            toast.message("Code storniert");
                            if (lastPayCode?.code === t.code) setLastPayCode(null);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Storno fehlgeschlagen");
                          }
                        }}
                      >
                        Stornieren
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{topUpInstructions(t)}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      {myPayouts.some((p) => p.status === "pending") && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Offene Auszahlungen</h2>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {myPayouts
              .filter((p) => p.status === "pending")
              .map((p) => (
                <div key={p.id} className="p-3 bg-card/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono font-semibold">{p.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAtcWithEuro(p.amountAtc)} · {getPayoutMethod(p.method)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">Ziel: {p.destination}</p>
                    </div>
                    <div className="flex gap-2">
                      <PayoutStatusBadge status={p.status} />
                      <Button size="sm" variant="ghost" onClick={() => copyCode(p.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          try {
                            cancelPayoutRequest(userId, p.code);
                            toast.message("Auszahlung storniert – ATC zurück");
                            if (lastPayout?.code === p.code) setLastPayout(null);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Storno fehlgeschlagen");
                          }
                        }}
                      >
                        Stornieren
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{payoutInstructions(p)}</p>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-primary" />
              Flohmarkt-Coupons erzeugen
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              ATC vom Konto in physischen Träger wandeln. Werte auch in Euro angezeigt.
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
                    {c.denominationName} · {formatAtcWithEuro(c.value)} · {c.disclaimer}
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
                  <p
                    className={
                      t.amount >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"
                    }
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatAtc(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatEuroAmount(atcToEuro(Math.abs(t.amount)))}
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
          ATC ist internes Plattform-/Event-Guthaben (1 ATC ≈ {formatEuroAmount(ATC_EUR_RATE)}).
          Aufladen nach Zahlungseingang · Auszahlung ab {formatEuroAmount(ATC_PAYOUT_MIN_EUR)} per
          PayPal oder Überweisung (Team bestätigt). Coupons sind Träger für denselben Wert online und
          offline.
        </p>
      </div>
    </div>
  );
}
