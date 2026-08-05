import { Link, useLocation } from "wouter";
import { SITE, MOODS, type MoodId } from "@shared/site";
import { useMood } from "@/contexts/MoodContext";
import { cn } from "@/lib/utils";
import {
  Compass,
  Home,
  MessageCircle,
  Radio,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/app", label: "Feed", icon: Home },
  { href: "/entdecken", label: "Entdecken", icon: Compass },
  { href: "/kreise", label: "Kreise", icon: Users },
  { href: "/nachrichten", label: "Nachrichten", icon: MessageCircle },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 group", className)}>
      <span
        className="relative grid place-items-center size-9 rounded-xl text-primary-foreground font-display font-800 text-lg shadow-sm animate-wave"
        style={{
          background: "linear-gradient(145deg, oklch(0.55 0.12 175), oklch(0.38 0.08 175))",
          fontWeight: 800,
        }}
      >
        {SITE.logoLetter}
        <span className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-ring" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        {SITE.name}
      </span>
    </Link>
  );
}

export function MoodSwitcher({ compact = false }: { compact?: boolean }) {
  const { mood, setMood } = useMood();

  return (
    <div
      className={cn(
        "flex gap-1 p-1 rounded-2xl glass-panel overflow-x-auto scrollbar-none",
        compact && "max-w-full"
      )}
      role="tablist"
      aria-label="Frequenz wählen"
    >
      {MOODS.map((m) => (
        <button
          key={m.id}
          role="tab"
          aria-selected={mood === m.id}
          onClick={() => setMood(m.id as MoodId)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-300",
            mood === m.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          )}
          title={m.description}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function AppNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 glass-panel">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active =
                location === item.href ||
                (item.href !== "/app" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-3 py-2 text-sm font-semibold shadow-sm hover:brightness-105 transition"
            >
              <Radio className="size-4" />
              Frequenz
            </Link>
            <button
              className="md:hidden p-2 rounded-xl hover:bg-secondary"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menü"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-border px-4 py-3 space-y-1 animate-fade-scale">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-panel border-t border-border safe-pb">
        <div className="grid grid-cols-4 h-14">
          {nav.map((item) => {
            const active =
              location === item.href ||
              (item.href !== "/app" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
