import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PULSE_TOPICS } from "@shared/site";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function Circles() {
  const { data, isLoading } = trpc.circles.list.useQuery({});

  return (
    <div className="container py-8 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-bold">Circles</h1>
        <p className="text-muted-foreground">
          Themenräume mit Zugehörigkeit — Reddit-Tiefe, Discord-Nähe.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        {data?.map((c) => {
          const topic = PULSE_TOPICS.find((t) => t.id === c.topic);
          return (
            <Link key={c.id} href={`/circles/${c.slug}`}>
              <article className="atmosphere-panel rounded-2xl overflow-hidden h-full hover:scale-[1.01] transition-transform duration-300">
                <div
                  className="h-24"
                  style={{ background: c.coverGradient ?? "var(--primary)" }}
                />
                <div className="p-5 space-y-2 -mt-6 relative">
                  <div className="h-12 w-12 rounded-xl bg-background border border-border flex items-center justify-center font-display font-bold text-primary shadow-sm">
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <h2 className="font-display font-semibold text-lg">{c.name}</h2>
                    {c.isFeatured && (
                      <Badge variant="secondary" className="text-[10px]">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {c.memberCount}
                    </span>
                    {topic && <span>{topic.label}</span>}
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
