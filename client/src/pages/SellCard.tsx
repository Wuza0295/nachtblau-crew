import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateListing, useMarketplaceCards, type TcgGame } from "@/lib/useMarketplace";
import { useTradingProfile, profileSetupPath } from "@/lib/useTradingProfile";
import { fileToCompressedDataUrl } from "@/lib/imageUpload";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Tag, CheckCircle, UserRound } from "lucide-react";

const GAMES: { value: TcgGame; label: string }[] = [
  { value: "pokemon", label: "Pokémon" },
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "mtg", label: "Magic: The Gathering" },
  { value: "onepiece", label: "One Piece" },
  { value: "lorcana", label: "Disney Lorcana" },
  { value: "sports", label: "Sportkarten" },
  { value: "digimon", label: "Digimon" },
];

export default function SellCard() {
  const { isAuthenticated, loginDemo, user } = useAuth();
  const [, navigate] = useLocation();
  const { profile, isComplete } = useTradingProfile(user?.id);
  const { data: catalog } = useMarketplaceCards();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [setName, setSetName] = useState("");
  const [game, setGame] = useState<TcgGame>("pokemon");
  const [catalogId, setCatalogId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("near_mint");
  const [language, setLanguage] = useState("DE");
  const [quantity, setQuantity] = useState("1");
  const [isFoil, setIsFoil] = useState(false);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const createMutation = useCreateListing();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <p className="text-muted-foreground">Melde dich an, um Karten zu verkaufen.</p>
        <Button
          onClick={() => {
            if (isOAuthConfigured()) {
              window.location.href = getLoginUrl();
              return;
            }
            loginDemo();
            toast.success("Angemeldet");
            navigate(profileSetupPath("/verkaufen"));
          }}
        >
          {isOAuthConfigured() ? "Anmelden" : "Anmelden & Profil anlegen"}
        </Button>
      </div>
    );
  }

  if (!isComplete || !profile) {
    return (
      <div className="container py-20 text-center space-y-4 max-w-lg">
        <UserRound className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-xl font-bold">Zuerst Händlerprofil anlegen</h1>
        <p className="text-muted-foreground text-sm">
          Wie bei Cardmarket: Ohne vollständiges Profil kannst du keine Angebote einstellen.
        </p>
        <Button onClick={() => navigate(profileSetupPath("/verkaufen"))}>Profil erstellen</Button>
      </div>
    );
  }

  const applyCatalog = (id: string) => {
    setCatalogId(id);
    if (!id || id === "none") {
      setCatalogId("");
      return;
    }
    const card = catalog?.find((c) => c.id === id);
    if (!card) return;
    setTitle(card.name);
    setSetName(card.setName);
    setGame(card.game);
    if (!imageUrl) setImageUrl(card.imageUrl);
    if (!price) setPrice(String(card.marketPrice));
  };

  const handleImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await fileToCompressedDataUrl(file);
      setImageUrl(url);
      toast.success("Bild hochgeladen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Bitte einen Kartentitel eingeben");
      return;
    }
    if (!imageUrl) {
      toast.error("Bitte ein Foto deiner Karte hochladen");
      return;
    }
    if (!price) {
      toast.error("Bitte einen Preis angeben");
      return;
    }

    createMutation.mutate(
      {
        cardId: catalogId || undefined,
        title: title.trim(),
        setName: setName.trim() || undefined,
        game,
        imageUrl,
        price: parseFloat(price),
        condition: condition as "mint" | "near_mint" | "excellent" | "good" | "played",
        language,
        quantity: parseInt(quantity) || 1,
        isFoil,
        description: description || `${condition} – schneller Versand aus ${profile.city}`,
        sellerId: user?.id,
        sellerName: profile.displayName,
        sellerAvatar: profile.avatarUrl,
        sellerCountry: profile.country,
        sellerCity: profile.city,
      },
      {
        onSuccess: (listing) => {
          toast.success("Angebot eingestellt!");
          navigate(`/karte/${listing.cardId}`);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Link href="/marktplatz">
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Marktplatz
        </Button>
      </Link>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Artikel verkaufen
          </CardTitle>
          <CardDescription>
            Eigener Titel, Produktfoto und Zustand – analog zu Cardmarket-Artikeln. Verkäufer:{" "}
            <strong className="text-foreground">{profile.displayName}</strong> ({profile.country},{" "}
            {profile.city})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Kartentitel *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Charizard ex 223/197 – Deutsch"
                maxLength={80}
                required
                className="bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground">
                Wähle den Titel frei – so erscheint dein Angebot im Marktplatz.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Katalog-Vorlage (optional)</Label>
              <Select value={catalogId || "none"} onValueChange={applyCatalog}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Vorlage übernehmen…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ohne Vorlage – komplett eigenes Angebot</SelectItem>
                  {catalog?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} – {c.setName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>TCG *</Label>
                <Select value={game} onValueChange={(v) => setGame(v as TcgGame)}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMES.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Set / Expansion</Label>
                <Input
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="z. B. Obsidian Flames"
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kartenfoto *</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-28 aspect-[5/7] rounded-lg border border-dashed border-primary/40 bg-secondary/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Vorschau" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-muted-foreground">
                      <ImagePlus className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-[10px]">Foto wählen</span>
                    </div>
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="bg-secondary/50 border-border"
                    onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lade ein Foto deiner tatsächlichen Karte hoch (JPG/PNG). Wird komprimiert und lokal
                    gespeichert.
                  </p>
                  {uploading && <p className="text-xs text-primary">Wird verarbeitet…</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preis (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Anzahl</Label>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zustand *</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mint">Mint (M)</SelectItem>
                    <SelectItem value="near_mint">Near Mint (NM)</SelectItem>
                    <SelectItem value="excellent">Excellent (EX)</SelectItem>
                    <SelectItem value="good">Good (GD)</SelectItem>
                    <SelectItem value="played">Played (PL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sprache</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE">Deutsch</SelectItem>
                    <SelectItem value="EN">Englisch</SelectItem>
                    <SelectItem value="JP">Japanisch</SelectItem>
                    <SelectItem value="FR">Französisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isFoil} onCheckedChange={setIsFoil} id="foil" />
              <Label htmlFor="foil">Foil / Holografisch</Label>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zustand im Detail, Versand, Besonderheiten…"
                className="bg-secondary/50 border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 font-bold"
              size="lg"
              disabled={createMutation.isPending || uploading}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {createMutation.isPending ? "Wird erstellt…" : "Angebot einstellen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
