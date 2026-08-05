import { PostCard } from "@/components/social/PostCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Hash, Search, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Entdecken() {
  const { data: trending, isLoading } = trpc.social.getTrending.useQuery();
  const { data: discoverPosts } = trpc.social.getFeed.useQuery({
    mode: "discover",
    postKind: "feed",
    limit: 8,
  });

  return (
    <div className="container py-8 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <Search className="h-8 w-8 text-primary" />
          Entdecken
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Social Search 2026: Hashtags, Trends und virale Signale — inspiriert von TikTok- und
          Instagram-Entdeckung, ohne Filterblase-Zwang.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Themen
        </h2>
        <div className="flex flex-wrap gap-2">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          {trending?.map((t) => (
            <Link key={t.tag} href={`/feed`}>
              <Badge variant="secondary" className="text-sm py-1.5 px-3 gap-1 cursor-pointer hover:bg-primary/20">
                <Hash className="h-3 w-3" />
                {t.tag}
                <span className="text-muted-foreground ml-1">{t.score}</span>
              </Badge>
            </Link>
          ))}
          {!isLoading && trending?.length === 0 && (
            <p className="text-sm text-muted-foreground">Noch keine Trends — poste mit #Hashtags.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Gerade beliebt</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {discoverPosts?.map((item) => (
            <PostCard key={item.post.id} item={item} compact />
          ))}
        </div>
      </section>

      <Card className="mt-12 p-6 border-dashed border-primary/30 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Demnächst:</strong> Volltext-Suche über Posts, Kreise
          und Profile — wie Pinterest-Visual Discovery plus X-Keyword-Suche in einem Layer.
        </p>
      </Card>
    </div>
  );
}
