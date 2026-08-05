import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Compass,
  Home,
  Layers,
  LogOut,
  PenLine,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const MAIN_NAV = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/flashes", label: "Flashes", icon: Zap },
  { href: "/kreise", label: "Kreise", icon: Layers },
  { href: "/entdecken", label: "Entdecken", icon: Compass },
  { href: "/moment", label: "Moment", icon: Sparkles },
];

export default function PortalNav() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
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
    <>
      <header className="portal-glass sticky top-0 z-50 border-b border-border/60">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-accent to-[oklch(0.72_0.18_330)] flex items-center justify-center text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-200 group-hover:scale-105 group-active:scale-[0.97]">
              ◈
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-display font-semibold text-foreground tracking-tight">
                {SITE.shortName}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {SITE.codename}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {MAIN_NAV.map(({ href, label, icon: Icon }) => {
              const active = location === href || location.startsWith(href + "/");
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 rounded-full px-3 transition-all duration-200 ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/erstellen">
                  <Button size="sm" className="rounded-full gap-1.5 hidden sm:flex shadow-primary/20 shadow-md">
                    <PenLine className="h-4 w-4" />
                    Erstellen
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 rounded-full p-0 ring-2 ring-primary/20">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{user?.name ?? "Mitglied"}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profil/${user?.id}`} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="text-destructive cursor-pointer"
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
                className="rounded-full"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Beitreten
              </Button>
            )}
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 portal-glass border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14 px-1">
          {MAIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <button
                  type="button"
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors duration-200 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              </Link>
            );
          })}
          <Link href="/erstellen">
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground"
            >
              <PenLine className="h-5 w-5" />
              <span className="text-[10px] font-medium">Neu</span>
            </button>
          </Link>
        </div>
      </nav>
    </>
  );
}
