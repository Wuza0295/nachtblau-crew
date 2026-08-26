import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { GAME_OPTIONS } from "@/lib/marketplaceConstants";
import { useMarketplaceStats } from "@/lib/useMarketplace";

interface GameSidebarProps {
  activeGame?: string;
  className?: string;
  variant?: "sidebar" | "pills";
}

export default function GameSidebar({
  activeGame = "all",
  className,
  variant = "sidebar",
}: GameSidebarProps) {
  const { data: stats } = useMarketplaceStats();
  const counts = Object.fromEntries((stats?.games ?? []).map((g) => [g.game, g.count]));

  const items = [
    { value: "all", label: "Alle", count: stats?.activeListings ?? 0, href: "/marktplatz" },
    ...GAME_OPTIONS.map((g) => ({
      value: g.value,
      label: g.short,
      count: counts[g.value] ?? 0,
      href: `/marktplatz?game=${g.value}`,
    })),
  ];

  if (variant === "pills") {
    return (
      <div className={cn("flex gap-1.5 overflow-x-auto pb-1", className)}>
        {items.map((item) => (
          <Link
            key={item.value}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
              activeGame === item.value
                ? "border-primary/50 bg-primary/15 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {item.label}
            <span className="ml-1 opacity-60">({item.count})</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <aside className={cn("space-y-1", className)}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-2 mb-2">
        Kategorien
      </p>
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          className={cn(
            "flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
            activeGame === item.value
              ? "bg-primary/15 text-primary font-medium"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <span>{item.value === "all" ? "Alle TCGs" : GAME_OPTIONS.find((g) => g.value === item.value)?.label ?? item.label}</span>
          <span className="text-xs opacity-70">{item.count}</span>
        </Link>
      ))}
    </aside>
  );
}
