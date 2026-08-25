/** Offizielle TCG-Artwork-URLs (CDN der Publisher / Katalog-APIs) – keine Fake-Angebote. */

import type { TcgGame } from "./marketplaceStore";

export interface OfficialTcgArt {
  id: string;
  name: string;
  setName: string;
  game: TcgGame;
  imageUrl: string;
  source: string;
}

/**
 * Kuratierte Original-Kartenbilder von öffentlichen TCG-CDNs.
 * Nutzung: Bildquelle beim Einstellen eines echten Angebots – kein Seed-Listing.
 */
export const OFFICIAL_TCG_ART: OfficialTcgArt[] = [
  {
    id: "art-pkm-charizard-ex",
    name: "Charizard ex",
    setName: "Obsidian Flames",
    game: "pokemon",
    imageUrl: "https://images.pokemontcg.io/sv3/223_hires.png",
    source: "pokemontcg.io",
  },
  {
    id: "art-pkm-umbreon-vmax",
    name: "Umbreon VMAX",
    setName: "Evolving Skies",
    game: "pokemon",
    imageUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
    source: "pokemontcg.io",
  },
  {
    id: "art-pkm-pikachu-vmax",
    name: "Pikachu VMAX",
    setName: "Vivid Voltage",
    game: "pokemon",
    imageUrl: "https://images.pokemontcg.io/swsh4/188_hires.png",
    source: "pokemontcg.io",
  },
  {
    id: "art-ygo-dark-magician",
    name: "Dark Magician",
    setName: "Maximum Gold",
    game: "yugioh",
    imageUrl: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
    source: "ygoprodeck.com",
  },
  {
    id: "art-ygo-blue-eyes",
    name: "Blue-Eyes White Dragon",
    setName: "Legend of Blue Eyes",
    game: "yugioh",
    imageUrl: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
    source: "ygoprodeck.com",
  },
  {
    id: "art-mtg-black-lotus",
    name: "Black Lotus",
    setName: "Limited Edition Alpha",
    game: "mtg",
    imageUrl:
      "https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
    source: "scryfall.com",
  },
  {
    id: "art-mtg-omnath",
    name: "Omnath, Locus of Creation",
    setName: "Zendikar Rising",
    game: "mtg",
    imageUrl:
      "https://cards.scryfall.io/normal/front/4/e/4e4fb50c-a81f-44d3-93c5-fa9a0b37f617.jpg",
    source: "scryfall.com",
  },
  {
    id: "art-op-luffy",
    name: "Monkey D. Luffy",
    setName: "Romance Dawn",
    game: "onepiece",
    imageUrl:
      "https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP01/OP01-001_p1_EN.webp",
    source: "limitlesstcg",
  },
  {
    id: "art-lor-mickey",
    name: "Mickey Mouse – Brave Little Tailor",
    setName: "The First Chapter",
    game: "lorcana",
    imageUrl: "https://lorcana-api.com/images/mickey_mouse/brave_little_tailor/large.png",
    source: "lorcana-api.com",
  },
  {
    id: "art-dig-agumon",
    name: "Agumon",
    setName: "BT-01 New Evolution",
    game: "digimon",
    imageUrl: "https://images.digimoncard.io/images/cards/BT1-010.jpg",
    source: "digimoncard.io",
  },
];

export function officialArtForGame(game: TcgGame | "all") {
  if (game === "all") return OFFICIAL_TCG_ART;
  return OFFICIAL_TCG_ART.filter((a) => a.game === game);
}
