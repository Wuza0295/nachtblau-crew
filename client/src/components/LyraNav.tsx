import { Link, useLocation } from "wouter";
import { SITE } from "@shared/site";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Compass, CircleDot, Layers, Orbit, PenLine, User } from "lucide-react";

const NAV = [
  { href: "/app", label: "Pulse", icon: Compass, lens: "pulse" },
  { href: "/app/orbit", label: "Orbit", icon: Orbit, lens: "orbit" },
  { href: "/circles", label: "Circles", icon: CircleDot, lens: "circles" },
  { href: "/app/depth", label: "Depth", icon: Layers, lens: "depth" },
];

export default function LyraNav() {
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { data: me } = trpc.social.me.useQuery();

  const isLanding = location === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 backdrop-blur-xl",
        isLanding ? "bg-background/70" : "bg-background/85"
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-baseline gap-2 shrink-0">
          <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--lyra-teal-deep)] group-hover:text-primary transition-colors">
            {SITE.name}
          </span>
          {SITE.workingTitle && (
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Arbeitstitel
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              location === item.href ||
              (item.href !== "/app" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-300",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/compose"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--lyra-ember)] px-3.5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:brightness-105 active:scale-[0.98]"
          >
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Compose</span>
          </Link>
          <Link
            href={me ? `/u/${me.handle}` : "/profil"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary"
            title="Profil"
          >
            {me?.avatar ?? <User className="h-4 w-4" />}
          </Link>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => logout()}
              className="hidden lg:inline text-xs text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="hidden lg:inline text-xs font-medium text-primary hover:underline"
            >
              Anmelden
            </a>
          )}
        </div>
      </div>

      {/* Mobile lens bar */}
      <div className="md:hidden border-t border-border/50 px-2 pb-2 pt-1 flex gap-1 overflow-x-auto">
        {NAV.map((item) => {
          const active =
            location === item.href ||
            (item.href !== "/app" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold whitespace-nowrap",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/70 text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
