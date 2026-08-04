import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingBag, Search, Tag, LogOut, User, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTradingProfile, profileSetupPath } from "@/lib/useTradingProfile";
import { GAME_OPTIONS } from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/marktplatz", label: "Marktplatz", icon: Search },
  { href: "/verkaufen", label: "Verkaufen", icon: Tag },
];

export default function Navbar() {
  const { user, isAuthenticated, logout, loginDemo } = useAuth();
  const { profile, isComplete } = useTradingProfile(user?.id);
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = () => {
    if (isOAuthConfigured()) {
      window.location.href = getLoginUrl();
      return;
    }
    loginDemo();
    toast.success("Angemeldet – bitte Profil anlegen zum Handeln");
    navigate(profileSetupPath("/marktplatz"));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const displayName = profile?.displayName || user?.name || "Sammler";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onMarketplace = location.startsWith("/marktplatz") || location.startsWith("/karte");

  return (
    <header className="glass-nav sticky top-0 z-50">
      <nav className="container">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/autic-treasures-logo.png"
              alt="Autic Treasures Logo"
              className="h-9 w-9 object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-base leading-none text-primary tracking-wide">
                AUTIC
              </span>
              <div className="text-[9px] text-primary/80 leading-none mt-0.5 tracking-[0.18em] uppercase">
                Treasures
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-200",
                    location === href || location.startsWith(href + "/")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 ring-2 ring-primary/30 hover:ring-primary/60 transition-all"
                  >
                    <Avatar className="h-9 w-9">
                      {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isComplete
                        ? `${profile?.country}, ${profile?.city}`
                        : "Profil unvollständig"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={isComplete ? `/verkaeufer/${user.id}` : profileSetupPath()}
                      className="cursor-pointer"
                    >
                      {isComplete ? (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          Mein Händlerprofil
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="mr-2 h-4 w-4" />
                          Profil erstellen
                        </>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  {isComplete && (
                    <DropdownMenuItem asChild>
                      <Link href={profileSetupPath()} className="cursor-pointer">
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        Profil bearbeiten
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                onClick={handleLogin}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {isOAuthConfigured() ? "Anmelden" : "Konto starten"}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    location === href ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-border/70 bg-background/40">
        <div className="container flex items-center gap-1 overflow-x-auto py-1.5">
          <Link
            href="/marktplatz"
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
              onMarketplace && !location.includes("game=")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Alle
          </Link>
          {GAME_OPTIONS.map((g) => (
            <Link
              key={g.value}
              href={`/marktplatz?game=${g.value}`}
              className="shrink-0 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              {g.short}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
