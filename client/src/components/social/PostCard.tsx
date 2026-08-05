import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, MessageCircle, Share2, Sparkles } from "lucide-react";
import type { FeedMode, PostKind, SocialAuthor } from "@shared/social";

export type FeedPostView = {
  id: string;
  kind: PostKind;
  body: string;
  title?: string | null;
  mediaUrl?: string | null;
  mediaAlt?: string | null;
  topics: string[];
  resonance: number;
  replies: number;
  shares: number;
  crystallized: boolean;
  createdAt: string | Date;
  modeTags: FeedMode[];
  userResonated?: boolean;
  author: SocialAuthor;
};

function kindLabel(kind: PostKind) {
  switch (kind) {
    case "essay":
      return "Essay";
    case "visual":
      return "Visual";
    case "pulse":
      return "Pulse";
    case "moment":
      return "Moment";
    default:
      return "Signal";
  }
}

export function PostCard({
  post,
  onResonate,
  index = 0,
}: {
  post: FeedPostView;
  onResonate?: (id: string) => void;
  index?: number;
}) {
  const created =
    typeof post.createdAt === "string" ? new Date(post.createdAt) : post.createdAt;

  return (
    <article
      className="animate-rise border-b border-border/50 py-6 first:pt-2"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={post.author.avatar} alt={post.author.name} />
          <AvatarFallback>{post.author.name.slice(0, 1)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground">{post.author.name}</span>
            <span className="text-muted-foreground text-sm">@{post.author.handle}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <time className="text-muted-foreground text-sm">
              {formatDistanceToNow(created, { addSuffix: true, locale: de })}
            </time>
            <Badge variant="outline" className="ml-auto text-[10px] uppercase tracking-wider">
              {kindLabel(post.kind)}
            </Badge>
            {post.crystallized && (
              <Badge className="bg-primary/20 text-primary border-0 gap-1">
                <Sparkles className="h-3 w-3" /> Kristall
              </Badge>
            )}
          </header>

          {post.title && (
            <h3 className="font-display text-xl font-semibold leading-snug">{post.title}</h3>
          )}

          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/95">
            {post.body}
          </p>

          {post.mediaUrl && (
            <div className="overflow-hidden rounded-2xl border border-border/40">
              <img
                src={post.mediaUrl}
                alt={post.mediaAlt ?? ""}
                className="w-full max-h-[420px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {post.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.topics.map((t) => (
                <span
                  key={t}
                  className="text-xs text-primary/90 bg-primary/10 rounded-md px-2 py-0.5"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <footer className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${post.userResonated ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => onResonate?.(post.id)}
            >
              <Activity className="h-4 w-4" />
              {post.resonance}
              <span className="sr-only sm:not-sr-only sm:inline text-xs">Resonanz</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {post.replies}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              {post.shares}
            </Button>
          </footer>
        </div>
      </div>
    </article>
  );
}
