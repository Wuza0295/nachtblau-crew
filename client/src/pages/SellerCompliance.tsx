import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSellerCompliance } from "@/lib/useSellerCompliance";
import {
  ID_AUTH_METHODS,
  hasPinSet,
  type IdAuthMethod,
  type SellerKind,
} from "@/lib/sellerComplianceStore";
import { COUNTRY_OPTIONS } from "@/lib/userProfileStore";
import { fileToCompressedDataUrl } from "@/lib/imageUpload";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, BadgeCheck, Scale, LogIn } from "lucide-react";

export default function SellerCompliancePage() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const next = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("next") || "/verkaufen";
  }, [search]);

  const { compliance, gaps, canSell, save, setPin, ensureDraft } = useSellerCompliance(
    user?.id,
    user?.email ?? ""
  );

  const [kind, setKind] = useState<SellerKind>("private");
  const [legalFullName, setLegalFullName] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("DE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [privateOccasionalOnly, setPrivateOccasionalOnly] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState("");
  const [tradeRegister, setTradeRegister] = useState("");
  const [tradeRegisterNumber, setTradeRegisterNumber] = useState("");
  const [vatId, setVatId] = useState("");
  const [selfCertification, setSelfCertification] = useState(false);
  const [idMethod, setIdMethod] = useState<IdAuthMethod | "">("");
  const [idReference, setIdReference] = useState("");
  const [idDocumentDataUrl, setIdDocumentDataUrl] = useState<string | undefined>();
  const [pin, setPinValue] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const draft = ensureDraft();
    setKind(draft.kind);
    setLegalFullName(draft.legalFullName);
    setStreet(draft.street);
    setZip(draft.zip);
    setCity(draft.city);
    setCountry(draft.country || "DE");
    setPhone(draft.phone);
    setEmail(draft.email || user.email);
    setDateOfBirth(draft.dateOfBirth);
    setIsAdultConfirmed(draft.isAdultConfirmed);
    setPrivateOccasionalOnly(draft.privateOccasionalOnly);
    setPaymentAccount(draft.paymentAccount);
    setTradeRegister(draft.tradeRegister);
    setTradeRegisterNumber(draft.tradeRegisterNumber);
    setVatId(draft.vatId);
    setSelfCertification(draft.selfCertification);
    setIdMethod(draft.idMethod);
    setIdReference(draft.idReference);
    setIdDocumentDataUrl(draft.idDocumentDataUrl);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-20 text-center space-y-4 max-w-lg">
        <LogIn className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-xl font-bold">Anmeldung erforderlich</h1>
        <p className="text-sm text-muted-foreground">
          Verkaufen ist nur mit Konto und gesetzlicher Verkäufer-Freigabe möglich.
        </p>
        <Button onClick={() => navigate(`/anmelden?next=${encodeURIComponent("/verkaeufer-freigabe")}`)}>
          Anmelden
        </Button>
      </div>
    );
  }

  const handleIdFile = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await fileToCompressedDataUrl(file, { maxWidth: 1200, quality: 0.72 });
      setIdDocumentDataUrl(url);
      toast.success("Ausweis-Scan gespeichert (nur für Prüfung)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (pin || pinConfirm || !hasPinSet(compliance)) {
        if (pin !== pinConfirm) throw new Error("PIN und Wiederholung stimmen nicht überein");
        await setPin(pin);
      }
      const nextCompliance = save({
        kind,
        legalFullName,
        street,
        zip,
        city,
        country,
        phone,
        email,
        dateOfBirth,
        isAdultConfirmed,
        privateOccasionalOnly: kind === "private" ? privateOccasionalOnly : false,
        paymentAccount: kind === "trader" ? paymentAccount : "",
        tradeRegister: kind === "trader" ? tradeRegister : "",
        tradeRegisterNumber: kind === "trader" ? tradeRegisterNumber : "",
        vatId: kind === "trader" ? vatId : "",
        selfCertification: kind === "trader" ? selfCertification : false,
        idMethod,
        idReference,
        idDocumentDataUrl,
      });
      if (nextCompliance.status === "approved") {
        toast.success("Verkäufer-Freigabe erteilt – du darfst Angebote einstellen");
        navigate(next);
      } else {
        toast.message("Angaben gespeichert – bitte fehlende Pflichtfelder ergänzen");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Rechtliche Freigabe · DSA / DDG
        </p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Scale className="h-7 w-7 text-primary" />
          Verkäufer-Freigabe
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Angebote dürfen erst freigeschaltet werden, wenn die gesetzlichen Mindestanforderungen
          erfüllt sind: Volljährigkeit, Identifizierung und – bei gewerblichen Händlern –
          Nachverfolgbarkeit nach Art. 30 DSA (Name, Anschrift, Kontakt, Identitätsnachweis,
          Zahlungskonto, Register falls vorhanden, Selbstbescheinigung). Sensible Aktionen sind
          zusätzlich mit einer 6-stelligen PIN geschützt.
        </p>
      </div>

      <Card className="bg-card/60 border-border">
        <CardContent className="pt-5 flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={
              canSell
                ? "border-emerald-400/50 text-emerald-300"
                : "border-amber-400/50 text-amber-300"
            }
          >
            {canSell ? "Freigegeben" : "Noch nicht freigegeben"}
          </Badge>
          {gaps.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Offen: {gaps.slice(0, 4).join(", ")}
              {gaps.length > 4 ? "…" : ""}
            </p>
          )}
          {canSell && (
            <Link href={next}>
              <Button size="sm">Zum Verkaufen</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Verkäuferart</CardTitle>
            <CardDescription>
              Privatpersonen: Gelegenheitsverkauf. Unternehmer: volle DSA-Angaben Pflicht.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-2">
            {(
              [
                {
                  id: "private" as const,
                  title: "Privat (Gelegenheit)",
                  desc: "Kein Gewerbe – nur gelegentliche Verkäufe",
                },
                {
                  id: "trader" as const,
                  title: "Gewerblich (Unternehmer)",
                  desc: "Art. 30 DSA – Händler-Nachverfolgbarkeit",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setKind(opt.id)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  kind === opt.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/20 hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-sm">{opt.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Stammdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vollständiger Name (laut Ausweis) *</Label>
              <Input
                value={legalFullName}
                onChange={(e) => setLegalFullName(e.target.value)}
                required
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Straße und Hausnummer *</Label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>PLZ *</Label>
                <Input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Ort *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Land *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Geburtsdatum *</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>E-Mail *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={isAdultConfirmed}
                onCheckedChange={(v) => setIsAdultConfirmed(v === true)}
              />
              <span>Ich bestätige, volljährig (18+) und geschäftsfähig zu sein.</span>
            </label>
            {kind === "private" && (
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={privateOccasionalOnly}
                  onCheckedChange={(v) => setPrivateOccasionalOnly(v === true)}
                />
                <span>
                  Ich verkaufe nur gelegentlich privat und nicht im Rahmen eines Gewerbes / als
                  Unternehmer.
                </span>
              </label>
            )}
          </CardContent>
        </Card>

        {kind === "trader" && (
          <Card className="bg-card border-border border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Angaben Unternehmer (Art. 30 DSA)</CardTitle>
              <CardDescription>
                Pflicht bevor gewerbliche Angebote freigeschaltet werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Zahlungskonto (IBAN oder PayPal) *</Label>
                <Input
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  placeholder="DE89 … oder hello@…"
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Handelsregister (falls eingetragen)</Label>
                  <Input
                    value={tradeRegister}
                    onChange={(e) => setTradeRegister(e.target.value)}
                    placeholder="z. B. Amtsgericht …"
                    className="bg-secondary/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registernummer</Label>
                  <Input
                    value={tradeRegisterNumber}
                    onChange={(e) => setTradeRegisterNumber(e.target.value)}
                    placeholder="HRB …"
                    className="bg-secondary/50 border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>USt-IdNr. (optional)</Label>
                <Input
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={selfCertification}
                  onCheckedChange={(v) => setSelfCertification(v === true)}
                />
                <span>
                  Selbstbescheinigung: Ich biete nur Produkte/Dienstleistungen an, die dem geltenden
                  Unionsrecht entsprechen (Art. 30 Abs. 1 lit. e DSA).
                </span>
              </label>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Identifizierung
            </CardTitle>
            <CardDescription>
              Zulässige Methoden: Ausweis-/Passkopie, Online-Ausweis (eIDAS) oder VideoIdent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-2">
              {ID_AUTH_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setIdMethod(m.id)}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    idMethod === m.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{m.legalNote}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Referenz / Ausweisnr. (gekürzt) oder VideoIdent-Code *</Label>
              <Input
                value={idReference}
                onChange={(e) => setIdReference(e.target.value)}
                placeholder="z. B. …1234 oder VID-…"
                className="bg-secondary/50 border-border font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Scan hochladen (optional, empfohlen)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                className="bg-secondary/50 border-border"
                onChange={(e) => handleIdFile(e.target.files?.[0] ?? null)}
              />
              {idDocumentDataUrl && (
                <p className="text-xs text-emerald-400">Dokument hinterlegt</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              PIN-System
            </CardTitle>
            <CardDescription>
              6-stellige PIN zum Freigeben von Angeboten. Wird lokal gehasht gespeichert.
              {hasPinSet(compliance) ? " PIN ist gesetzt – leer lassen zum Beibehalten." : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>PIN (6 Ziffern) {!hasPinSet(compliance) && "*"}</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-secondary/50 border-border font-mono tracking-widest"
                required={!hasPinSet(compliance)}
              />
            </div>
            <div className="space-y-2">
              <Label>PIN wiederholen</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-secondary/50 border-border font-mono tracking-widest"
                required={!hasPinSet(compliance) || pin.length > 0}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full font-semibold" disabled={saving}>
          {saving ? "Speichern…" : "Freigabe speichern / prüfen"}
        </Button>
      </form>
    </div>
  );
}
