import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { SlidersHorizontal, PenLine } from "lucide-react";
import { getLoginUrl } from "@/const";

function SignalStrip() {
  const { data: signals } = trpc.feed.signals.useQuery();
  if (!signals?.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {signals.map((s) => {
        const initials = (s.author.name ?? "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <Link
            key={s.post.id}
            href={`/post/${s.post.id}`}
            className="shrink-0 w-20 flex flex-col items-center gap-1.5 group"
          >
            <div className="relative p-[2px] rounded-full signal-ring">
              <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center overflow-hidden">
                {s.post.mediaUrl ? (
                  <img src={s.post.mediaUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-sm text-primary">{initials}</span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center group-hover:text-foreground">
              {s.author.handle ?? s.author.name ?? "Signal"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"pulse" | "following" | "latest">("pulse");

  const { data, isLoading } = trpc.feed.get.useQuery({
    mode: isAuthenticated ? mode : mode === "following" ? "latest" : mode,
    limit: 24,
  });

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Pulse</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dein Feed — sortiert nach dem, was du justierst.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pulse">
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Dials
            </Button>
          </Link>
          {isAuthenticated ? (
            <Link href="/compose">
              <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                <PenLine className="h-3.5 w-3.5" />
                Posten
              </Button>
            </Link>
          ) : (
            <Button size="sm" asChild>
              <a href={getLoginUrl()}>Anmelden</a>
            </Button>
          )}
        </div>
      </div>

      <SignalStrip />

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as typeof mode)}
      >
        <TabsList className="bg-secondary/80">
          <TabsTrigger value="pulse">Pulse</TabsTrigger>
          <TabsTrigger value="latest">Neu</TabsTrigger>
          <TabsTrigger value="following" disabled={!isAuthenticated}>
            Following
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-5">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        {!isLoading && data?.length === 0 && (
          <div className="atmosphere-panel rounded-2xl p-10 text-center space-y-3">
            <p className="font-display text-xl font-semibold">Noch ruhig hier</p>
            <p className="text-muted-foreground text-sm">
              Justiere deine Dials oder entdecke Circles — dann füllt sich der Pulse.
            </p>
            <Link href="/explore">
              <Button variant="outline">Explore öffnen</Button>
            </Link>
          </div>
        )}
        {data?.map((item) => (
          <PostCard key={item.post.id} item={item} />
        ))}
      </div>
    </div>
  );
}
