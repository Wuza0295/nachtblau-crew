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
  Github,
  Rss,
  Compass,
  Circle,
  Users,
  Zap,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const NAV_LINKS = [
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/pulse", label: "Pulse", icon: Zap },
  { href: "/kreise", label: "Kreise", icon: Users },
  { href: "/momente", label: "Momente", icon: Circle },
  { href: "/entdecken", label: "Entdecken", icon: Compass },
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

  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-bold text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-105"
              aria-hidden
            >
              {SITE.codename}
            </span>
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-none gradient-text">{SITE.shortName}</span>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5 tracking-widest uppercase">
                Social Portal
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 transition-all duration-200 ${
                    isActive(href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Github className="h-4 w-4" />
              </Button>
            </a>
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
                      {user.name ?? "Nutzer"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profil/${user.id}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
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
                className="bg-primary hover:bg-primary/80 font-semibold shadow-lg shadow-primary/20"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <Sparkles className="mr-2 h-4 w-4" />
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
                  className={`w-full justify-start gap-2 ${
                    isActive(href) ? "text-primary bg-primary/10" : "text-muted-foreground"
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
