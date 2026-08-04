import type { CardCondition, TcgGame } from "./marketplaceStore";

export const GAME_OPTIONS: { value: TcgGame; label: string; short: string }[] = [
  { value: "pokemon", label: "Pokémon", short: "Pokémon" },
  { value: "yugioh", label: "Yu-Gi-Oh!", short: "Yu-Gi-Oh!" },
  { value: "mtg", label: "Magic: The Gathering", short: "MTG" },
  { value: "onepiece", label: "One Piece", short: "One Piece" },
  { value: "lorcana", label: "Disney Lorcana", short: "Lorcana" },
  { value: "sports", label: "Sportkarten", short: "Sport" },
  { value: "digimon", label: "Digimon", short: "Digimon" },
];

export const CONDITION_OPTIONS: { value: CardCondition; label: string; short: string }[] = [
  { value: "mint", label: "Mint (M)", short: "M" },
  { value: "near_mint", label: "Near Mint (NM)", short: "NM" },
  { value: "excellent", label: "Excellent (EX)", short: "EX" },
  { value: "good", label: "Good (GD)", short: "GD" },
  { value: "played", label: "Played (PL)", short: "PL" },
];

export const SORT_OPTIONS = [
  { value: "popular", label: "Beliebteste" },
  { value: "price_asc", label: "Preis aufsteigend" },
  { value: "price_desc", label: "Preis absteigend" },
  { value: "newest", label: "Neueste zuerst" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "DE", label: "Deutsch" },
  { value: "EN", label: "Englisch" },
  { value: "JP", label: "Japanisch" },
  { value: "FR", label: "Französisch" },
  { value: "IT", label: "Italienisch" },
  { value: "ES", label: "Spanisch" },
] as const;

export const GAME_LABELS: Record<TcgGame, string> = Object.fromEntries(
  GAME_OPTIONS.map((g) => [g.value, g.label])
) as Record<TcgGame, string>;

export const CONDITION_LABELS: Record<CardCondition, string> = Object.fromEntries(
  CONDITION_OPTIONS.map((c) => [c.value, c.label])
) as Record<CardCondition, string>;

export const GAME_COLORS: Record<string, string> = {
  pokemon: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  yugioh: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  mtg: "bg-amber-700/20 text-amber-300 border-amber-700/30",
  onepiece: "bg-red-500/20 text-red-300 border-red-500/30",
  lorcana: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  sports: "bg-green-500/20 text-green-300 border-green-500/30",
  digimon: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export function formatEuro(price: number) {
  return `€${price.toFixed(2)}`;
}
