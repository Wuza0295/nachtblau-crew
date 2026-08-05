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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  Radio,
  Orbit,
  MessagesSquare,
  Compass,
  Zap,
  LogOut,
  User,
  PenSquare,
  Gift,
  Newspaper,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const NAV_LINKS = [
  { href: "/feed", label: "Feed", icon: Radio },
  { href: "/pulse", label: "Pulse", icon: Zap },
  { href: "/circles", label: "Circles", icon: Orbit },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
  { href: "/radar", label: "Radar", icon: Compass },
];

const MORE_LINKS = [
  { href: "/free-games", label: "Free Games", icon: Gift },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/forum", label: "Forum", icon: MessageSquare },
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
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center animate-moment-pulse">
              <span className="font-display font-extrabold text-primary text-sm tracking-tight">FX</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg leading-none flux-gradient-text">
                  {SITE.shortName}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">
                  Arbeitstitel
                </span>
              </div>
              <div className="text-xs text-muted-foreground leading-none mt-0.5">
                {SITE.tagline}
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
            <Link href="/compose" className="hidden sm:block">
              <Button size="sm" className="gap-2 font-medium">
                <PenSquare className="h-4 w-4" />
                Posten
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8 presence-ring">
                      {user?.avatar ? <AvatarImage src={user.avatar} /> : null}
                      <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profil" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Profil
                    </Link>
                  </DropdownMenuItem>
                  {MORE_LINKS.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" /> {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="secondary">
                <a href={getLoginUrl()}>Anmelden</a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menü"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-1 animate-rise">
            {[...NAV_LINKS, ...MORE_LINKS, { href: "/compose", label: "Posten", icon: PenSquare }].map(
              ({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 ${
                      location === href ? "text-primary bg-primary/10" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
