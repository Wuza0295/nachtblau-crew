import { nanoid } from "nanoid";

export type TcgGame =
  | "pokemon"
  | "yugioh"
  | "mtg"
  | "onepiece"
  | "lorcana"
  | "sports"
  | "digimon";

export type CardCondition = "mint" | "near_mint" | "excellent" | "good" | "played";

export type ListingStatus = "active" | "sold" | "reserved";

export interface CardCatalogEntry {
  id: string;
  name: string;
  setName: string;
  game: TcgGame;
  rarity: string;
  number: string;
  imageUrl: string;
  marketPrice: number;
  priceHistory: { date: string; price: number }[];
  avgRating: number;
  reviewCount: number;
}

export interface Listing {
  id: string;
  cardId: string;
  sellerId: number;
  sellerName: string;
  price: number;
  condition: CardCondition;
  language: string;
  quantity: number;
  isFoil: boolean;
  isGraded: boolean;
  grade?: string;
  description: string;
  imageUrl: string;
  status: ListingStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  sellerId: number;
  buyerId: number;
  buyerName: string;
  listingId: string;
  cardName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SellerProfile {
  id: number;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  responseTime: string;
  memberSince: string;
  verified: boolean;
}

const GAME_LABELS: Record<TcgGame, string> = {
  pokemon: "Pokémon",
  yugioh: "Yu-Gi-Oh!",
  mtg: "Magic: The Gathering",
  onepiece: "One Piece",
  lorcana: "Disney Lorcana",
  sports: "Sportkarten",
  digimon: "Digimon",
};

export function getGameLabel(game: TcgGame) {
  return GAME_LABELS[game];
}

const CONDITION_LABELS: Record<CardCondition, string> = {
  mint: "Mint (M)",
  near_mint: "Near Mint (NM)",
  excellent: "Excellent (EX)",
  good: "Good (GD)",
  played: "Played (PL)",
};

export function getConditionLabel(c: CardCondition) {
  return CONDITION_LABELS[c];
}

function priceHistory(base: number): { date: string; price: number }[] {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(now - (29 - i) * 86400000).toISOString().slice(0, 10),
    price: Math.round(base * (0.85 + Math.random() * 0.3) * 100) / 100,
  }));
}

const SEED_CARDS: CardCatalogEntry[] = [
  {
    id: "card-001",
    name: "Charizard ex",
    setName: "Obsidian Flames",
    game: "pokemon",
    rarity: "Ultra Rare",
    number: "223/197",
    imageUrl: "https://images.unsplash.com/photo-1647892591717-28c7fd63bb3f?w=400&h=560&fit=crop",
    marketPrice: 89.99,
    priceHistory: priceHistory(89.99),
    avgRating: 4.8,
    reviewCount: 124,
  },
  {
    id: "card-002",
    name: "Dark Magician",
    setName: "Maximum Gold",
    game: "yugioh",
    rarity: "Secret Rare",
    number: "MAGO-EN001",
    imageUrl: "https://images.unsplash.com/photo-1674106890393-7dd7b5edd398?w=400&h=560&fit=crop",
    marketPrice: 34.5,
    priceHistory: priceHistory(34.5),
    avgRating: 4.9,
    reviewCount: 89,
  },
  {
    id: "card-003",
    name: "Black Lotus",
    setName: "Alpha",
    game: "mtg",
    rarity: "Mythic",
    number: "A-232",
    imageUrl: "https://images.unsplash.com/photo-1593814681110-cbf22baf6d79?w=400&h=560&fit=crop",
    marketPrice: 12500,
    priceHistory: priceHistory(12500),
    avgRating: 5.0,
    reviewCount: 42,
  },
  {
    id: "card-004",
    name: "Luffy (Leader)",
    setName: "Romance Dawn",
    game: "onepiece",
    rarity: "Leader",
    number: "OP01-001",
    imageUrl: "https://images.unsplash.com/photo-1742743032749-187b17179e0f?w=400&h=560&fit=crop",
    marketPrice: 156.0,
    priceHistory: priceHistory(156),
    avgRating: 4.7,
    reviewCount: 67,
  },
  {
    id: "card-005",
    name: "Mickey Mouse – Brave Little Tailor",
    setName: "The First Chapter",
    game: "lorcana",
    rarity: "Legendary",
    number: "207/204",
    imageUrl: "https://images.unsplash.com/photo-1551306667-f32e7af055f2?w=400&h=560&fit=crop",
    marketPrice: 78.0,
    priceHistory: priceHistory(78),
    avgRating: 4.6,
    reviewCount: 53,
  },
  {
    id: "card-006",
    name: "Rickey Henderson Rookie",
    setName: "Topps 1980",
    game: "sports",
    rarity: "Rookie",
    number: "482",
    imageUrl: "https://images.unsplash.com/photo-1551306683-9e7cf1661af1?w=400&h=560&fit=crop",
    marketPrice: 420.0,
    priceHistory: priceHistory(420),
    avgRating: 4.9,
    reviewCount: 31,
  },
  {
    id: "card-007",
    name: "Pikachu VMAX",
    setName: "Vivid Voltage",
    game: "pokemon",
    rarity: "Secret Rare",
    number: "188/185",
    imageUrl: "https://images.unsplash.com/photo-1647892591717-28c7fd63bb3f?w=400&h=560&fit=crop&crop=entropy",
    marketPrice: 45.0,
    priceHistory: priceHistory(45),
    avgRating: 4.5,
    reviewCount: 201,
  },
  {
    id: "card-008",
    name: "Blue-Eyes White Dragon",
    setName: "Legend of Blue Eyes",
    game: "yugioh",
    rarity: "Ultra Rare",
    number: "LOB-001",
    imageUrl: "https://images.unsplash.com/photo-170885603413-ef824a69717c?w=400&h=560&fit=crop",
    marketPrice: 62.0,
    priceHistory: priceHistory(62),
    avgRating: 4.8,
    reviewCount: 156,
  },
  {
    id: "card-009",
    name: "Omnath, Locus of Creation",
    setName: "Zendikar Rising",
    game: "mtg",
    rarity: "Mythic",
    number: "232/280",
    imageUrl: "https://images.unsplash.com/photo-1513002433973-e0a181372d60?w=400&h=560&fit=crop",
    marketPrice: 12.5,
    priceHistory: priceHistory(12.5),
    avgRating: 4.4,
    reviewCount: 38,
  },
  {
    id: "card-010",
    name: "Agumon",
    setName: "BT-01 New Evolution",
    game: "digimon",
    rarity: "Rare",
    number: "BT1-010",
    imageUrl: "https://images.unsplash.com/photo-1551306667-f32e7af055f2?w=400&h=560&fit=crop&crop=left",
    marketPrice: 8.99,
    priceHistory: priceHistory(8.99),
    avgRating: 4.3,
    reviewCount: 22,
  },
];

const SEED_SELLERS: SellerProfile[] = [
  {
    id: 1,
    name: "CardKing_DE",
    rating: 4.9,
    reviewCount: 342,
    salesCount: 1280,
    responseTime: "< 2h",
    memberSince: "2019",
    verified: true,
  },
  {
    id: 2,
    name: "TCG_Treasure",
    rating: 4.7,
    reviewCount: 189,
    salesCount: 756,
    responseTime: "< 4h",
    memberSince: "2020",
    verified: true,
  },
  {
    id: 3,
    name: "MintHunter",
    rating: 4.8,
    reviewCount: 97,
    salesCount: 412,
    responseTime: "< 1h",
    memberSince: "2021",
    verified: false,
  },
];

function seedListings(): Listing[] {
  const conditions: CardCondition[] = ["mint", "near_mint", "excellent", "good"];
  const listings: Listing[] = [];
  for (const card of SEED_CARDS) {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const seller = SEED_SELLERS[i % SEED_SELLERS.length];
      const cond = conditions[i % conditions.length];
      const variance = 0.85 + Math.random() * 0.35;
      listings.push({
        id: `lst-${card.id}-${i}`,
        cardId: card.id,
        sellerId: seller.id,
        sellerName: seller.name,
        price: Math.round(card.marketPrice * variance * 100) / 100,
        condition: cond,
        language: i % 2 === 0 ? "DE" : "EN",
        quantity: 1 + (i % 3),
        isFoil: i % 3 === 0,
        isGraded: i === 0 && card.marketPrice > 100,
        grade: i === 0 && card.marketPrice > 100 ? "PSA 9" : undefined,
        description: `${getConditionLabel(cond)} – schneller Versand aus Deutschland`,
        imageUrl: card.imageUrl,
        status: "active",
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      });
    }
  }
  return listings;
}

const SEED_REVIEWS: Review[] = [
  {
    id: "rev-1",
    sellerId: 1,
    buyerId: 10,
    buyerName: "PokeFan42",
    listingId: "lst-card-001-0",
    cardName: "Charizard ex",
    rating: 5,
    comment: "Karte in perfektem Zustand, super verpackt. Gerne wieder!",
    createdAt: "2026-07-10T14:30:00Z",
  },
  {
    id: "rev-2",
    sellerId: 1,
    buyerId: 11,
    buyerName: "DuelMaster",
    listingId: "lst-card-002-0",
    cardName: "Dark Magician",
    rating: 5,
    comment: "Blitzversand, Karte wie beschrieben. Top Verkäufer.",
    createdAt: "2026-07-08T09:15:00Z",
  },
  {
    id: "rev-3",
    sellerId: 2,
    buyerId: 12,
    buyerName: "MTG_Collector",
    listingId: "lst-card-003-0",
    cardName: "Black Lotus",
    rating: 4,
    comment: "Gute Kommunikation, leichte Kantenabnutzung aber im Rahmen.",
    createdAt: "2026-07-05T18:00:00Z",
  },
  {
    id: "rev-4",
    sellerId: 2,
    buyerId: 13,
    buyerName: "SportsCards_DE",
    listingId: "lst-card-006-0",
    cardName: "Rickey Henderson Rookie",
    rating: 5,
    comment: "Authentische Karte, professionell verpackt. Sehr zufrieden.",
    createdAt: "2026-07-01T11:45:00Z",
  },
];

// In-memory store
let cards = [...SEED_CARDS];
let listings = seedListings();
let reviews = [...SEED_REVIEWS];
let sellers = [...SEED_SELLERS];

export interface SearchFilters {
  query?: string;
  game?: TcgGame;
  minPrice?: number;
  maxPrice?: number;
  condition?: CardCondition;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
  limit?: number;
  offset?: number;
}

export function searchMarketplace(filters: SearchFilters) {
  const { query, game, minPrice, maxPrice, condition, sort = "popular", limit = 24, offset = 0 } =
    filters;

  let activeListings = listings.filter((l) => l.status === "active");

  if (game) activeListings = activeListings.filter((l) => cards.find((c) => c.id === l.cardId)?.game === game);
  if (condition) activeListings = activeListings.filter((l) => l.condition === condition);
  if (minPrice !== undefined) activeListings = activeListings.filter((l) => l.price >= minPrice);
  if (maxPrice !== undefined) activeListings = activeListings.filter((l) => l.price <= maxPrice);

  if (query) {
    const q = query.toLowerCase();
    activeListings = activeListings.filter((l) => {
      const card = cards.find((c) => c.id === l.cardId);
      return (
        card?.name.toLowerCase().includes(q) ||
        card?.setName.toLowerCase().includes(q) ||
        l.sellerName.toLowerCase().includes(q)
      );
    });
  }

  // Group by card, pick cheapest listing per card for grid view
  const cardMap = new Map<string, Listing>();
  for (const l of activeListings) {
    const existing = cardMap.get(l.cardId);
    if (!existing || l.price < existing.price) cardMap.set(l.cardId, l);
  }

  let results = Array.from(cardMap.values()).map((listing) => {
    const card = cards.find((c) => c.id === listing.cardId)!;
    const listingCount = activeListings.filter((l) => l.cardId === card.id).length;
    return { listing, card, listingCount };
  });

  switch (sort) {
    case "price_asc":
      results.sort((a, b) => a.listing.price - b.listing.price);
      break;
    case "price_desc":
      results.sort((a, b) => b.listing.price - a.listing.price);
      break;
    case "newest":
      results.sort(
        (a, b) => new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime()
      );
      break;
    default:
      results.sort((a, b) => b.card.reviewCount - a.card.reviewCount);
  }

  const total = results.length;
  results = results.slice(offset, offset + limit);

  return { results, total };
}

export function getCardById(cardId: string) {
  return cards.find((c) => c.id === cardId);
}

export function getListingsForCard(cardId: string) {
  return listings
    .filter((l) => l.cardId === cardId && l.status === "active")
    .sort((a, b) => a.price - b.price);
}

export function getListingById(listingId: string) {
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return null;
  const card = cards.find((c) => c.id === listing.cardId);
  return { listing, card };
}

export function getSellerProfile(sellerId: number) {
  const seller = sellers.find((s) => s.id === sellerId);
  if (!seller) return null;
  const sellerReviews = reviews.filter((r) => r.sellerId === sellerId);
  const activeListings = listings.filter((l) => l.sellerId === sellerId && l.status === "active");
  return { seller, reviews: sellerReviews, activeListings };
}

export function createListing(input: {
  cardId: string;
  sellerId: number;
  sellerName: string;
  price: number;
  condition: CardCondition;
  language: string;
  quantity: number;
  isFoil: boolean;
  description: string;
}) {
  const card = cards.find((c) => c.id === input.cardId);
  if (!card) throw new Error("Karte nicht gefunden");

  const listing: Listing = {
    id: `lst-${nanoid(8)}`,
    cardId: input.cardId,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    price: input.price,
    condition: input.condition,
    language: input.language,
    quantity: input.quantity,
    isFoil: input.isFoil,
    isGraded: false,
    description: input.description,
    imageUrl: card.imageUrl,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  listings.unshift(listing);
  return listing;
}

export function purchaseListing(listingId: string, buyerId: number, buyerName: string) {
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) throw new Error("Angebot nicht gefunden");
  if (listing.status !== "active") throw new Error("Angebot nicht mehr verfügbar");

  listing.status = "sold";
  listing.quantity = Math.max(0, listing.quantity - 1);
  if (listing.quantity > 0) listing.status = "active";

  const card = cards.find((c) => c.id === listing.cardId);
  const seller = sellers.find((s) => s.id === listing.sellerId);
  if (seller) seller.salesCount += 1;

  return {
    success: true,
    orderId: `ord-${nanoid(10)}`,
    listing,
    card,
    message: `Kauf erfolgreich! ${card?.name ?? "Karte"} von ${listing.sellerName}`,
  };
}

export function createReview(input: {
  sellerId: number;
  buyerId: number;
  buyerName: string;
  listingId: string;
  rating: number;
  comment: string;
}) {
  const listing = listings.find((l) => l.id === input.listingId);
  const card = listing ? cards.find((c) => c.id === listing.cardId) : null;

  const review: Review = {
    id: `rev-${nanoid(8)}`,
    sellerId: input.sellerId,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    listingId: input.listingId,
    cardName: card?.name ?? "Unbekannte Karte",
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(review);

  // Update seller rating
  const seller = sellers.find((s) => s.id === input.sellerId);
  if (seller) {
    const sellerReviews = reviews.filter((r) => r.sellerId === input.sellerId);
    seller.reviewCount = sellerReviews.length;
    seller.rating =
      Math.round(
        (sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length) * 10
      ) / 10;
  }

  return review;
}

export function getMarketplaceStats() {
  const activeListings = listings.filter((l) => l.status === "active");
  return {
    totalCards: cards.length,
    activeListings: activeListings.length,
    totalSellers: sellers.length,
    avgRating:
      Math.round((sellers.reduce((s, sel) => s + sel.rating, 0) / sellers.length) * 10) / 10,
    games: Object.entries(GAME_LABELS).map(([key, label]) => ({
      game: key as TcgGame,
      label,
      count: activeListings.filter((l) => cards.find((c) => c.id === l.cardId)?.game === key).length,
    })),
  };
}

export function getAllCards() {
  return cards;
}
