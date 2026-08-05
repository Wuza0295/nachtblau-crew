import { Link, useLocation } from "wouter";
import {
  Layers,
  LayoutGrid,
  MessageCircle,
  Radio,
  Sparkles,
  Users,
  Zap,
  Bookmark,
  Bell,
  Search,
  PenLine,
  Home,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEED_VIEW_META, PORTAL_TAGLINE } from "@shared/socialPortal";
import type { FeedView } from "@shared/socialPortal";
import { cn } from "@/lib/utils";

const NAV: { view: FeedView; icon: typeof Zap }[] = [
  { view: "pulse", icon: Zap },
  { view: "canvas", icon: LayoutGrid },
  { view: "signal", icon: Radio },
  { view: "circles", icon: Users },
];

type Props = {
  activeView: FeedView;
  onViewChange: (v: FeedView) => void;
  children: React.ReactNode;
};

export default function PortalShell({ activeView, onViewChange, children }: Props) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.02_280)] text-foreground flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-cyan-500/8 blur-[100px]" />
      </div>

      <header className="relative z-20 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Crew</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold leading-tight truncate">Social Portal</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                Name folgt · Hybrid-Netzwerk
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-auto hidden md:flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="search"
              placeholder="Suche Menschen, Tags, Communities…"
              className="bg-transparent border-0 outline-none text-sm w-full placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex max-w-[1600px] w-full mx-auto">
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/5 p-4 gap-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2">
            Feed-Modus
          </p>
          {NAV.map(({ view, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
                activeView === view
                  ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 border border-violet-400/30"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mt-0.5 shrink-0",
                  activeView === view ? "text-violet-300" : "text-muted-foreground"
                )}
              />
              <div>
                <p className="text-sm font-medium">{FEED_VIEW_META[view].label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {FEED_VIEW_META[view].inspiration}
                </p>
              </div>
            </button>
          ))}

          <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-muted-foreground leading-relaxed">
            <Layers className="h-4 w-4 text-violet-300 mb-2" />
            {PORTAL_TAGLINE}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">{children}</main>

        <aside className="hidden xl:block w-72 shrink-0 border-l border-white/5 p-4">
          <PortalSidebarExtra location={location} />
        </aside>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/80 backdrop-blur-xl safe-area-pb">
        <div className="flex justify-around py-2">
          {NAV.map(({ view, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg",
                activeView === view ? "text-violet-300" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{FEED_VIEW_META[view].short}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function PortalSidebarExtra({ location }: { location: string }) {
  return (
    <>
      <p className="text-xs font-medium text-muted-foreground mb-3">Schnellzugriff</p>
      <Link href="/portal">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 mb-1",
            location === "/portal" && "bg-white/5"
          )}
        >
          <Home className="h-4 w-4" />
          Start
        </Button>
      </Link>
      <Button className="w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 border-0">
        <PenLine className="h-4 w-4" />
        Beitrag (Signal)
      </Button>
      <div className="mt-6 rounded-xl border border-white/10 p-4 bg-gradient-to-b from-white/5 to-transparent">
        <p className="text-sm font-medium mb-1">Demokratischer Boost</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Reaktion „Boost“ erhöht sichtbar den Community-Score — transparent, nicht nur
          Algorithmus.
        </p>
      </div>
    </>
  );
}
