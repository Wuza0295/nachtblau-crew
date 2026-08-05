import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PULSE_TOPICS, RESONANCE_LABELS } from "@shared/site";
import { MessageCircle, Bookmark, Waves } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type FeedPost = {
  post: {
    id: number;
    type: "text" | "image" | "essay" | "signal";
    title: string | null;
    content: string;
    mediaUrl: string | null;
    topic: string;
    resonanceScore: number;
    commentCount: number;
    isAiLabeled: boolean | null;
    createdAt: Date | string;
  };
  author: {
    id: number;
    name: string | null;
    handle: string | null;
    avatar: string | null;
  };
  circle: {
    id: number | null;
    name: string | null;
    slug: string | null;
  } | null;
};

export function PostCard({ item, compact = false }: { item: FeedPost; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const resonate = trpc.feed.resonate.useMutation({
    onSuccess: () => {
      utils.feed.get.invalidate();
      utils.feed.getPost.invalidate();
    },
  });

  const topic = PULSE_TOPICS.find((t) => t.id === item.post.topic);
  const initials = (item.author.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const created =
    typeof item.post.createdAt === "string"
      ? new Date(item.post.createdAt)
      : item.post.createdAt;

  const onResonate = (weight: 1 | 2 | 3) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    resonate.mutate({ postId: item.post.id, weight });
    toast.success(`Resonanz: ${RESONANCE_LABELS[weight]}`);
  };

  return (
    <article className="atmosphere-panel rounded-2xl overflow-hidden reveal-up">
      {item.post.mediaUrl && item.post.type !== "signal" && (
        <Link href={`/post/${item.post.id}`}>
          <div className="aspect-[21/9] overflow-hidden bg-muted">
            <img
              src={item.post.mediaUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
        </Link>
      )}

      <div className={`p-5 ${compact ? "sm:p-5" : "sm:p-6"} space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <Link href={`/profil/${item.author.id}`} className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate leading-tight">
                {item.author.name ?? "Anonym"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {item.author.handle ? `@${item.author.handle}` : ""}
                {" · "}
                {formatDistanceToNow(created, { addSuffix: true, locale: de })}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.post.type === "essay" && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                Essay
              </Badge>
            )}
            {item.post.isAiLabeled && (
              <Badge variant="outline" className="text-[10px]">
                KI gekennzeichnet
              </Badge>
            )}
            {topic && (
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary"
                style={{ background: `oklch(0.95 0.03 ${topic.hue})` }}
              >
                {topic.label}
              </Badge>
            )}
          </div>
        </div>

        {item.circle?.slug && (
          <Link
            href={`/circles/${item.circle.slug}`}
            className="text-xs font-medium text-primary/80 hover:text-primary"
          >
            ○ {item.circle.name}
          </Link>
        )}

        <Link href={`/post/${item.post.id}`} className="block space-y-2 group">
          {item.post.title && (
            <h3 className="font-display text-xl font-bold leading-snug group-hover:text-primary transition-colors">
              {item.post.title}
            </h3>
          )}
          <p
            className={`text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap ${
              compact ? "line-clamp-4" : item.post.type === "essay" ? "" : "line-clamp-6"
            }`}
          >
            {item.post.content}
          </p>
        </Link>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-1">
            {([1, 2, 3] as const).map((w) => (
              <Button
                key={w}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                onClick={() => onResonate(w)}
                disabled={resonate.isPending}
              >
                <Waves className="h-3.5 w-3.5" style={{ opacity: 0.4 + w * 0.2 }} />
                {RESONANCE_LABELS[w]}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground ml-1 tabular-nums">
              {item.post.resonanceScore}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Link href={`/post/${item.post.id}`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                <MessageCircle className="h-3.5 w-3.5" />
                {item.post.commentCount}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toast.message("Auf Board speichern — unter Boards anlegen")}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
