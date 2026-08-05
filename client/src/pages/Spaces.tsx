import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function Spaces() {
  const { data, isLoading } = trpc.space.list.useQuery();

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2 animate-rise">
          Horizont · Räume
        </h1>
        <p className="text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Interesse statt Follower-Zahl. Reddit-Diskussionstiefe trifft Discord-Zugehörigkeit.
        </p>

        {isLoading && (
          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {data?.map((space, i) => (
            <Link
              key={space.id}
              href={`/raeume/${space.slug}`}
              className="group block p-6 rounded-2xl bg-card/80 border border-border/60 hover:border-primary/30 transition-all duration-300 animate-rise"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">
                  {space.name}
                </h2>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {space.tone}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {space.description}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {space.memberCount.toLocaleString("de-DE")} Mitglieder
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
