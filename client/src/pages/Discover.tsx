import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash, Radio } from "lucide-react";

export default function Discover() {
  const { data } = trpc.social.discover.useQuery();
  const utils = trpc.useUtils();
  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => utils.social.discover.invalidate(),
  });

  return (
    <div className="container py-8 space-y-12">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Entdecken</h1>
        <p className="mt-2 text-muted-foreground">
          Interesse statt Social Graph — Tags, Menschen, Live Rooms.
        </p>
      </div>

      <section>
        <h2 className="font-display text-2xl">Trending Tags</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data?.trendingTags.map((t) => (
            <span
              key={t.tag}
              className="inline-flex items-center gap-1.5 rounded-full mist-panel px-4 py-2 text-sm"
            >
              <Hash className="h-3.5 w-3.5 text-primary" />
              {t.tag}
              <span className="text-xs text-muted-foreground">{t.count}</span>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Menschen folgen</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {data?.suggestedPeople.map((p) => (
            <div key={p.id} className="mist-panel flex items-center gap-3 rounded-2xl p-4">
              <Link href={`/profil/${p.handle}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={p.avatar} />
                  <AvatarFallback>{p.displayName[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/profil/${p.handle}`} className="font-medium hover:underline">
                  {p.displayName}
                </Link>
                <p className="truncate text-sm text-muted-foreground">{p.craftTitle}</p>
              </div>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => follow.mutate({ profileId: p.id })}
              >
                Folgen
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" /> Live jetzt
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {data?.liveRooms.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card/50 p-4">
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-muted-foreground">{r.topic}</p>
              <p className="mt-2 text-xs text-primary">
                {r.circle?.name} · {r.listeners} zuhören
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Kreise im Fokus</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {data?.featuredCircles.map((c) => (
            <Link key={c.id} href={`/kreise/${c.slug}`}>
              <article className="group overflow-hidden rounded-2xl mist-panel">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={c.cover}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="font-display text-lg">{c.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
