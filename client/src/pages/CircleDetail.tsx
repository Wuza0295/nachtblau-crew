import { AppNav } from "@/components/CadenceNav";
import { PostCard } from "@/components/PostCard";
import { Composer } from "@/components/Composer";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { formatScore } from "@shared/social";
import { ArrowLeft, Hash, Headphones, LayoutGrid, MessageSquare } from "lucide-react";
import { useMood } from "@/contexts/MoodContext";
import { useEffect } from "react";

const roomIcon = {
  chat: MessageSquare,
  voice: Headphones,
  board: LayoutGrid,
};

export default function CircleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { setMood } = useMood();
  useEffect(() => {
    setMood("kreise");
  }, [setMood]);

  const { data: circle, isLoading } = trpc.social.circleBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-dvh">
        <AppNav />
        <p className="p-8 text-center text-muted-foreground">Lade Kreis…</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-dvh">
        <AppNav />
        <p className="p-8 text-center">Kreis nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <AppNav />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <Link
          href="/kreise"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Alle Kreise
        </Link>

        <div
          className="rounded-3xl border border-border p-6 animate-rise"
          style={{
            background: `linear-gradient(135deg, ${circle.accent}18, transparent 60%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="size-14 rounded-2xl grid place-items-center text-white"
              style={{ background: circle.accent }}
            >
              <Hash className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold">{circle.name}</h1>
              <p className="text-sm text-muted-foreground">
                {formatScore(circle.members)} ·{" "}
                <span className="text-primary font-semibold">{circle.online} online</span>
              </p>
            </div>
          </div>
          <p className="mt-4 text-foreground/85">{circle.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {circle.rooms.map((r) => {
              const Icon = roomIcon[r.kind];
              return (
                <button
                  key={r.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary transition"
                >
                  <Icon className="size-4" style={{ color: circle.accent }} />
                  {r.name}
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {r.kind}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Composer />

        <div className="space-y-4">
          {circle.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {circle.posts.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Noch keine Beiträge in diesem Kreis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
