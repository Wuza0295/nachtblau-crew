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
import {
  CONDITION_OPTIONS,
  GAME_OPTIONS,
  LANGUAGE_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/marketplaceConstants";

export interface FilterState {
  query: string;
  game: string;
  condition: string;
  language: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  foilOnly: boolean;
  gradedOnly: boolean;
  minSellerSales: string;
}

interface MarketplaceFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onSearch: (next?: FilterState) => void;
}

const EMPTY: FilterState = {
  query: "",
  game: "all",
  condition: "all",
  language: "all",
  sort: "best_offer",
  minPrice: "",
  maxPrice: "",
  foilOnly: false,
  gradedOnly: false,
  minSellerSales: "",
};

export default function MarketplaceFilters({
  filters,
  onChange,
  onSearch,
}: MarketplaceFiltersProps) {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const hasFilters =
    filters.query ||
    filters.game !== "all" ||
    filters.condition !== "all" ||
    filters.language !== "all" ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.foilOnly ||
    filters.gradedOnly ||
    filters.minSellerSales;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 sm:p-4 space-y-3 animate-rise">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Produkt, Set oder Verkäufer…"
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-9 bg-secondary/50 border-border h-10"
          />
        </div>
        <Button onClick={() => onSearch()} className="bg-primary hover:bg-primary/80 shrink-0 h-10 px-5">
          Suchen
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />

        <Select value={filters.game} onValueChange={(v) => update("game", v)}>
          <SelectTrigger className="w-[150px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue placeholder="TCG" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle TCGs</SelectItem>
            {GAME_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.condition} onValueChange={(v) => update("condition", v)}>
          <SelectTrigger className="w-[150px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue placeholder="Zustand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Zustände</SelectItem>
            {CONDITION_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.language} onValueChange={(v) => update("language", v)}>
          <SelectTrigger className="w-[130px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue placeholder="Sprache" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Sprachen</SelectItem>
            {LANGUAGE_OPTIONS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(v) => update("sort", v)}>
          <SelectTrigger className="w-[170px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue placeholder="Sortierung" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Min €"
            value={filters.minPrice}
            onChange={(e) => update("minPrice", e.target.value)}
            className="w-[4.5rem] h-9 bg-secondary/50 border-border text-sm"
            type="number"
            min="0"
            step="0.01"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            placeholder="Max €"
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
            className="w-[4.5rem] h-9 bg-secondary/50 border-border text-sm"
            type="number"
            min="0"
            step="0.01"
          />
        </div>

        <Select
          value={filters.minSellerSales || "0"}
          onValueChange={(v) => update("minSellerSales", v === "0" ? "" : v)}
        >
          <SelectTrigger className="w-[160px] h-9 bg-secondary/50 border-border text-sm">
            <SelectValue placeholder="Verkäufer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Alle Verkäufer</SelectItem>
            <SelectItem value="100">≥ 100 Verkäufe</SelectItem>
            <SelectItem value="500">≥ 500 Verkäufe</SelectItem>
            <SelectItem value="1000">≥ 1000 Verkäufe</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          variant={filters.foilOnly ? "default" : "outline"}
          className="h-9"
          onClick={() => update("foilOnly", !filters.foilOnly)}
        >
          Nur Foil
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filters.gradedOnly ? "default" : "outline"}
          className="h-9"
          onClick={() => update("gradedOnly", !filters.gradedOnly)}
        >
          Graded
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(EMPTY);
              onSearch(EMPTY);
            }}
            className="text-muted-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}
