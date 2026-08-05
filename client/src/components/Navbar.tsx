import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { SITE } from "@/lib/site";
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
import {
  Menu,
  X,
  LogOut,
  User,
  SlidersHorizontal,
  Bell,
  Compass,
  Home,
  Clapperboard,
  Users,
  Library,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const NAV_LINKS = [
  { href: "/home", label: "Feed", icon: Home },
  { href: "/motion", label: "Motion", icon: Clapperboard },
  { href: "/circles", label: "Circles", icon: Users },
  { href: "/vault", label: "Vault", icon: Library },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/algorithm", label: "Algorithmus", icon: SlidersHorizontal },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AE";

  return (
    <nav className="aether-nav sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="relative grid place-items-center h-9 w-9 rounded-full bg-[oklch(0.42_0.1_195)] text-white font-display font-bold text-sm shadow-[0_8px_24px_oklch(0.48_0.1_195/0.35)] transition-transform duration-300 group-hover:scale-105">
              Æ
            </span>
            <div className="leading-tight">
              <div className="font-display font-bold text-xl brand-mark tracking-tight">
                {SITE.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {SITE.workingNameNote}
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = location === href || location.startsWith(href + "/");
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 rounded-full ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{user.name ?? "Du"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profil/mira" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Demo-Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
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
                className="rounded-full font-semibold shadow-md shadow-primary/20"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Anmelden
              </Button>
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
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 rounded-xl ${
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
