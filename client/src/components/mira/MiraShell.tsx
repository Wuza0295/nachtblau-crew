import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Compass,
  Home,
  MessageCircle,
  Plus,
  Radio,
  Users,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { SITE } from "@/lib/site";
import { ReactNode } from "react";

const NAV = [
  { href: "/app", label: "Feed", icon: Home },
  { href: "/circles", label: "Circles", icon: Users },
  { href: "/compose", label: "Neu", icon: Plus, primary: true },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/discover", label: "Drift", icon: Compass },
];

export function MiraShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  const [loc] = useLocation();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="relative grid place-items-center size-8 rounded-full bg-[var(--mira-jade)] text-primary-foreground font-display font-700 text-sm shadow-[0_8px_24px_oklch(0.48_0.1_175/0.35)] group-hover:scale-105 transition-transform">
              M
              <span className="absolute inset-0 rounded-full mira-shimmer opacity-40 pointer-events-none" />
            </span>
            <span className="font-display font-700 text-lg tracking-tight">
              {SITE.name}
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-muted-foreground border border-border/80 rounded-full px-2 py-0.5">
              Arbeitstitel
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/app", label: "Feed" },
              { href: "/circles", label: "Circles" },
              { href: "/recipes", label: "Rezepte" },
              { href: "/vault", label: "Vault" },
              { href: "/truth", label: "Truth" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  loc === item.href || loc.startsWith(item.href + "/")
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/recipes"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1"
            >
              <Sparkles className="size-4 text-[var(--mira-gold)]" />
              Rezepte
            </Link>
            <Link
              href="/vault"
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Vault"
            >
              <Bookmark className="size-4" />
            </Link>
            <Link href="/profil/u-you" className="mira-ring rounded-full">
              <img
                src="https://api.dicebear.com/9.x/notionists/svg?seed=mira-you&backgroundColor=c8e6d8"
                alt="Profil"
                className="size-8 rounded-full bg-secondary"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>

      {!hideNav && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border/70 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-16">
            {NAV.map((item) => {
              const active =
                loc === item.href ||
                (item.href !== "/app" && loc.startsWith(item.href));
              const Icon = item.icon;
              if (item.primary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center -mt-3"
                  >
                    <span className="size-12 rounded-full bg-[var(--mira-jade)] text-primary-foreground grid place-items-center shadow-[0_12px_28px_oklch(0.48_0.1_175/0.4)]">
                      <Icon className="size-5" />
                    </span>
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 text-[10px]",
                    active ? "text-[var(--mira-jade)]" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: "nahe" | "fokus" | "drift";
  onChange: (m: "nahe" | "fokus" | "drift") => void;
}) {
  const modes = [
    { id: "nahe" as const, label: "Nähe", icon: Radio },
    { id: "fokus" as const, label: "Fokus", icon: Users },
    { id: "drift" as const, label: "Drift", icon: Compass },
  ];
  return (
    <div className="glass rounded-full p-1 flex gap-1 w-full sm:w-auto">
      {modes.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
              active
                ? "bg-[var(--mira-jade)] text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
