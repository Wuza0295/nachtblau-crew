/** Autic Coins (ATC) – digital balance + physical coupons for online & flea market. */

import { nanoid } from "nanoid";

export type AtcKind = "coin" | "note";

export interface AtcDenomination {
  value: number;
  name: string;
  kind: AtcKind;
  /** Short flavor for UI */
  blurb: string;
  accent: string;
  imageUrl: string;
}

/** Hybrid set from both concepts – practical offline denominations. */
export const ATC_DENOMINATIONS: AtcDenomination[] = [
  {
    value: 1,
    name: "Common Shard",
    kind: "coin",
    blurb: "Kupfermünze",
    accent: "from-amber-800 to-amber-600",
    imageUrl: "/atc/atc-1-coin.webp",
  },
  {
    value: 5,
    name: "Silver Token",
    kind: "coin",
    blurb: "Silbermünze",
    accent: "from-slate-400 to-slate-200",
    imageUrl: "/atc/atc-5-coin.webp",
  },
  {
    value: 10,
    name: "Gold Coin",
    kind: "coin",
    blurb: "Goldmünze",
    accent: "from-amber-500 to-yellow-300",
    imageUrl: "/atc/atc-10-coin.webp",
  },
  {
    value: 25,
    name: "Rare Crest",
    kind: "coin",
    blurb: "Blau-Gold",
    accent: "from-blue-600 to-amber-400",
    imageUrl: "/atc/atc-25-coin.webp",
  },
  {
    value: 50,
    name: "Booster-Note",
    kind: "note",
    blurb: "Schein · hellblau",
    accent: "from-sky-500 to-cyan-300",
    imageUrl: "/atc/atc-50-note.webp",
  },
  {
    value: 100,
    name: "Display-Bond",
    kind: "note",
    blurb: "Schein · teal",
    accent: "from-teal-500 to-emerald-300",
    imageUrl: "/atc/atc-100-note.webp",
  },
  {
    value: 250,
    name: "Holo-Bond",
    kind: "note",
    blurb: "Schein · violett",
    accent: "from-violet-600 to-fuchsia-400",
    imageUrl: "/atc/atc-250-note.webp",
  },
  {
    value: 500,
    name: "Treasure-Voucher",
    kind: "note",
    blurb: "Schein · rotgold",
    accent: "from-rose-700 to-amber-400",
    imageUrl: "/atc/atc-500-note.webp",
  },
];

export type AtcTxType =
  | "topup"
  | "spend"
  | "withdraw_coupon"
  | "redeem_coupon"
  | "receive";

export interface AtcTransaction {
  id: string;
  userId: number;
  type: AtcTxType;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  meta?: Record<string, string | number>;
}

export type CouponStatus = "active" | "redeemed" | "void";

export interface AtcCoupon {
  id: string;
  code: string;
  value: number;
  denominationName: string;
  status: CouponStatus;
  issuedBy: number;
  issuedAt: string;
  redeemedBy?: number;
  redeemedAt?: string;
  /** Always internal credit – not legal tender */
  disclaimer: "NUR INTERNES GUTHABEN";
}

type WalletState = {
  balances: Record<string, number>;
  txs: AtcTransaction[];
  coupons: AtcCoupon[];
};

const KEY = "autic-atc-wallet-v1";
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeAtc(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAtcVersion() {
  return version;
}

function read(): WalletState {
  if (typeof window === "undefined") return { balances: {}, txs: [], coupons: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { balances: {}, txs: [], coupons: [] };
    const data = JSON.parse(raw) as WalletState;
    return {
      balances: data.balances ?? {},
      txs: Array.isArray(data.txs) ? data.txs : [],
      coupons: Array.isArray(data.coupons) ? data.coupons : [],
    };
  } catch {
    return { balances: {}, txs: [], coupons: [] };
  }
}

function write(state: WalletState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

function uidKey(userId: number) {
  return String(userId);
}

export function formatAtc(amount: number) {
  return `${amount.toLocaleString("de-DE", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ATC`;
}

export function getAtcBalance(userId: number | undefined | null): number {
  if (!userId) return 0;
  return read().balances[uidKey(userId)] ?? 0;
}

export function getAtcTransactions(userId: number): AtcTransaction[] {
  return read().txs.filter((t) => t.userId === userId);
}

export function getUserCoupons(userId: number): AtcCoupon[] {
  return read().coupons.filter((c) => c.issuedBy === userId || c.redeemedBy === userId);
}

export function getActiveIssuedCoupons(userId: number): AtcCoupon[] {
  return read().coupons.filter((c) => c.issuedBy === userId && c.status === "active");
}

function pushTx(
  state: WalletState,
  input: Omit<AtcTransaction, "id" | "createdAt" | "balanceAfter"> & { balanceAfter: number }
) {
  state.txs.unshift({
    ...input,
    id: `tx-${nanoid(8)}`,
    createdAt: new Date().toISOString(),
  });
  state.txs = state.txs.slice(0, 200);
}

/** Demo/top-up: add ATC (paid externally later). */
export function topUpAtc(userId: number, amount: number, note = "Aufladung") {
  if (!(amount > 0)) throw new Error("Betrag muss positiv sein");
  const state = read();
  const key = uidKey(userId);
  const next = Math.round(((state.balances[key] ?? 0) + amount) * 100) / 100;
  state.balances[key] = next;
  pushTx(state, {
    userId,
    type: "topup",
    amount,
    balanceAfter: next,
    note,
  });
  write(state);
  return next;
}

export function spendAtc(userId: number, amount: number, note: string) {
  if (!(amount > 0)) throw new Error("Betrag muss positiv sein");
  const state = read();
  const key = uidKey(userId);
  const current = state.balances[key] ?? 0;
  if (current < amount) throw new Error("Nicht genug ATC-Guthaben");
  const next = Math.round((current - amount) * 100) / 100;
  state.balances[key] = next;
  pushTx(state, {
    userId,
    type: "spend",
    amount: -amount,
    balanceAfter: next,
    note,
  });
  write(state);
  return next;
}

export function receiveAtc(userId: number, amount: number, note: string) {
  if (!(amount > 0)) throw new Error("Betrag muss positiv sein");
  const state = read();
  const key = uidKey(userId);
  const next = Math.round(((state.balances[key] ?? 0) + amount) * 100) / 100;
  state.balances[key] = next;
  pushTx(state, {
    userId,
    type: "receive",
    amount,
    balanceAfter: next,
    note,
  });
  write(state);
  return next;
}

function makeCouponCode(value: number) {
  const body = nanoid(10).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  return `ATC-${value}-${body.slice(0, 8)}`;
}

/** Convert digital ATC → physical coupon for flea market. */
export function issueCoupon(userId: number, value: number): AtcCoupon {
  const denom = ATC_DENOMINATIONS.find((d) => d.value === value);
  if (!denom) throw new Error("Ungültige Denomination");
  const state = read();
  const key = uidKey(userId);
  const current = state.balances[key] ?? 0;
  if (current < value) throw new Error("Nicht genug ATC für diesen Coupon");

  const next = Math.round((current - value) * 100) / 100;
  state.balances[key] = next;

  const coupon: AtcCoupon = {
    id: `cpn-${nanoid(8)}`,
    code: makeCouponCode(value),
    value,
    denominationName: denom.name,
    status: "active",
    issuedBy: userId,
    issuedAt: new Date().toISOString(),
    disclaimer: "NUR INTERNES GUTHABEN",
  };
  state.coupons.unshift(coupon);
  pushTx(state, {
    userId,
    type: "withdraw_coupon",
    amount: -value,
    balanceAfter: next,
    note: `Coupon ${coupon.code} · ${denom.name}`,
    meta: { couponId: coupon.id, code: coupon.code },
  });
  write(state);
  return coupon;
}

/** Redeem flea-market coupon into digital balance. */
export function redeemCoupon(userId: number, rawCode: string): AtcCoupon {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 6) throw new Error("Ungültiger Coupon-Code");
  const state = read();
  const coupon = state.coupons.find((c) => c.code === code);
  if (!coupon) throw new Error("Coupon nicht gefunden");
  if (coupon.status !== "active") throw new Error("Coupon bereits eingelöst oder ungültig");

  coupon.status = "redeemed";
  coupon.redeemedBy = userId;
  coupon.redeemedAt = new Date().toISOString();

  const key = uidKey(userId);
  const next = Math.round(((state.balances[key] ?? 0) + coupon.value) * 100) / 100;
  state.balances[key] = next;
  pushTx(state, {
    userId,
    type: "redeem_coupon",
    amount: coupon.value,
    balanceAfter: next,
    note: `Eingelöst ${coupon.code} · ${coupon.denominationName}`,
    meta: { couponId: coupon.id, code: coupon.code },
  });
  write(state);
  return coupon;
}

export function findDenomination(value: number) {
  return ATC_DENOMINATIONS.find((d) => d.value === value) ?? null;
}
