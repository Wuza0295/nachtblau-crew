import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";
import { GAME_COLORS, GAME_LABELS, formatEuro } from "@/lib/marketplaceConstants";
import type { TcgGame } from "@/lib/marketplaceStore";

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
            {GAME_LABELS[game as TcgGame] ?? game}
          </Badge>
          {isFoil && (
            <Badge className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-400/30 to-purple-400/30 text-amber-200 border-amber-400/40">
              Foil
            </Badge>
          )}
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <p className="font-bold text-sm text-foreground drop-shadow-lg">
              ab {formatEuro(price)}
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
