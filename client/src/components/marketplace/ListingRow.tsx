import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import {
  CONDITION_LABELS,
  GAME_COLORS,
  GAME_LABELS,
  formatEuro,
} from "@/lib/marketplaceConstants";
import type { CardCondition, TcgGame } from "@/lib/marketplaceStore";
import { ShoppingCart } from "lucide-react";

interface ListingRowProps {
  cardId: string;
  name: string;
  setName: string;
  game: string;
  imageUrl: string;
  price: number;
  listingCount: number;
  avgRating: number;
  condition?: CardCondition;
  language?: string;
  sellerName?: string;
  isFoil?: boolean;
}

export default function ListingRow({
  cardId,
  name,
  setName,
  game,
  imageUrl,
  price,
  listingCount,
  avgRating,
  condition,
  language,
  sellerName,
  isFoil,
}: ListingRowProps) {
  return (
    <Link
      href={`/karte/${cardId}`}
      className="group flex items-center gap-3 sm:gap-4 rounded-lg border border-border bg-card/60 px-3 py-2.5 hover:border-primary/40 hover:bg-card transition-colors"
    >
      <img
        src={imageUrl}
        alt=""
        className="h-14 w-10 sm:h-16 sm:w-12 object-cover rounded border border-border shrink-0 bg-secondary/40"
        loading="lazy"
      />

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 ${GAME_COLORS[game] ?? ""}`}
          >
            {GAME_LABELS[game as TcgGame] ?? game}
          </Badge>
          {isFoil && (
            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-200 border-amber-400/40">
              Foil
            </Badge>
          )}
          {condition && (
            <span className="text-[10px] text-muted-foreground">
              {CONDITION_LABELS[condition]}
            </span>
          )}
          {language && <span className="text-[10px] text-muted-foreground">· {language}</span>}
        </div>
        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {setName}
          {sellerName ? ` · ${sellerName}` : ""}
        </p>
        <div className="sm:hidden pt-0.5">
          <StarRating rating={avgRating} size="sm" />
        </div>
      </div>

      <div className="hidden sm:block shrink-0">
        <StarRating rating={avgRating} size="sm" />
      </div>

      <div className="text-right shrink-0 min-w-[4.5rem]">
        <p className="font-bold text-primary text-sm sm:text-base">{formatEuro(price)}</p>
        <p className="text-[10px] text-muted-foreground">
          {listingCount} Angebot{listingCount !== 1 ? "e" : ""}
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="hidden md:inline-flex shrink-0 border-primary/40 text-primary h-8"
        tabIndex={-1}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
      </Button>
    </Link>
  );
}
