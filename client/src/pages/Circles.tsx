import { AppNav } from "@/components/CadenceNav";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { formatScore } from "@shared/social";
import { Hash, Headphones, LayoutGrid, MessageSquare } from "lucide-react";

const roomIcon = {
  chat: MessageSquare,
  voice: Headphones,
  board: LayoutGrid,
};

export default function Circles() {
  const { data: circles = [] } = trpc.social.circles.useQuery();

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <AppNav />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-8">
        <div className="animate-rise">
          <h1 className="font-display text-3xl font-bold">Kreise</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Themen-Communities mit Räumen — Reddit-Tiefe trifft Discord-Präsenz. Kein
            Broadcast, sondern Beitrag.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {circles.map((c, i) => (
            <Link
              key={c.id}
              href={`/kreise/${c.slug}`}
              className="group rounded-3xl border border-border bg-card p-6 hover:shadow-md transition animate-rise"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="size-12 rounded-2xl grid place-items-center text-white shrink-0"
                  style={{ background: c.accent }}
                >
                  <Hash className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold group-hover:text-primary transition">
                    {c.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {c.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatScore(c.members)} Mitglieder</span>
                <span className="text-primary font-semibold">
                  {c.online} online
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.rooms.map((r) => {
                  const Icon = roomIcon[r.kind];
                  return (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-secondary"
                    >
                      <Icon className="size-3" />
                      {r.name}
                    </span>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
