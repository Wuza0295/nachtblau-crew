import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import PostCard from "@/components/portal/PostCard";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Explore() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  const { data, isFetching } = trpc.social.search.useQuery(
    { query: query.trim() },
    { enabled: query.trim().length >= 2 }
  );
  const { data: tagPosts } = trpc.social.getByHashtag.useQuery(
    { tag: query.trim().replace(/^#/, "") },
    { enabled: query.trim().length >= 2 && !data?.posts.length }
  );

  const displayPosts = (data?.posts?.length ? data.posts : tagPosts) ?? [];

  return (
    <div className="container py-8 pb-24 md:pb-10 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">Entdecken</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Social SEO — Hashtags, Menschen und Waves durchsuchbar (Trend 2026).
      </p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche #hashtags, Namen, Themen…"
          className="pl-10 rounded-full bg-muted/40 border-border/80 h-11"
        />
      </div>

      {query.trim().length < 2 && (
        <TrendingSection />
      )}

      {query.trim().length >= 2 && (
        <div className="space-y-6">
          {data?.users && data.users.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Menschen
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.users.map((u) => (
                  <Link key={u.id} href={`/profil/${u.id}`}>
                    <Badge variant="outline" className="cursor-pointer py-1.5 px-3">
                      {u.name}
                      {u.handle && <span className="text-muted-foreground ml-1">@{u.handle}</span>}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data?.hashtags && data.hashtags.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3">Hashtags</h2>
              <div className="flex flex-wrap gap-2">
                {data.hashtags.map((t) => (
                  <Link key={t.id} href={`/entdecken?q=${t.tag}`}>
                    <Badge className="cursor-pointer">#{t.tag}</Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Beiträge</h2>
            {isFetching && <p className="text-xs text-muted-foreground">Suche…</p>}
            {displayPosts.map((item) => (
              <PostCard key={item.post.id} item={item} />
            ))}
            {!isFetching && displayPosts.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine Treffer für „{query}“.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TrendingSection() {
  const { data: trending } = trpc.social.getTrendingTags.useQuery();
  return (
    <div className="portal-card rounded-2xl p-5 border border-border/60">
      <h2 className="font-display font-semibold mb-3">Trending</h2>
      <div className="flex flex-wrap gap-2">
        {(trending ?? []).map((t) => (
          <Link key={t.id} href={`/entdecken?q=${t.tag}`}>
            <Badge variant="secondary" className="cursor-pointer">
              #{t.tag}
            </Badge>
          </Link>
        ))}
        {(trending ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Poste mit #Hashtags — sie erscheinen hier.</p>
        )}
      </div>
    </div>
  );
}
