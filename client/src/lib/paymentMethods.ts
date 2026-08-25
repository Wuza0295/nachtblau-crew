/** Supported checkout payment methods (UI + order metadata). */

export type PaymentMethodId = "paypal" | "bank_transfer" | "paysafecard" | "atc";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  shortLabel: string;
  description: string;
  /** Shown after selecting / at checkout confirm */
  instructions: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "atc",
    label: "Autic Coins (ATC)",
    shortLabel: "ATC",
    description:
      "Kauf nur mit ATC-Guthaben. Ist die Ladung leer, muss erst aufgeladen werden – ohne ATC keine Käufe. Verkäufer erhält ATC; Auszahlung ab 50 €.",
    instructions:
      "Betrag wird vom ATC abgezogen und dem Verkäufer gutgeschrieben. Ohne ausreichendes Guthaben ist kein Kauf möglich – bitte unter Guthaben aufladen.",
  },
  {
    id: "paypal",
    label: "PayPal",
    shortLabel: "PayPal",
    description: "Nur zum Aufladen von ATC unter Guthaben – nicht für Marktplatz-Käufe.",
    instructions: "Bitte ATC unter Guthaben aufladen. Marktplatz-Käufe laufen ausschließlich über ATC.",
  },
  {
    id: "bank_transfer",
    label: "Überweisung",
    shortLabel: "Überweisung",
    description: "Nur zum Aufladen von ATC unter Guthaben – nicht für Marktplatz-Käufe.",
    instructions: "Bitte ATC unter Guthaben aufladen. Marktplatz-Käufe laufen ausschließlich über ATC.",
  },
  {
    id: "paysafecard",
    label: "Paysafe Card",
    shortLabel: "Paysafe",
    description: "Nur zum Aufladen von ATC unter Guthaben – nicht für Marktplatz-Käufe.",
    instructions: "Bitte ATC unter Guthaben aufladen. Marktplatz-Käufe laufen ausschließlich über ATC.",
  },
];

/** Marktplatz-Checkout: nur ATC-Verrechnung zwischen Käufer und Verkäufer. */
export const CHECKOUT_PAYMENT_METHODS: PaymentMethod[] = PAYMENT_METHODS.filter(
  (m) => m.id === "atc"
);
export function getPaymentMethod(id: PaymentMethodId | string | undefined | null) {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? null;
}

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((m) => m.id === value);
}
