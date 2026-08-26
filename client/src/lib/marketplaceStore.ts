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
  /** Seller-chosen article title (Cardmarket-style) */
  title: string;
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
  country?: string;
  city?: string;
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

/** Keine Demo-/Platzhalter-Angebote – Marktplatz startet leer; Nutzer stellen reale Angebote ein. */
const STORAGE_KEY = "autic-marketplace-v3";

type PersistedState = {
  cards: CardCatalogEntry[];
  listings: Listing[];
  reviews: Review[];
  sellers: SellerProfile[];
};

function isPlaceholderListing(listing: Listing) {
  return /^lst-card-\d{3}-/.test(listing.id);
}

function isPlaceholderCard(card: CardCatalogEntry) {
  return /^card-\d{3}$/.test(card.id);
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    localStorage.removeItem("autic-marketplace-v1");
    localStorage.removeItem("autic-marketplace-v2");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(data.cards) || !Array.isArray(data.listings)) return null;
    data.listings = data.listings
      .filter((l) => !isPlaceholderListing(l))
      .map((l) => ({
        ...l,
        title: l.title || data.cards.find((c) => c.id === l.cardId)?.name || "Karte",
      }));
    data.cards = data.cards.filter(
      (c) => !isPlaceholderCard(c) && data.listings.some((l) => l.cardId === c.id)
    );
    data.reviews = Array.isArray(data.reviews)
      ? data.reviews.filter((r) => data.listings.some((l) => l.id === r.listingId) || !/^rev-[1-4]$/.test(r.id))
      : [];
    // Drop fake seed sellers (ids 1–3 without real user listings) unless they still have listings
    data.sellers = Array.isArray(data.sellers)
      ? data.sellers.filter((s) => data.listings.some((l) => l.sellerId === s.id))
      : [];
    return data;
  } catch {
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cards, listings, reviews, sellers } satisfies PersistedState)
    );
  } catch (err) {
    console.warn("[marketplace] Speichern fehlgeschlagen (Speicher voll?)", err);
  }
}

const persisted = loadPersisted();

// In-memory store – leer bis echte User-Angebote existieren
let cards: CardCatalogEntry[] = persisted?.cards ?? [];
let listings: Listing[] = persisted?.listings ?? [];
let reviews: Review[] = persisted?.reviews ?? [];
let sellers: SellerProfile[] = persisted?.sellers ?? [];

export interface SearchFilters {
  query?: string;
  game?: TcgGame;
  minPrice?: number;
  maxPrice?: number;
  condition?: CardCondition;
  language?: string;
  foilOnly?: boolean;
  gradedOnly?: boolean;
  minSellerSales?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "best_offer";
  limit?: number;
  offset?: number;
}

export function searchMarketplace(filters: SearchFilters) {
  const {
    query,
    game,
    minPrice,
    maxPrice,
    condition,
    language,
    foilOnly,
    gradedOnly,
    minSellerSales,
    sort = "best_offer",
    limit = 24,
    offset = 0,
  } = filters;

  let activeListings = listings.filter((l) => l.status === "active");

  if (game) activeListings = activeListings.filter((l) => cards.find((c) => c.id === l.cardId)?.game === game);
  if (condition) activeListings = activeListings.filter((l) => l.condition === condition);
  if (language) activeListings = activeListings.filter((l) => l.language === language);
  if (foilOnly) activeListings = activeListings.filter((l) => l.isFoil);
  if (gradedOnly) activeListings = activeListings.filter((l) => l.isGraded);
  if (minPrice !== undefined) activeListings = activeListings.filter((l) => l.price >= minPrice);
  if (maxPrice !== undefined) activeListings = activeListings.filter((l) => l.price <= maxPrice);
  if (minSellerSales !== undefined) {
    activeListings = activeListings.filter((l) => {
      const seller = sellers.find((s) => s.id === l.sellerId);
      return (seller?.salesCount ?? 0) >= minSellerSales;
    });
  }

  if (query) {
    const q = query.toLowerCase();
    activeListings = activeListings.filter((l) => {
      const card = cards.find((c) => c.id === l.cardId);
      return (
        l.title.toLowerCase().includes(q) ||
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
    const seller = sellers.find((s) => s.id === listing.sellerId);
    return {
      listing,
      card: {
        ...card,
        name: listing.title || card.name,
        imageUrl: listing.imageUrl || card.imageUrl,
      },
      listingCount,
      seller,
    };
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
    case "best_offer":
      // Cardmarket-style blend: price + seller reputation
      results.sort((a, b) => {
        const score = (r: (typeof results)[0]) => {
          const sales = r.seller?.salesCount ?? 0;
          const rating = r.seller?.rating ?? 0;
          return r.listing.price / (1 + Math.log10(1 + sales) * 0.15 + rating * 0.02);
        };
        return score(a) - score(b);
      });
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

export function ensureSellerProfile(input: {
  id: number;
  name: string;
  avatar?: string;
  country?: string;
  city?: string;
}) {
  let seller = sellers.find((s) => s.id === input.id);
  if (!seller) {
    seller = {
      id: input.id,
      name: input.name,
      avatar: input.avatar,
      country: input.country,
      city: input.city,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      responseTime: "< 24h",
      memberSince: String(new Date().getFullYear()),
      verified: false,
    };
    sellers.push(seller);
  } else {
    seller.name = input.name;
    if (input.avatar) seller.avatar = input.avatar;
    if (input.country) seller.country = input.country;
    if (input.city) seller.city = input.city;
  }
  persist();
  return seller;
}

export function createListing(input: {
  cardId?: string;
  title: string;
  setName?: string;
  game: TcgGame;
  imageUrl: string;
  sellerId: number;
  sellerName: string;
  sellerAvatar?: string;
  sellerCountry?: string;
  sellerCity?: string;
  price: number;
  condition: CardCondition;
  language: string;
  quantity: number;
  isFoil: boolean;
  description: string;
}) {
  const title = input.title.trim();
  if (title.length < 2) throw new Error("Bitte einen Kartentitel angeben");
  if (!input.imageUrl) throw new Error("Bitte ein Kartenbild hochladen");
  if (!(input.price > 0)) throw new Error("Bitte einen gültigen Preis angeben");
  if (!input.sellerId) throw new Error("Anmeldung erforderlich");

  ensureSellerProfile({
    id: input.sellerId,
    name: input.sellerName,
    avatar: input.sellerAvatar,
    country: input.sellerCountry,
    city: input.sellerCity,
  });

  let card = input.cardId ? cards.find((c) => c.id === input.cardId) : undefined;
  const useCatalogAsIs =
    card &&
    title === card.name &&
    input.imageUrl === card.imageUrl &&
    (!input.setName || input.setName === card.setName);

  if (!useCatalogAsIs) {
    card = {
      id: `card-user-${nanoid(8)}`,
      name: title,
      setName: input.setName?.trim() || card?.setName || "User-Angebot",
      game: input.game,
      rarity: card?.rarity || "—",
      number: card?.number || "—",
      imageUrl: input.imageUrl,
      marketPrice: input.price,
      priceHistory: priceHistory(input.price),
      avgRating: 0,
      reviewCount: 0,
    };
    cards.unshift(card);
  }

  const listing: Listing = {
    id: `lst-${nanoid(8)}`,
    cardId: card!.id,
    title,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    price: input.price,
    condition: input.condition,
    language: input.language,
    quantity: input.quantity,
    isFoil: input.isFoil,
    isGraded: false,
    description: input.description,
    imageUrl: input.imageUrl,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  listings.unshift(listing);
  persist();
  return listing;
}

export function purchaseListing(
  listingId: string,
  buyerId: number,
  buyerName: string,
  paymentMethod?: string
) {
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) throw new Error("Angebot nicht gefunden");
  if (listing.status !== "active") throw new Error("Angebot nicht mehr verfügbar");
  if (listing.sellerId === buyerId) throw new Error("Du kannst nicht dein eigenes Angebot kaufen");
  if (!paymentMethod) throw new Error("Bitte eine Zahlungsart wählen");

  listing.status = "sold";
  listing.quantity = Math.max(0, listing.quantity - 1);
  if (listing.quantity > 0) listing.status = "active";

  const card = cards.find((c) => c.id === listing.cardId);
  const seller = sellers.find((s) => s.id === listing.sellerId);
  if (seller) seller.salesCount += 1;

  persist();
  return {
    success: true,
    orderId: `ord-${nanoid(10)}`,
    listing,
    card,
    paymentMethod,
    message: `Kauf erfolgreich! ${listing.title || card?.name || "Karte"} von ${listing.sellerName} · Zahlung: ${paymentMethod}`,
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
    cardName: listing?.title ?? card?.name ?? "Unbekannte Karte",
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(review);

  const seller = sellers.find((s) => s.id === input.sellerId);
  if (seller) {
    const sellerReviews = reviews.filter((r) => r.sellerId === input.sellerId);
    seller.reviewCount = sellerReviews.length;
    seller.rating =
      Math.round(
        (sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length) * 10
      ) / 10;
  }

  persist();
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
