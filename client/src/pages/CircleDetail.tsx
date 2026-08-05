import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import PostCard from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radio } from "lucide-react";

export default function CircleDetail() {
  const params = useParams<{ slug: string }>();
  const utils = trpc.useUtils();
  const { data: circle, isLoading } = trpc.social.circle.useQuery(
    { slug: params.slug ?? "" },
    { enabled: Boolean(params.slug) }
  );
  const toggle = trpc.social.toggleJoin.useMutation({
    onSuccess: () => {
      utils.social.circle.invalidate({ slug: params.slug ?? "" });
      utils.social.circles.invalidate();
    },
  });

  if (isLoading) {
    return <div className="container py-12 text-muted-foreground">Lade Kreis…</div>;
  }
  if (!circle) {
    return (
      <div className="container py-12">
        <p>Kreis nicht gefunden.</p>
        <Link href="/kreise" className="text-primary">
          Zurück
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img src={circle.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="container -mt-16 relative pb-12">
        <Link
          href="/kreise"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Kreise
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">{circle.name}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{circle.description}</p>
          </div>
          <Button
            className="rounded-full"
            variant={circle.joined ? "secondary" : "default"}
            onClick={() => toggle.mutate({ circleId: circle.id })}
          >
            {circle.joined ? "Mitglied" : "Beitreten"}
          </Button>
        </div>

        {circle.rooms.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {circle.rooms.map((r) => (
              <div
                key={r.id}
                className="mist-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
              >
                <Radio className="h-4 w-4 text-primary animate-soft-pulse" />
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">· {r.listeners}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 space-y-4">
          {circle.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
