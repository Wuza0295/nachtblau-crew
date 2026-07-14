import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface FilterState {
  query: string;
  game: string;
  condition: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
}

interface MarketplaceFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onSearch: () => void;
}

const GAMES = [
  { value: "all", label: "Alle TCGs" },
  { value: "pokemon", label: "Pokémon" },
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "mtg", label: "Magic: The Gathering" },
  { value: "onepiece", label: "One Piece" },
  { value: "lorcana", label: "Disney Lorcana" },
  { value: "sports", label: "Sportkarten" },
  { value: "digimon", label: "Digimon" },
];

const CONDITIONS = [
  { value: "all", label: "Alle Zustände" },
  { value: "mint", label: "Mint (M)" },
  { value: "near_mint", label: "Near Mint (NM)" },
  { value: "excellent", label: "Excellent (EX)" },
  { value: "good", label: "Good (GD)" },
  { value: "played", label: "Played (PL)" },
];

const SORTS = [
  { value: "popular", label: "Beliebteste" },
  { value: "price_asc", label: "Preis ↑" },
  { value: "price_desc", label: "Preis ↓" },
  { value: "newest", label: "Neueste" },
];

export default function MarketplaceFilters({
  filters,
  onChange,
  onSearch,
}: MarketplaceFiltersProps) {
  const update = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasFilters =
    filters.query ||
    filters.game !== "all" ||
    filters.condition !== "all" ||
    filters.minPrice ||
    filters.maxPrice;

  const clearFilters = () =>
    onChange({
      query: "",
      game: "all",
      condition: "all",
      sort: "popular",
      minPrice: "",
      maxPrice: "",
    });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Karte, Set oder Verkäufer suchen…"
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-9 bg-secondary/50 border-border"
          />
        </div>
        <Button onClick={onSearch} className="bg-primary hover:bg-primary/80 shrink-0">
          Suchen
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />

        <Select value={filters.game} onValueChange={(v) => update("game", v)}>
          <SelectTrigger className="w-[140px] h-9 bg-secondary/50 border-border text-sm">
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

        <Select value={filters.condition} onValueChange={(v) => update("condition", v)}>
          <SelectTrigger className="w-[150px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(v) => update("sort", v)}>
          <SelectTrigger className="w-[130px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Min €"
          value={filters.minPrice}
          onChange={(e) => update("minPrice", e.target.value)}
          className="w-20 h-9 bg-secondary/50 border-border text-sm"
          type="number"
        />
        <Input
          placeholder="Max €"
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", e.target.value)}
          className="w-20 h-9 bg-secondary/50 border-border text-sm"
          type="number"
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3 w-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}
