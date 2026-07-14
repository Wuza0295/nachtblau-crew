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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingBag, Search, Tag, LogOut, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NAV_LINKS = [
  { href: "/marktplatz", label: "Marktplatz", icon: Search },
  { href: "/verkaufen", label: "Verkaufen", icon: Tag },
];

export default function Navbar() {
  const { user, isAuthenticated, logout, loginDemo } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = () => {
    if (isOAuthConfigured()) {
      window.location.href = getLoginUrl();
      return;
    }
    loginDemo();
    toast.success("Demo-Modus aktiv – du bist als DemoSammler angemeldet");
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/autic-treasures-logo.png"
              alt="Autic Treasures Logo"
              className="h-10 w-10 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
            />
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-lg leading-none text-primary tracking-wide">
                AUTIC
              </span>
              <div className="text-[10px] text-primary/80 leading-none mt-0.5 tracking-[0.18em] uppercase">
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
                  className={`gap-2 transition-all duration-200 ${
                    location === href || location.startsWith(href + "/")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
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
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name ?? "Sammler"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email ?? ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.openId !== "demo" && (
                    <DropdownMenuItem asChild>
                      <Link href={`/profil/${user.id}`} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mein Profil
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
                {isOAuthConfigured() ? "Anmelden" : "Demo starten"}
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
                  className={`w-full justify-start gap-2 ${
                    location === href ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
