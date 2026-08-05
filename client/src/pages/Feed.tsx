import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PostCard from "@/components/portal/PostCard";
import StoryRail from "@/components/portal/StoryRail";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Hash, TrendingUp } from "lucide-react";
import { Link } from "wouter";

type FeedMode = "discover" | "following" | "chronological";

export default function Feed() {
  const [mode, setMode] = useState<FeedMode>("discover");
  const { data: posts, isLoading } = trpc.social.getFeed.useQuery({ mode, limit: 25 });
  const { data: trending } = trpc.social.getTrendingTags.useQuery();

  return (
    <div className="container py-6 pb-24 md:pb-8">
      <div className="grid lg:grid-cols-[1fr_minmax(0,540px)_280px] gap-8">
        <aside className="hidden lg:block space-y-4">
          <div className="portal-card rounded-2xl p-4 border border-border/60">
            <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Feed-Modi
            </h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Entdecken</strong> — wie TikTok/Instagram FYP, aber transparent gewichtet.
              </li>
              <li>
                <strong className="text-foreground">Following</strong> — nur Menschen, denen du folgst.
              </li>
              <li>
                <strong className="text-foreground">Chronik</strong> — Mastodon-style, kein Algorithmus.
              </li>
            </ul>
          </div>
        </aside>

        <div className="space-y-5 min-w-0">
          <StoryRail />

          <Tabs value={mode} onValueChange={(v) => setMode(v as FeedMode)}>
            <TabsList className="w-full grid grid-cols-3 bg-muted/50 h-10 p-1 rounded-full">
              <TabsTrigger value="discover" className="rounded-full text-xs sm:text-sm">
                Entdecken
              </TabsTrigger>
              <TabsTrigger value="following" className="rounded-full text-xs sm:text-sm">
                Following
              </TabsTrigger>
              <TabsTrigger value="chronological" className="rounded-full text-xs sm:text-sm">
                Chronik
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {posts.map((item) => (
                <PostCard key={item.post.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="portal-card rounded-2xl p-8 text-center border border-dashed border-border">
              <p className="text-muted-foreground text-sm">
                {mode === "following"
                  ? "Folge Creators, um hier deinen persönlichen Feed zu sehen."
                  : "Noch keine Beiträge — sei der Erste und erstelle eine Wave."}
              </p>
              <Link href="/erstellen" className="text-primary text-sm mt-2 inline-block hover:underline">
                Jetzt posten →
              </Link>
            </div>
          )}
        </div>

        <aside className="hidden lg:block space-y-4">
          <div className="portal-card rounded-2xl p-4 border border-border/60 sticky top-20">
            <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-accent" />
              Social Search
            </h2>
            <div className="flex flex-wrap gap-2">
              {(trending ?? []).map((tag) => (
                <Link key={tag.id} href={`/entdecken?q=${tag.tag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary/15">
                    #{tag.tag}
                  </Badge>
                </Link>
              ))}
              {(trending ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Hashtags erscheinen automatisch in Waves.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
