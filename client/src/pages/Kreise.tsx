import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "wouter";

export default function Kreise() {
  const { data, isLoading } = trpc.social.getCommunities.useQuery();

  return (
    <div className="container py-8">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold gradient-text">Kreise</h1>
        <p className="text-muted-foreground mt-2">
          Reddit-Diskussion, Discord-Gemeinschaft, Mastodon-Nischen — als thematische Räume mit
          Voting.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        {data?.map((c) => (
          <Card
            key={c.id}
            className="overflow-hidden border-border/80 hover:border-primary/40 transition-colors group"
          >
            <div
              className={`h-20 bg-gradient-to-r ${c.coverGradient ?? "from-violet-600 to-cyan-500"} opacity-90`}
            />
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-hidden>
                  {c.iconEmoji}
                </span>
                <div>
                  <h2 className="font-semibold text-lg leading-tight">{c.name}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {c.memberCount} Mitglieder
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              <Link href={`/kreise/${c.slug}`}>
                <Button variant="secondary" size="sm" className="w-full gap-2 group-hover:bg-primary/20">
                  Öffnen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
