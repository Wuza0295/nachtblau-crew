import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  Compass,
  Home,
  Layers,
  PlusCircle,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnerBanner from "@/components/PartnerBanner";

const NAV = [
  { href: "/portal", label: "Hub", icon: Home, match: (p: string) => p === "/portal" },
  {
    href: "/portal/fluss",
    label: "Fluss",
    icon: Radio,
    match: (p: string) => p.startsWith("/portal/fluss"),
  },
  {
    href: "/portal/kreise",
    label: "Kreise",
    icon: Users,
    match: (p: string) => p.startsWith("/portal/kreise"),
  },
  {
    href: "/portal/momente",
    label: "Momente",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/portal/momente"),
  },
] as const;

export default function SocialShell({
  children,
  onCompose,
}: {
  children: React.ReactNode;
  onCompose?: () => void;
}) {
  const [location] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col text-foreground"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 100% 0%, oklch(0.22 0.12 310 / 0.35), transparent 50%), radial-gradient(ellipse 80% 60% at 0% 100%, oklch(0.18 0.1 25 / 0.25), transparent 45%), oklch(0.07 0.02 280)",
      }}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/portal" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.2_25)] via-[oklch(0.65_0.22_310)] to-[oklch(0.55_0.18_260)] flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 group-active:scale-95">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <p
                className="text-sm font-semibold tracking-tight"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Social Portal
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Name folgt
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.match(location);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-full transition-all duration-200",
                      active && "bg-white/10 text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 rounded-full">
                <Compass className="h-4 w-4" />
                Crew
              </Button>
            </Link>
            {onCompose && (
              <Button
                size="sm"
                className="rounded-full gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_310)] to-[oklch(0.62_0.2_25)] text-white border-0 shadow-md hover:opacity-90 transition-opacity duration-200 active:scale-[0.97]"
                onClick={onCompose}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Posten</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 container pb-24 md:pb-8">{children}</div>

      <footer className="border-t border-white/10 py-6 pb-24 md:pb-6">
        <PartnerBanner />
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="flex justify-around py-2">
          {NAV.map((item) => {
            const active = item.match(location);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors duration-200",
                    active ? "text-[oklch(0.75_0.18_310)]" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
