import ComposePostDialog from "@/components/social/ComposePostDialog";
import IntensityControl from "@/components/social/IntensityControl";
import PostCard from "@/components/social/PostCard";
import SocialShell from "@/components/social/SocialShell";
import StoryRail from "@/components/social/StoryRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FeedMode = "friends" | "discover" | "community";

const FEED_TABS: { value: FeedMode; label: string; hint: string }[] = [
  { value: "friends", label: "Freunde", hint: "Instagram/X — nur Menschen, denen du folgst" },
  { value: "discover", label: "Für dich", hint: "TikTok/LinkedIn — Entdeckung nach Relevanz" },
  { value: "community", label: "Kreis", hint: "Reddit — ein Community-Fokus" },
];

export default function SocialHub() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [feedMode, setFeedMode] = useState<FeedMode>("discover");
  const [communitySlug, setCommunitySlug] = useState("pro-pulse");

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("kreis");
    if (k) {
      setFeedMode("community");
      setCommunitySlug(k);
    }
  }, []);

  const { data: trending } = trpc.social.getTrending.useQuery();
  const { data: communities } = trpc.social.getCommunities.useQuery();

  const feedInput = useMemo(
    () => ({
      mode: feedMode,
      communitySlug: feedMode === "community" ? communitySlug : undefined,
      maxIntensity: intensity,
      limit: 20,
    }),
    [feedMode, communitySlug, intensity]
  );

  const { data, isLoading, isFetching } = trpc.social.getFeed.useQuery(feedInput);

  return (
    <SocialShell onCompose={() => setComposeOpen(true)}>
      <ComposePostDialog open={composeOpen} onOpenChange={setComposeOpen} />

      <div className="py-6 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6 min-w-0">
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Badge
                  variant="outline"
                  className="mb-2 border-[oklch(0.65_0.22_310/0.5)] text-[oklch(0.75_0.18_310)]"
                >
                  Hybrid Social · Research 2025/26
                </Badge>
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  Ein Portal. Alle Stärken.
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Multi-Feed wie WeLoop & Amara, Kreise wie Reddit, Fluss wie TikTok, Momente wie
                  Stories, Pulse wie X, Tiefe wie LinkedIn — mit transparenter Feed-Intensität.
                </p>
              </div>
            </div>
            <StoryRail />
          </section>

          <Tabs
            value={feedMode}
            onValueChange={(v) => setFeedMode(v as FeedMode)}
            className="w-full"
          >
            <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-white/5 p-1 rounded-2xl">
              {FEED_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 min-w-[90px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[oklch(0.65_0.22_310)] data-[state=active]:to-[oklch(0.62_0.2_25)] data-[state=active]:text-white"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <p className="text-xs text-muted-foreground mt-2 px-1">
              {FEED_TABS.find((t) => t.value === feedMode)?.hint}
            </p>
          </Tabs>

          {feedMode === "community" && (
            <div className="flex flex-wrap gap-2">
              {communities?.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={communitySlug === c.slug ? "default" : "outline"}
                  className={cn(
                    "rounded-full",
                    communitySlug === c.slug &&
                      "bg-white/10 border-[oklch(0.65_0.22_310)]"
                  )}
                  onClick={() => setCommunitySlug(c.slug)}
                >
                  {c.iconEmoji} {c.name}
                </Button>
              ))}
            </div>
          )}

          <div className="lg:hidden">
            <IntensityControl value={intensity} onChange={setIntensity} />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {isFetching && !isLoading && (
                <p className="text-xs text-center text-muted-foreground">Aktualisiere…</p>
              )}
              {data?.posts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Noch leer in diesem Feed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {feedMode === "friends"
                      ? "Folge Creatorn oder wechsle zu „Für dich“."
                      : "Sei der Erste — poste oben rechts."}
                  </p>
                </div>
              )}
              {data?.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block space-y-4">
          <IntensityControl value={intensity} onChange={setIntensity} />

          <div className="rounded-2xl border border-white/10 bg-card/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-[oklch(0.72_0.18_310)]" />
              Trending
            </div>
            <div className="flex flex-wrap gap-2">
              {trending?.map((t) => (
                <span
                  key={t.tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10"
                >
                  #{t.tag}
                  <span className="text-muted-foreground ml-1">{t.count}</span>
                </span>
              ))}
              {!trending?.length && (
                <p className="text-xs text-muted-foreground">Noch keine Tags</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[oklch(0.18_0.08_310)] to-transparent p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Was dieses Portal vereint
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li>· Dual-Feed + Kreise (Amara, Reddit, Discord)</li>
              <li>· Fluss-Shorts + Artikel (TikTok, LinkedIn)</li>
              <li>· 5 Reaktionen + Repost + Lesezeichen (X, IG)</li>
              <li>· Momente 24h + Umfragen + Medien</li>
              <li>· Intensitäts-Slider statt undurchsichtigem Algorithmus</li>
            </ul>
          </div>
        </aside>
      </div>
    </SocialShell>
  );
}
