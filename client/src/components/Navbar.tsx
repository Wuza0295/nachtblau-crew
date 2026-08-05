import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/raeume", label: "Räume" },
  { href: "/kreis", label: "Kreis" },
  { href: "/konzept", label: "Konzept" },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-bar">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-sm font-700 font-bold tracking-tight transition-transform group-hover:scale-105">
            {SITE.logoLetter}
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            {SITE.name}
            {SITE.isWorkingTitle && (
              <span className="ml-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                Arbeitstitel
              </span>
            )}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                location.startsWith(item.href)
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/schreiben" className="hidden sm:block">
            <Button size="sm" className="rounded-full px-4 font-medium">
              Schreiben
            </Button>
          </Link>
          {!loading &&
            (isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/profil/${user?.id ?? 1}`}
                  className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline"
                >
                  {user?.name?.split(" ")[0] ?? "Profil"}
                </Link>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Abmelden
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <a href={getLoginUrl()}>Anmelden</a>
              </Button>
            ))}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menü"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 px-4 py-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/schreiben"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-primary"
          >
            Schreiben
          </Link>
        </div>
      )}
    </header>
  );
}
