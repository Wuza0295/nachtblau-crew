import { cn } from "@/lib/utils";
import { FREQUENCIES, type FrequencyId } from "@shared/site";
import { Link } from "wouter";

type Props = {
  active: FrequencyId;
  className?: string;
};

export function FrequencySwitcher({ active, className }: Props) {
  return (
    <div
      className={cn(
        "flex gap-1 p-1 rounded-full bg-secondary/80 overflow-x-auto",
        className
      )}
      role="tablist"
      aria-label="Frequenz"
    >
      {FREQUENCIES.map((f) => {
        const href =
          f.id === "horizon" ? "/raeume" : `/feed?f=${f.id}`;
        const isActive = active === f.id;
        return (
          <Link
            key={f.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm transition-all duration-300",
              isActive
                ? "freq-active shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.short}
          </Link>
        );
      })}
    </div>
  );
}
