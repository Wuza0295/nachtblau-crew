import { useMemo, useSyncExternalStore } from "react";
import {
  createListing,
  createReview,
  getAllCards,
  getCardById,
  getListingsForCard,
  getMarketplaceStats,
  getSellerProfile,
  getListingById,
  purchaseListing,
  searchMarketplace,
  type CardCondition,
  type SearchFilters,
  type TcgGame,
} from "./marketplaceStore";
import type { PaymentMethodId } from "./paymentMethods";
import { getPaymentMethod } from "./paymentMethods";
import { paymentLabel, saveOrder } from "./orderStore";
import { canSell } from "./sellerComplianceStore";
import { receiveAtc, spendAtc } from "./atcWalletStore";

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
        if (!input.sellerId || !canSell(input.sellerId)) {
          throw new Error(
            "Verkauf gesperrt: Bitte Verkäufer-Freigabe (Ident, Alter, PIN / DSA) abschließen."
          );
        }
        const listing = createListing({
          ...input,
          sellerId: input.sellerId ?? 0,
          sellerName: input.sellerName ?? "Händler",
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
      input: {
        listingId: string;
        buyerId?: number;
        buyerName?: string;
        paymentMethod?: PaymentMethodId;
      },
      opts?: {
        onSuccess?: (result: ReturnType<typeof purchaseListing>) => void;
        onError?: (e: Error) => void;
      }
    ) => {
      try {
        if (!input.buyerId || !input.buyerName) {
          throw new Error("Registrierung und Profil erforderlich");
        }
        if (!input.paymentMethod) {
          throw new Error("Bitte Autic Coins (ATC) als Verrechnung wählen");
        }
        if (input.paymentMethod !== "atc") {
          throw new Error(
            "Marktplatz-Käufe nur per ATC. Bitte Guthaben aufladen (PayPal, Überweisung oder Paysafe)."
          );
        }
        const method = getPaymentMethod(input.paymentMethod);

        const peek = getListingById(input.listingId);
        if (!peek?.listing) throw new Error("Angebot nicht gefunden");
        const sellerId = peek.listing.sellerId;
        const atcDebited = peek.listing.price;
        spendAtc(
          input.buyerId,
          atcDebited,
          `Kauf ${peek.listing.title || peek.card?.name || "Karte"}`
        );

        let result: ReturnType<typeof purchaseListing>;
        try {
          result = purchaseListing(
            input.listingId,
            input.buyerId,
            input.buyerName,
            method?.label ?? input.paymentMethod
          );
        } catch (err) {
          receiveAtc(input.buyerId, atcDebited, "Rückbuchung nach fehlgeschlagenem Kauf");
          throw err;
        }

        receiveAtc(
          sellerId,
          result.listing.price,
          `Verkauf an ${input.buyerName} · ATC-Verrechnung (kein Auszahlungs-Geld)`
        );
        saveOrder({
          orderId: result.orderId,
          listingId: result.listing.id,
          cardId: result.listing.cardId,
          title: result.listing.title || result.card?.name || "Karte",
          price: result.listing.price,
          sellerId: result.listing.sellerId,
          sellerName: result.listing.sellerName,
          buyerId: input.buyerId,
          buyerName: input.buyerName,
          paymentMethod: input.paymentMethod,
          paymentLabel: paymentLabel(input.paymentMethod),
          createdAt: new Date().toISOString(),
        });
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
        if (!input.buyerId || !input.buyerName) {
          throw new Error("Registrierung erforderlich");
        }
        createReview({
          ...input,
          buyerId: input.buyerId,
          buyerName: input.buyerName,
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
