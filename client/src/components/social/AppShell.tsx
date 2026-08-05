import { SITE } from "@/lib/site";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Compass,
  Home,
  Layers,
  MessageCircle,
  Radio,
  Users,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { ReactNode } from "react";

const nav = [
  { href: "/app", label: "Feed", icon: Home },
  { href: "/app/sparks", label: "Sparks", icon: Zap },
  { href: "/app/circles", label: "Circles", icon: Users },
  { href: "/app/collectives", label: "Collectives", icon: Layers },
  { href: "/app/explore", label: "Explore", icon: Compass },
  { href: "/app/messages", label: "Direct", icon: MessageCircle },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const [location] = useLocation();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            <span className="text-coral">{SITE.shortName}</span>
            <span className="ml-2 hidden text-xs font-medium text-muted-foreground sm:inline">
              Arbeitstitel
            </span>
          </Link>
          {title && (
            <h1 className="absolute left-1/2 hidden -translate-x-1/2 font-display text-sm font-semibold md:block">
              {title}
            </h1>
          )}
          <Link
            href="/app/u/you"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-mist"
          >
            <Radio className="h-3.5 w-3.5 text-coral" />
            Profil
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr_260px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] border-r border-border/50 p-4 md:block">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/app"
                  ? location === "/app"
                  : location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-8 px-3 text-[11px] leading-relaxed text-muted-foreground">
            Lenses statt Blackbox. Circles statt Chaos. Signal statt Vanity.
          </p>
        </aside>

        <main className="min-w-0 px-4 py-4 pb-24 md:pb-8">{children}</main>

        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-l border-border/50 p-4 lg:block">
          <RightRail />
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-1 py-2">
          {nav.slice(0, 5).map((item) => {
            const active =
              item.href === "/app"
                ? location === "/app"
                : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-semibold",
                  active ? "text-coral" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function RightRail() {
  const { data: topics = [] } = trpc.social.trending.useQuery();
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-sm font-bold">Trending Topics</h2>
        <ul className="mt-3 space-y-2">
          {topics.map((t) => (
            <li key={t.topic} className="flex items-center justify-between text-sm">
              <span className="font-medium">#{t.topic}</span>
              <span className="text-xs text-muted-foreground">{t.heat}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-ink p-4 text-mist">
        <p className="font-display text-lg font-bold leading-snug">Warum diese Lens?</p>
        <p className="mt-2 text-xs leading-relaxed text-mist/70">
          Jeder Post kann erklären, warum er erscheint — Frische, Nähe, Signal oder Exploration.
          Kein Schattenranking.
        </p>
      </section>
    </div>
  );
}
