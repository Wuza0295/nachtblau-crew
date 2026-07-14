import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Tag, CheckCircle } from "lucide-react";

export default function SellCard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: cards } = trpc.marketplace.getCards.useQuery();

  const [cardId, setCardId] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("near_mint");
  const [language, setLanguage] = useState("DE");
  const [quantity, setQuantity] = useState("1");
  const [isFoil, setIsFoil] = useState(false);
  const [description, setDescription] = useState("");

  const createMutation = trpc.marketplace.createListing.useMutation({
    onSuccess: (listing) => {
      toast.success("Angebot erfolgreich erstellt!");
      navigate(`/karte/${listing.cardId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <p className="text-muted-foreground">Melde dich an, um Karten zu verkaufen.</p>
        <Button onClick={() => (window.location.href = getLoginUrl())}>Anmelden</Button>
      </div>
    );
  }

  const selectedCard = cards?.find((c) => c.id === cardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId || !price) {
      toast.error("Bitte Karte und Preis auswählen");
      return;
    }
    createMutation.mutate({
      cardId,
      price: parseFloat(price),
      condition: condition as "mint" | "near_mint" | "excellent" | "good" | "played",
      language,
      quantity: parseInt(quantity) || 1,
      isFoil,
      description: description || `${condition} – schneller Versand`,
    });
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
            Karte verkaufen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Karte auswählen</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Karte wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {cards?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} – {c.setName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCard && (
              <div className="flex gap-4 p-3 rounded-lg bg-secondary/30 border border-border">
                <img
                  src={selectedCard.imageUrl}
                  alt={selectedCard.name}
                  className="w-16 h-22 object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{selectedCard.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCard.setName}</p>
                  <p className="text-sm text-primary mt-1">
                    Marktpreis: €{selectedCard.marketPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preis (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
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
              <Label>Beschreibung (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zustand, Versand, Besonderheiten…"
                className="bg-secondary/50 border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 font-bold"
              size="lg"
              disabled={createMutation.isPending}
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
