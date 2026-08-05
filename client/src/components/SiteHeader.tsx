import { Link, useLocation } from "wouter";
import { BRAND } from "@shared/brand";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Home,
  LayoutGrid,
  MessageCircle,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/kreise", label: "Kreise", icon: Users },
  { href: "/entdecken", label: "Entdecken", icon: Compass },
  { href: "/boards", label: "Boards", icon: LayoutGrid },
  { href: "/nachrichten", label: "Nachrichten", icon: MessageCircle },
];

export default function SiteHeader() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const onApp = location !== "/" && location !== "/konzept";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60",
        onApp ? "mist-panel" : "bg-transparent border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-display text-lg">
            ◈
            <span className="absolute inset-0 rounded-full animate-soft-pulse bg-accent/30 -z-10 scale-125" />
          </span>
          <span className="font-display text-xl tracking-tight">
            {BRAND.name}
            {BRAND.isWorkingName && (
              <span className="ml-1.5 align-middle text-[10px] font-sans font-medium uppercase tracking-widest text-muted-foreground">
                Arbeitsname
              </span>
            )}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && (
            isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/profil/mira.k">
                  <span className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground">
                    {user?.name ?? "Profil"}
                  </span>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Abmelden
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="rounded-full">
                <a href={getLoginUrl()}>Beitreten</a>
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menü"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border mist-panel px-4 py-3 space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <span className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
