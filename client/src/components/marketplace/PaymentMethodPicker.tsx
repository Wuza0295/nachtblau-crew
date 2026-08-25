import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  type PaymentMethodId,
  getPaymentMethod,
} from "@/lib/paymentMethods";
import { Building2, Coins, CreditCard, Wallet } from "lucide-react";

const ICONS: Record<PaymentMethodId, typeof Wallet> = {
  atc: Coins,
  paypal: Wallet,
  bank_transfer: Building2,
  paysafecard: CreditCard,
};

interface PaymentMethodPickerProps {
  value: PaymentMethodId | "";
  onChange: (id: PaymentMethodId) => void;
  className?: string;
  compact?: boolean;
}

export default function PaymentMethodPicker({
  value,
  onChange,
  className,
  compact = false,
}: PaymentMethodPickerProps) {
  const selected = getPaymentMethod(value);

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-foreground">Zahlungsart</p>
      <div className={cn("grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        {PAYMENT_METHODS.map((method) => {
          const Icon = ICONS[method.id];
          const active = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={cn(
                "text-left rounded-xl border p-3 transition-all duration-200",
                active
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                  : "border-border bg-card/40 hover:border-primary/40 hover:bg-card/70"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                    active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-semibold text-sm">{method.label}</span>
              </div>
              {!compact && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {method.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/70 bg-secondary/30 p-3">
          {selected.instructions}
        </p>
      )}
    </div>
  );
}
