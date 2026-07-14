import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";

const GAME_COLORS: Record<string, string> = {
  pokemon: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  yugioh: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  mtg: "bg-amber-700/20 text-amber-300 border-amber-700/30",
  onepiece: "bg-red-500/20 text-red-300 border-red-500/30",
  lorcana: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  sports: "bg-green-500/20 text-green-300 border-green-500/30",
  digimon: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const GAME_LABELS: Record<string, string> = {
  pokemon: "Pokémon",
  yugioh: "Yu-Gi-Oh!",
  mtg: "MTG",
  onepiece: "One Piece",
  lorcana: "Lorcana",
  sports: "Sport",
  digimon: "Digimon",
};

interface CardTileProps {
  cardId: string;
  name: string;
  setName: string;
  game: string;
  imageUrl: string;
  price: number;
  listingCount: number;
  avgRating: number;
  isFoil?: boolean;
}

export default function CardTile({
  cardId,
  name,
  setName,
  game,
  imageUrl,
  price,
  listingCount,
  avgRating,
  isFoil,
}: CardTileProps) {
  return (
    <Link href={`/karte/${cardId}`}>
      <Card className="group card-glow bg-card border-border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 h-full">
        <div className="relative h-36 sm:h-40 overflow-hidden bg-secondary/30">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover object-top transition-transform duration-400 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
          <Badge
            className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0 ${GAME_COLORS[game] ?? ""}`}
            variant="outline"
          >
            {GAME_LABELS[game] ?? game}
          </Badge>
          {isFoil && (
            <Badge className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-400/30 to-purple-400/30 text-amber-200 border-amber-400/40">
              Foil
            </Badge>
          )}
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <p className="font-bold text-sm text-foreground drop-shadow-lg">
              ab €{price.toFixed(2)}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {listingCount} Angebot{listingCount !== 1 ? "e" : ""}
            </p>
          </div>
        </div>
        <CardContent className="p-2 space-y-0.5">
          <h3 className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{setName}</p>
          <StarRating rating={avgRating} size="sm" />
        </CardContent>
      </Card>
    </Link>
  );
}
