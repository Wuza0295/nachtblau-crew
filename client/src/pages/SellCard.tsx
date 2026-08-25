import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { ArrowLeft, ImagePlus, CheckCircle, UserRound, LogIn } from "lucide-react";

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
  const { isAuthenticated, user } = useAuth();
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
      <div className="container py-20 text-center space-y-4 max-w-lg">
        <LogIn className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-xl font-bold">Anmelden zum Verkaufen</h1>
        <p className="text-muted-foreground text-sm">
          Jeder registrierte Nutzer kann Angebote einstellen. Bitte anmelden oder Konto erstellen.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate("/anmelden?next=/verkaufen")}>Anmelden</Button>
          <Button variant="outline" onClick={() => navigate("/registrieren?next=/verkaufen")}>
            Registrieren
          </Button>
        </div>
      </div>
    );
  }

  if (!isComplete || !profile) {
    return (
      <div className="container py-20 text-center space-y-4 max-w-lg">
        <UserRound className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-xl font-bold">Zuerst Händlerprofil anlegen</h1>
        <p className="text-muted-foreground text-sm">
          Anzeigename und Standort erscheinen bei deinen Angeboten – wie bei Cardmarket.
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
    if (!user || !profile) return;
    createMutation.mutate(
      {
        cardId: catalogId || undefined,
        title,
        setName: setName || undefined,
        game,
        imageUrl,
        price: parseFloat(price),
        condition: condition as "mint" | "near_mint" | "excellent" | "good" | "played",
        language,
        quantity: parseInt(quantity, 10) || 1,
        isFoil,
        description,
        sellerId: user.id,
        sellerName: profile.displayName,
        sellerAvatar: profile.avatarUrl,
        sellerCountry: profile.country,
        sellerCity: profile.city,
      },
      {
        onSuccess: (listing) => {
          toast.success("Angebot eingestellt");
          navigate(`/karte/${listing.cardId}`);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Link href="/marktplatz">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Marktplatz
        </Button>
      </Link>

      <Card className="bg-card border-border animate-rise">
        <CardHeader>
          <CardTitle className="text-2xl">Neues Angebot</CardTitle>
          <CardDescription>
            Echtes Angebot mit Foto einstellen. Verkaufserlös kommt als Autic Coins (ATC) auf dein
            Guthaben – kein echtes Geld.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {(catalog?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label>Aus vorhandenen Produkten übernehmen (optional)</Label>
              <Select value={catalogId || "none"} onValueChange={applyCatalog}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Neues Angebot —</SelectItem>
                  {catalog?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.setName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-secondary/50 border-border"
              />
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
                <Label htmlFor="set">Set</Label>
                <Input
                  id="set"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kartenbild *</Label>
              <div className="flex gap-3 items-start">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-20 h-28 object-cover rounded border border-border"
                  />
                ) : (
                  <div className="w-20 h-28 rounded border border-dashed border-border flex items-center justify-center bg-secondary/30">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="bg-secondary/50 border-border"
                    onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                    disabled={uploading}
                  />
                  <Input
                    placeholder="oder Bild-URL"
                    value={imageUrl.startsWith("data:") ? "" : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-secondary/50 border-border text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Preis € *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Zustand</Label>
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
                    <SelectItem value="DE">DE</SelectItem>
                    <SelectItem value="EN">EN</SelectItem>
                    <SelectItem value="JP">JP</SelectItem>
                    <SelectItem value="FR">FR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Menge</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="foil">Foil / Holo</Label>
              <Switch id="foil" checked={isFoil} onCheckedChange={setIsFoil} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Beschreibung</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/50 border-border"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full font-bold" size="lg" disabled={uploading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Angebot veröffentlichen
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Käufer können per PayPal, Überweisung oder Paysafe Card zahlen.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
