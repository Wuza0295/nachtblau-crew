import { SIGNAL_TYPES, type SignalType } from "@shared/brand";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type EnrichedPost = {
  id: string;
  lens: string;
  body: string;
  mediaUrl?: string | null;
  mediaAlt?: string | null;
  createdAt: string;
  signals: Record<SignalType, number>;
  comments: number;
  tags: string[];
  mySignals: SignalType[];
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  } | null;
  circle: { id: string; name: string; slug: string } | null;
};

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export default function PostCard({
  post,
  compact,
}: {
  post: EnrichedPost;
  compact?: boolean;
}) {
  const utils = trpc.useUtils();
  const signal = trpc.social.signal.useMutation({
    onSuccess: () => {
      utils.social.feed.invalidate();
      utils.social.post.invalidate({ id: post.id });
    },
  });

  return (
    <article
      className={cn(
        "mist-panel rounded-2xl p-5 transition-shadow hover:shadow-md",
        compact && "p-4"
      )}
    >
      <header className="flex items-start gap-3">
        <Link href={`/profil/${post.author?.handle ?? ""}`}>
          <Avatar className="h-11 w-11 ring-2 ring-background">
            <AvatarImage src={post.author?.avatar} alt={post.author?.displayName} />
            <AvatarFallback>{post.author?.displayName?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link href={`/profil/${post.author?.handle ?? ""}`}>
              <span className="font-semibold hover:underline">
                {post.author?.displayName}
              </span>
            </Link>
            {post.author?.verified && (
              <span className="text-xs text-primary" title="Verifiziert">
                ●
              </span>
            )}
            <span className="text-sm text-muted-foreground">@{post.author?.handle}</span>
            <span className="text-muted-foreground">·</span>
            <time className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: de,
              })}
            </time>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5 capitalize">{post.lens}</span>
            {post.circle && (
              <Link href={`/kreise/${post.circle.slug}`}>
                <span className="rounded-full bg-accent/30 px-2 py-0.5 text-accent-foreground hover:bg-accent/50">
                  {post.circle.name}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <Link href={`/beitrag/${post.id}`}>
        <p
          className={cn(
            "mt-4 whitespace-pre-wrap text-[15px] leading-relaxed",
            compact ? "line-clamp-4" : ""
          )}
        >
          {post.body}
        </p>
      </Link>

      {post.mediaUrl && (
        <Link href={`/beitrag/${post.id}`}>
          <div
            className={cn(
              "mt-4 overflow-hidden rounded-xl",
              post.lens === "stream" ? "aspect-[9/14] max-h-[420px]" : "aspect-[4/3] max-h-[360px]"
            )}
          >
            <img
              src={post.mediaUrl}
              alt={post.mediaAlt ?? ""}
              className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-primary">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-1 border-t border-border/70 pt-3">
        {SIGNAL_TYPES.map((s) => {
          const active = post.mySignals.includes(s.id);
          return (
            <Button
              key={s.id}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full gap-1.5 text-xs",
                active && "bg-primary/10 text-primary"
              )}
              title={s.hint}
              onClick={() => signal.mutate({ postId: post.id, signal: s.id })}
            >
              <span aria-hidden>{s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatCount(post.signals[s.id])}
              </span>
            </Button>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.comments}
        </span>
      </footer>
    </article>
  );
}
