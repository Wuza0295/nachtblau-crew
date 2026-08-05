import { cn } from "@/lib/utils";
import {
  ALLXION_ROUTES,
  isAllxionFlussPath,
  isAllxionHubPath,
  isAllxionKreisePath,
  isAllxionMomentePath,
} from "@/lib/allxion";
import { ALLXION } from "@/lib/site";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import {
  Compass,
  Gift,
  Home,
  Layers,
  LogOut,
  MessageSquare,
  Newspaper,
  PlusCircle,
  Radio,
  Sparkles,
  User,
  Users,
  Globe,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const NAV = [
  {
    href: ALLXION_ROUTES.hub,
    label: "Hub",
    icon: Home,
    match: isAllxionHubPath,
  },
  {
    href: ALLXION_ROUTES.fluss,
    label: "Fluss",
    icon: Radio,
    match: isAllxionFlussPath,
  },
  {
    href: ALLXION_ROUTES.kreise,
    label: "Kreise",
    icon: Users,
    match: isAllxionKreisePath,
  },
  {
    href: ALLXION_ROUTES.momente,
    label: "Momente",
    icon: Sparkles,
    match: isAllxionMomentePath,
  },
] as const;

const CREW_LINKS = [
  { href: ALLXION_ROUTES.crew, label: "Crew Start", icon: Compass, external: false },
  {
    href: ALLXION.webspaceProjectsUrl,
    label: "nacht-blau.de",
    icon: Globe,
    external: true,
  },
  { href: "/free-games", label: "Free Games", icon: Gift, external: false },
  { href: "/news", label: "News", icon: Newspaper, external: false },
  { href: "/forum", label: "Forum", icon: MessageSquare, external: false },
] as const;

export default function SocialShell({
  children,
  onCompose,
}: {
  children: React.ReactNode;
  onCompose?: () => void;
}) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = ALLXION_ROUTES.hub;
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
    <div
      className="min-h-screen flex flex-col text-foreground"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 100% 0%, oklch(0.22 0.12 310 / 0.35), transparent 50%), radial-gradient(ellipse 80% 60% at 0% 100%, oklch(0.18 0.1 25 / 0.25), transparent 45%), oklch(0.07 0.02 280)",
      }}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-2">
          <Link href={ALLXION_ROUTES.hub} className="flex items-center gap-2 group shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.2_25)] via-[oklch(0.65_0.22_310)] to-[oklch(0.55_0.18_260)] flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 group-active:scale-95">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight hidden sm:block">
              <p
                className="text-sm font-semibold tracking-tight"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {ALLXION.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
                {ALLXION.tagline}
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map((item) => {
              const active = item.match(location);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-full transition-all duration-200",
                      active && "bg-white/10 text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full gap-2">
                  <Compass className="h-4 w-4" />
                  NachtBlau
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="border-white/10">
                {CREW_LINKS.map(({ href, label, icon: Icon, external }) =>
                  external ? (
                    <DropdownMenuItem key={href} asChild>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </a>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {onCompose && (
              <Button
                size="sm"
                className="rounded-full gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_310)] to-[oklch(0.62_0.2_25)] text-white border-0 shadow-md hover:opacity-90 transition-opacity duration-200 active:scale-[0.97]"
                onClick={onCompose}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Posten</span>
              </Button>
            )}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/10">
                  <DropdownMenuItem asChild>
                    <Link href={`/profil/${user.id}`} className="flex gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/20"
                onClick={() => {
                  if (
                    !import.meta.env.VITE_OAUTH_PORTAL_URL ||
                    !import.meta.env.VITE_APP_ID
                  ) {
                    toast.message("Login ist in dieser Umgebung noch nicht konfiguriert.");
                    return;
                  }
                  window.location.href = getLoginUrl();
                }}
              >
                Anmelden
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 container pb-24 md:pb-8">{children}</div>

      <footer className="hidden md:block border-t border-white/10 mt-8">
        <div className="container py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span style={{ fontFamily: "Syne, sans-serif" }} className="font-semibold text-foreground">
            {ALLXION.name}
          </span>
          <div className="flex flex-wrap gap-4">
            {CREW_LINKS.slice(1).map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="flex justify-around py-2">
          {NAV.map((item) => {
            const active = item.match(location);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors duration-200",
                    active ? "text-[oklch(0.75_0.18_310)]" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
