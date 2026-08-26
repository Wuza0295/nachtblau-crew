/** Local order history with payment method. */

import type { PaymentMethodId } from "./paymentMethods";
import { getPaymentMethod } from "./paymentMethods";

export interface OrderRecord {
  orderId: string;
  listingId: string;
  cardId: string;
  title: string;
  price: number;
  sellerId: number;
  sellerName: string;
  buyerId: number;
  buyerName: string;
  paymentMethod: PaymentMethodId;
  paymentLabel: string;
  createdAt: string;
}

const KEY = "autic-orders-v1";

function read(): OrderRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OrderRecord[]) : [];
  } catch {
    return [];
  }
}

function write(orders: OrderRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(orders));
}

export function saveOrder(order: OrderRecord) {
  const orders = read();
  orders.unshift(order);
  write(orders.slice(0, 100));
}

export function getOrdersForBuyer(buyerId: number): OrderRecord[] {
  return read().filter((o) => o.buyerId === buyerId);
}

export function paymentLabel(id: PaymentMethodId) {
  return getPaymentMethod(id)?.label ?? id;
}
