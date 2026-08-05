import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PostCard from "@/components/PostCard";
import { useParams } from "wouter";

export default function Circles() {
  const circles = trpc.social.circles.useQuery();

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold">Circles</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Discord-Nähe und Reddit-Themen — Communities mit Channels, Regeln und geteilter Kultur.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        {circles.data?.map((circle) => (
          <Link key={circle.id} href={`/circles/${circle.slug}`}>
            <div className="aether-shell rounded-2xl p-5 h-full hover:border-primary/40 transition-colors border border-transparent">
              <div
                className="h-1.5 w-16 rounded-full mb-4"
                style={{ background: circle.accent }}
              />
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {circle.topic}
              </div>
              <h2 className="font-display text-2xl font-semibold mt-1">{circle.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {circle.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{circle.memberCount.toLocaleString("de-DE")} Mitglieder</span>
                <span className="text-primary">{circle.channels.length} Channels →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CircleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const circle = trpc.social.circle.useQuery({ slug }, { enabled: Boolean(slug) });
  const utils = trpc.useUtils();
  const join = trpc.social.joinCircle.useMutation({
    onSuccess: () => {
      toast.success("Circle beigetreten");
      utils.social.circle.invalidate({ slug });
    },
  });

  if (circle.isLoading) return <div className="container py-8">Lade Circle…</div>;
  if (!circle.data) return <div className="container py-8">Circle nicht gefunden.</div>;

  const c = circle.data;

  return (
    <div className="container py-8">
      <Link href="/circles" className="text-sm text-muted-foreground hover:text-foreground">
        ← Alle Circles
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{c.topic}</div>
          <h1 className="font-display text-4xl font-bold mt-1">{c.name}</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">{c.description}</p>
        </div>
        <Button className="rounded-full" onClick={() => join.mutate({ slug })}>
          Beitreten
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {c.channels.map((ch) => (
          <span
            key={ch.id}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground"
          >
            #{ch.name}
            <span className="ml-1 text-muted-foreground">· {ch.kind}</span>
          </span>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {c.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {c.posts.length === 0 && (
          <p className="text-muted-foreground">Noch keine Posts in diesem Circle.</p>
        )}
      </div>
    </div>
  );
}
