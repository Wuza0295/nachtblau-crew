import { useAuth } from "@/_core/hooks/useAuth";
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
import {
  Menu,
  X,
  ShoppingBag,
  Search,
  Tag,
  LogOut,
  User,
  BadgeCheck,
  Heart,
  ShoppingCart,
  LogIn,
  Coins,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useTradingProfile, profileSetupPath } from "@/lib/useTradingProfile";
import { GAME_OPTIONS } from "@/lib/marketplaceConstants";
import { cartCount, getCartVersion, subscribeCart } from "@/lib/cartStore";
import { getWants, getWantsVersion, subscribeWants } from "@/lib/wantsStore";
import {
  atcToEuro,
  formatAtc,
  formatEuroAmount,
  getAtcBalance,
  getAtcVersion,
  subscribeAtc,
} from "@/lib/atcWalletStore";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { profile, isComplete } = useTradingProfile(user?.id);
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartV = useSyncExternalStore(subscribeCart, getCartVersion, getCartVersion);
  const wantsV = useSyncExternalStore(subscribeWants, getWantsVersion, getWantsVersion);
  const atcV = useSyncExternalStore(subscribeAtc, getAtcVersion, getAtcVersion);
  void cartV;
  void wantsV;
  void atcV;
  const cCount = cartCount();
  const wCount = getWants().length;
  const atcBalance = user?.id ? getAtcBalance(user.id) : 0;

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

  const navLinks = [
    { href: "/marktplatz", label: "Marktplatz", icon: Search },
    { href: "/verkaufen", label: "Verkaufen", icon: Tag },
    { href: "/guthaben", label: "Guthaben", icon: Coins },
    { href: "/merkliste", label: "Merkliste", icon: Heart },
    { href: "/warenkorb", label: "Warenkorb", icon: ShoppingCart },
  ];

  return (
    <header className="glass-nav sticky top-0 z-50">
      <nav className="container">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/autic-treasures-logo-nav.png"
              alt="Autic Treasures"
              width={44}
              height={44}
              className="h-10 w-10 sm:h-11 sm:w-11 object-contain drop-shadow-[0_0_12px_oklch(0.72_0.14_65_/_0.35)] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block leading-none">
              <span className="font-serif font-bold text-[1.05rem] text-primary tracking-[0.06em]">
                AUTIC
              </span>
              <div className="text-[9px] text-primary/75 mt-0.5 tracking-[0.22em] uppercase font-serif">
                Treasures
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-200 relative",
                    location === href || location.startsWith(href + "/")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {href === "/warenkorb" && cCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {cCount}
                    </span>
                  )}
                  {href === "/merkliste" && wCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary/80 text-[10px] text-primary-foreground flex items-center justify-center">
                      {wCount}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <Link href="/guthaben" className="hidden sm:block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-primary/40 text-primary font-semibold"
                  >
                    <Coins className="h-3.5 w-3.5" />
                    {formatAtc(atcBalance)}
                    <span className="text-muted-foreground font-normal hidden xl:inline">
                      · {formatEuroAmount(atcToEuro(atcBalance))}
                    </span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full p-0 ring-2 ring-primary/30 hover:ring-primary/60 transition-all"
                    >
                      <Avatar className="h-9 w-9">
                        {profile?.avatarUrl ? (
                          <AvatarImage src={profile.avatarUrl} alt="" />
                        ) : null}
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
                            Mein Profil
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
                    <DropdownMenuItem asChild>
                      <Link href="/guthaben" className="cursor-pointer">
                        <Coins className="mr-2 h-4 w-4" />
                        Guthaben ({formatAtc(atcBalance)})
                      </Link>
                    </DropdownMenuItem>
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
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/anmelden")}
                >
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Anmelden
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                  onClick={() => navigate("/registrieren")}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Registrieren
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-border py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
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
            {!isAuthenticated && (
              <>
                <Link href="/anmelden" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <LogIn className="h-4 w-4" />
                    Anmelden
                  </Button>
                </Link>
                <Link href="/registrieren" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-primary">
                    <ShoppingBag className="h-4 w-4" />
                    Registrieren
                  </Button>
                </Link>
              </>
            )}
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
