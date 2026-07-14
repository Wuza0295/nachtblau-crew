import { useMemo, useSyncExternalStore } from "react";
import {
  createListing,
  createReview,
  getAllCards,
  getCardById,
  getListingsForCard,
  getMarketplaceStats,
  getSellerProfile,
  purchaseListing,
  searchMarketplace,
  type CardCondition,
  type SearchFilters,
  type TcgGame,
} from "./marketplaceStore";

let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return version;
}

function useStoreVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useMarketplaceStats() {
  useStoreVersion();
  return { data: getMarketplaceStats(), isLoading: false, error: null };
}

export function useMarketplaceSearch(filters: SearchFilters) {
  const v = useStoreVersion();
  const data = useMemo(() => searchMarketplace(filters), [filters, v]);
  return { data, isLoading: false, error: null };
}

export function useMarketplaceCards() {
  useStoreVersion();
  return { data: getAllCards(), isLoading: false, error: null };
}

export function useMarketplaceCard(cardId: string) {
  const v = useStoreVersion();
  const data = useMemo(() => {
    const card = getCardById(cardId);
    if (!card) return null;
    return { card, listings: getListingsForCard(cardId) };
  }, [cardId, v]);
  return { data, isLoading: false, error: null };
}

export function useMarketplaceSeller(sellerId: number) {
  const v = useStoreVersion();
  const data = useMemo(
    () => (sellerId > 0 ? getSellerProfile(sellerId) : null),
    [sellerId, v]
  );
  return { data, isLoading: false, error: null };
}

export type CreateListingInput = {
  cardId?: string;
  title: string;
  setName?: string;
  game: TcgGame;
  imageUrl: string;
  price: number;
  condition: CardCondition;
  language: string;
  quantity: number;
  isFoil: boolean;
  description: string;
  sellerId?: number;
  sellerName?: string;
  sellerAvatar?: string;
  sellerCountry?: string;
  sellerCity?: string;
};

export function useCreateListing() {
  return {
    isPending: false,
    mutate: (
      input: CreateListingInput,
      opts?: {
        onSuccess?: (listing: ReturnType<typeof createListing>) => void;
        onError?: (e: Error) => void;
      }
    ) => {
      try {
        const listing = createListing({
          ...input,
          sellerId: input.sellerId ?? 99,
          sellerName: input.sellerName ?? "DemoSammler",
        });
        emit();
        opts?.onSuccess?.(listing);
      } catch (e) {
        opts?.onError?.(e instanceof Error ? e : new Error("Fehler"));
      }
    },
  };
}

export function usePurchaseListing() {
  return {
    isPending: false,
    mutate: (
      input: { listingId: string; buyerId?: number; buyerName?: string },
      opts?: {
        onSuccess?: (result: ReturnType<typeof purchaseListing>) => void;
        onError?: (e: Error) => void;
      }
    ) => {
      try {
        const result = purchaseListing(
          input.listingId,
          input.buyerId ?? 99,
          input.buyerName ?? "DemoSammler"
        );
        emit();
        opts?.onSuccess?.(result);
      } catch (e) {
        opts?.onError?.(e instanceof Error ? e : new Error("Kauf fehlgeschlagen"));
      }
    },
  };
}

export function useCreateReview() {
  return {
    isPending: false,
    mutate: (
      input: {
        sellerId: number;
        listingId: string;
        rating: number;
        comment: string;
        buyerId?: number;
        buyerName?: string;
      },
      opts?: { onSuccess?: () => void; onError?: (e: Error) => void }
    ) => {
      try {
        createReview({
          ...input,
          buyerId: input.buyerId ?? 99,
          buyerName: input.buyerName ?? "DemoSammler",
        });
        emit();
        opts?.onSuccess?.();
      } catch (e) {
        opts?.onError?.(e instanceof Error ? e : new Error("Fehler"));
      }
    },
  };
}

export type { TcgGame, CardCondition, SearchFilters };
