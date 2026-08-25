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
  Zap,
  Coins,
  Search,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { trpc } from "@/lib/trpc";
import { formatAtc, getAtcBalance, getAtcVersion, subscribeAtc } from "@/lib/atcWalletStore";

const NAV_LINKS = [
  { href: "/marktplatz", label: "Marktplatz", icon: Search },
  { href: "/verkaufen", label: "Verkaufen", icon: Tag },
  { href: "/guthaben", label: "Guthaben", icon: Coins },
  { href: "/warenkorb", label: "Warenkorb", icon: ShoppingCart },
  { href: "/portal", label: "Social Portal", icon: Zap },
  { href: "/free-games", label: "Free Games", icon: Gift },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/ueber-uns", label: "Über uns", icon: Info },
];

const EXTERNAL_NAV_LINKS = [
  { href: SITE.webspaceUrl, label: "Webspace", icon: Globe },
  { href: SITE.hybrixonUrl, label: SITE.hybrixonLabel, icon: Zap },
  { href: SITE.githubUrl, label: "GitHub", icon: Github },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const atcV = useSyncExternalStore(subscribeAtc, getAtcVersion, getAtcVersion);
  void atcV;
  const atcBalance = user?.id ? getAtcBalance(user.id) : 0;
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
                className="text-xs text-muted-foreground leading-none mt-0.5 tracking-widest uppercase"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Crew
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
                    location === href
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
            {EXTERNAL_NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-primary hover:bg-white/5 transition-all duration-200"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </a>
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
                  </Button>
                </Link>
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
                  <DropdownMenuItem asChild>
                    <Link href="/guthaben" className="cursor-pointer">
                      <Coins className="mr-2 h-4 w-4" />
                      Guthaben ({formatAtc(atcBalance)})
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
              </>
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
                    location === href ? "text-primary bg-primary/10" : "text-muted-foreground"
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
