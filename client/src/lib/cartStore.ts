/** Shopping cart (Cardmarket-style commit-to-buy). */

export interface CartItem {
  listingId: string;
  cardId: string;
  title: string;
  imageUrl: string;
  price: number;
  condition: string;
  language: string;
  sellerId: number;
  sellerName: string;
  quantity: number;
  addedAt: string;
}

const KEY = "autic-cart-v1";

const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeCart(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getCartVersion() {
  return version;
}

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  emit();
}

export function getCart(): CartItem[] {
  return read();
}

export function cartCount(): number {
  return read().reduce((s, i) => s + i.quantity, 0);
}

export function cartTotal(): number {
  return Math.round(read().reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
}

export function addToCart(item: Omit<CartItem, "addedAt" | "quantity"> & { quantity?: number }) {
  const items = read();
  const existing = items.find((i) => i.listingId === item.listingId);
  if (existing) {
    existing.quantity += item.quantity ?? 1;
  } else {
    items.push({
      ...item,
      quantity: item.quantity ?? 1,
      addedAt: new Date().toISOString(),
    });
  }
  write(items);
}

export function removeFromCart(listingId: string) {
  write(read().filter((i) => i.listingId !== listingId));
}

export function clearCart() {
  write([]);
}

export function updateCartQty(listingId: string, quantity: number) {
  const items = read();
  const item = items.find((i) => i.listingId === listingId);
  if (!item) return;
  if (quantity <= 0) {
    write(items.filter((i) => i.listingId !== listingId));
    return;
  }
  item.quantity = quantity;
  write(items);
}
