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
  Radio,
  Compass,
  Orbit,
  LayoutGrid,
  PenLine,
  LogOut,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BrandMark } from "./BrandMark";

const NAV_LINKS = [
  { href: "/feed", label: "Pulse", icon: Radio },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/circles", label: "Circles", icon: Orbit },
  { href: "/boards", label: "Boards", icon: LayoutGrid },
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
    : "?";

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
            <span className="font-display font-bold text-xl tracking-tight text-gradient">
              {SITE.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location === link.href || location.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 ${active ? "bg-secondary text-primary" : "text-muted-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/compose" className="hidden sm:block">
                  <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                    <PenLine className="h-4 w-4" />
                    Posten
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/profil/${user?.id}`} className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" /> Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pulse" className="flex items-center gap-2 cursor-pointer">
                        <SlidersHorizontal className="h-4 w-4" /> Pulse-Dials
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="text-destructive gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <a href={getLoginUrl()}>Anmelden</a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            {isAuthenticated && (
              <Link href="/compose" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <PenLine className="h-4 w-4" /> Posten
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
