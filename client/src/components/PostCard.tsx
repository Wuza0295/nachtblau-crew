import { formatScore } from "@shared/social";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  MessageCircle,
  Repeat2,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type EnrichedPost = {
  id: number;
  kind: string;
  mood: string;
  title?: string | null;
  body: string;
  mediaGradient?: string | null;
  tags: string[];
  createdAt: string;
  resonance: { reacts: number; replies: number; saves: number; shares: number };
  score: number;
  author: {
    id: number;
    handle: string;
    name: string;
    avatarGradient: string;
    verified?: boolean;
  };
  circle?: { id: number; name: string; slug: string; accent: string } | null;
};

export function Avatar({
  gradient,
  name,
  size = "md",
}: {
  gradient: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-16 text-xl" : "size-11 text-sm";
  return (
    <div
      className={cn(
        "rounded-full grid place-items-center font-display font-bold text-white shrink-0 shadow-sm",
        dim
      )}
      style={{ background: gradient }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </div>
  );
}

export function PostCard({
  post,
  featured = false,
}: {
  post: EnrichedPost;
  featured?: boolean;
}) {
  const utils = trpc.useUtils();
  const resonate = trpc.social.resonate.useMutation({
    onSuccess: () => {
      utils.social.feed.invalidate();
    },
  });

  const onResonate = (type: "reacts" | "saves" | "shares") => {
    resonate.mutate({ postId: post.id, type });
  };

  return (
    <article
      className={cn(
        "rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm transition-shadow hover:shadow-md animate-rise",
        featured && "ring-1 ring-primary/20",
        post.kind === "pulse" && "overflow-hidden p-0"
      )}
    >
      {post.kind === "pulse" ? (
        <div className="relative min-h-[420px] flex flex-col justify-end text-white">
          <div
            className="absolute inset-0"
            style={{ background: post.mediaGradient ?? undefined }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative p-5 space-y-4">
            <Header post={post} light />
            <p className="text-lg font-medium leading-snug">{post.body}</p>
            <Actions post={post} onResonate={onResonate} light />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Header post={post} />
          {post.title && (
            <h3 className="font-display text-xl font-bold leading-tight">{post.title}</h3>
          )}
          <p
            className={cn(
              "text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90",
              post.kind === "longform" && "text-base"
            )}
          >
            {post.body}
          </p>
          {post.mediaGradient && (
            <div
              className="h-52 rounded-2xl border border-border/50"
              style={{ background: post.mediaGradient }}
            />
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <Actions post={post} onResonate={onResonate} />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {formatScore(post.score)} Resonanz
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

function Header({ post, light }: { post: EnrichedPost; light?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Link href={`/u/${post.author.handle}`}>
        <Avatar gradient={post.author.avatarGradient} name={post.author.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/u/${post.author.handle}`}
            className={cn("font-semibold hover:underline", light && "text-white")}
          >
            {post.author.name}
          </Link>
          {post.author.verified && (
            <BadgeCheck className={cn("size-4", light ? "text-teal-200" : "text-primary")} />
          )}
          <span className={cn("text-sm", light ? "text-white/70" : "text-muted-foreground")}>
            @{post.author.handle}
          </span>
          <span className={cn("text-sm", light ? "text-white/50" : "text-muted-foreground")}>
            ·{" "}
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: de,
            })}
          </span>
        </div>
        {post.circle && (
          <Link
            href={`/kreise/${post.circle.slug}`}
            className="text-xs font-medium mt-0.5 inline-block"
            style={{ color: light ? "#99f6e4" : post.circle.accent }}
          >
            in {post.circle.name}
          </Link>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md",
          light ? "bg-white/15 text-white" : "bg-secondary text-muted-foreground"
        )}
      >
        {post.kind}
      </span>
    </div>
  );
}

function Actions({
  post,
  onResonate,
  light,
}: {
  post: EnrichedPost;
  onResonate: (t: "reacts" | "saves" | "shares") => void;
  light?: boolean;
}) {
  const btn = cn(
    "inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-2 py-1.5 transition",
    light
      ? "text-white/85 hover:bg-white/10"
      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
  );
  return (
    <div className="flex items-center gap-1">
      <button className={btn} onClick={() => onResonate("reacts")}>
        <Sparkles className="size-4" />
        {formatScore(post.resonance.reacts)}
      </button>
      <button className={btn}>
        <MessageCircle className="size-4" />
        {formatScore(post.resonance.replies)}
      </button>
      <button className={btn} onClick={() => onResonate("shares")}>
        <Repeat2 className="size-4" />
        {formatScore(post.resonance.shares)}
      </button>
      <button className={btn} onClick={() => onResonate("saves")}>
        <Bookmark className="size-4" />
        {formatScore(post.resonance.saves)}
      </button>
    </div>
  );
}
