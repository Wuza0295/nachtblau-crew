import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowBigUp, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function CircleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.social.circle.useQuery(
    { slug },
    { enabled: Boolean(slug) }
  );
  const upvote = trpc.social.upvoteThread.useMutation({
    onSuccess: () => utils.social.circle.invalidate({ slug }),
  });
  const toggle = trpc.social.toggleJoinCircle.useMutation({
    onSuccess: () => utils.social.circle.invalidate({ slug }),
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-20 text-center space-y-4">
        <p className="text-muted-foreground">Circle nicht gefunden.</p>
        <Button asChild variant="secondary">
          <Link href="/circles">Zurück</Link>
        </Button>
      </div>
    );
  }

  const { circle, threads } = data;

  return (
    <div>
      <div className="relative h-48 md:h-64">
        <img src={circle.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/20" />
        <div className="container relative h-full flex flex-col justify-end pb-6">
          <Link
            href="/circles"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Circles
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">{circle.name}</h1>
              <p className="text-muted-foreground mt-1 max-w-xl">{circle.description}</p>
            </div>
            <Button
              variant={circle.isJoined ? "secondary" : "default"}
              onClick={() => toggle.mutate({ id: circle.id })}
            >
              {circle.isJoined ? "Beigetreten" : "Beitreten"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-3xl space-y-4">
        <div className="flex flex-wrap gap-2 mb-6">
          {circle.channels.map((ch) => (
            <Badge key={ch.id} variant="outline" className="gap-1">
              {ch.name}
              <span className="opacity-50 text-[10px] uppercase">{ch.kind}</span>
            </Badge>
          ))}
        </div>

        <h2 className="font-display text-lg font-semibold">Threads</h2>
        <p className="text-sm text-muted-foreground -mt-2 mb-4">
          Asynchron & suchbar — die Reddit-Seite des Circles.
        </p>

        {threads.map((t) => (
          <article
            key={t.id}
            className="flex gap-3 border border-border/40 rounded-2xl p-4 bg-secondary/10"
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 px-2 text-primary shrink-0"
              onClick={() => upvote.mutate({ id: t.id })}
            >
              <ArrowBigUp className="h-5 w-5" />
              <span className="text-xs font-semibold">{t.upvotes}</span>
            </Button>
            <div className="min-w-0 space-y-2">
              <h3 className="font-display font-semibold text-lg leading-snug">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>@{t.author.handle}</span>
                <span>
                  {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true, locale: de })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {t.replies}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
