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
  Gamepad2,
  Newspaper,
  MessageSquare,
  Gift,
  LogOut,
  User,
  Github,
  Globe,
  Info,
  Home,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const NAV_LINKS = [
  { href: "/", label: "Launcher", icon: Home, exact: true },
  { href: "/portal", label: "Social Portal", icon: Zap, exact: false },
  { href: "/free-games", label: "Free Games", icon: Gift, exact: false },
  { href: "/news", label: "News", icon: Newspaper, exact: false },
  { href: "/forum", label: "Forum", icon: MessageSquare, exact: false },
  { href: "/ueber-uns", label: "Über uns", icon: Info, exact: false },
];

const EXTERNAL_NAV_LINKS = [
  { href: SITE.webspaceUrl, label: "Webspace", icon: Globe },
  { href: SITE.hybrixonUrl, label: SITE.hybrixonLabel, icon: Zap },
  { href: SITE.githubUrl, label: "GitHub", icon: Github },
];

function isActive(location: string, href: string, exact: boolean) {
  if (exact) return location === href;
  return location === href || location.startsWith(`${href}/`);
}

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
    <nav
      className={`glass-nav sticky z-50 ${SITE.maintenanceMode ? "top-10" : "top-0"}`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={SITE.logoUrl}
              alt="NachtBlau Crew Logo"
              className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <div className="hidden sm:block">
              <span
                className="font-bold text-lg leading-none gradient-text"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                NachtBlau
              </span>
              <div
                className="text-[10px] text-muted-foreground leading-none mt-0.5 tracking-[0.22em] uppercase"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Launcher
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(location, href, exact);
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 transition-all duration-200 ${
                      active
                        ? "text-primary bg-primary/12"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
            <div className="hidden xl:flex items-center gap-0.5">
              {EXTERNAL_NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-primary hover:bg-white/5 transition-all duration-200"
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only 2xl:not-sr-only 2xl:inline">{label}</span>
                  </Button>
                </a>
              ))}
            </div>

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
                      {user.name ?? "Spieler"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profil/${user.id}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mein Profil
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
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Anmelden
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Menü"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-border py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 ${
                    isActive(location, href, exact)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
            {EXTERNAL_NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
