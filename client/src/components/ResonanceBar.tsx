import { cn } from "@/lib/utils";
import type { ResonanceType } from "@shared/social";
import { motion } from "framer-motion";
import { Radio, Sparkles, Waves } from "lucide-react";

const ITEMS: {
  id: ResonanceType;
  label: string;
  icon: typeof Sparkles;
  countKey: "sparkCount" | "depthCount" | "echoCount";
}[] = [
  { id: "spark", label: "Spark", icon: Sparkles, countKey: "sparkCount" },
  { id: "depth", label: "Depth", icon: Waves, countKey: "depthCount" },
  { id: "echo", label: "Echo", icon: Radio, countKey: "echoCount" },
];

type Props = {
  sparkCount: number;
  depthCount: number;
  echoCount: number;
  active: ResonanceType | null;
  onSelect: (type: ResonanceType | null) => void;
  compact?: boolean;
};

export default function ResonanceBar({
  sparkCount,
  depthCount,
  echoCount,
  active,
  onSelect,
  compact,
}: Props) {
  const counts = { sparkCount, depthCount, echoCount };

  return (
    <div className={cn("flex items-center gap-1", compact ? "gap-0.5" : "gap-1.5")}>
      {ITEMS.map((item) => {
        const isOn = active === item.id;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(isOn ? null : item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors",
              isOn
                ? "border-primary/40 bg-primary text-primary-foreground"
                : "border-transparent bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            title={item.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span className="hidden sm:inline">{item.label}</span>}
            <span className="tabular-nums">{counts[item.countKey]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
