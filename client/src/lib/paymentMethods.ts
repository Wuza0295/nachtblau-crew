/** Supported checkout payment methods (UI + order metadata). */

export type PaymentMethodId = "paypal" | "bank_transfer" | "paysafecard";

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
    id: "paypal",
    label: "PayPal",
    shortLabel: "PayPal",
    description: "Schnell und sicher per PayPal-Konto oder Kreditkarte über PayPal.",
    instructions:
      "Nach der Kaufbestätigung erhältst du die PayPal-Zahlungsaufforderung vom Verkäufer. Bitte als „Freunde & Familie“ nur nach Absprache verwenden – Standard ist „Waren und Dienstleistungen“.",
  },
  {
    id: "bank_transfer",
    label: "Überweisung",
    shortLabel: "Überweisung",
    description: "Klassische SEPA-Überweisung auf das Konto des Verkäufers.",
    instructions:
      "Der Verkäufer teilt dir IBAN und Verwendungszweck mit. Versand erfolgt in der Regel nach Zahlungseingang.",
  },
  {
    id: "paysafecard",
    label: "Paysafe Card",
    shortLabel: "Paysafe",
    description: "Prepaid mit 16-stelligem Paysafe-Card-PIN – ohne Bankkonto.",
    instructions:
      "Halte deinen 16-stelligen PIN bereit. Der Verkäufer nennt dir den Empfänger bzw. den Auflade-/Zahlungsweg. PIN nie ungeschützt im Klartext chatten.",
  },
];

export function getPaymentMethod(id: PaymentMethodId | string | undefined | null) {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? null;
}

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((m) => m.id === value);
}
