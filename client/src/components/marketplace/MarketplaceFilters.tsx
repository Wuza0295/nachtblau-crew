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
  SORT_OPTIONS,
} from "@/lib/marketplaceConstants";

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
  onSearch: (next?: FilterState) => void;
}

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

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 sm:p-4 space-y-3">
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

        <Select value={filters.sort} onValueChange={(v) => update("sort", v)}>
          <SelectTrigger className="w-[160px] h-9 bg-secondary/50 border-border text-sm">
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

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const cleared: FilterState = {
                query: "",
                game: "all",
                condition: "all",
                sort: "popular",
                minPrice: "",
                maxPrice: "",
              };
              onChange(cleared);
              onSearch(cleared);
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
