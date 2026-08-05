import { cn } from "@/lib/utils";
import type { LensId, LensMeta } from "@shared/social";
import { motion } from "framer-motion";

type Props = {
  lenses: LensMeta[];
  active: LensId;
  onChange: (id: LensId) => void;
};

export function LensSwitcher({ lenses, active, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="tablist"
        aria-label="Feed-Lens"
        className="flex gap-1 overflow-x-auto rounded-full bg-secondary/60 p-1 backdrop-blur-sm"
      >
        {lenses.map((lens) => {
          const isActive = lens.id === active;
          return (
            <button
              key={lens.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(lens.id)}
              className={cn(
                "relative z-0 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="lens-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {lens.label}
            </button>
          );
        })}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        {lenses.find((l) => l.id === active)?.description}
      </p>
    </div>
  );
}
