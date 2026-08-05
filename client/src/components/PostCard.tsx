import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Bookmark, MessageCircle, Radio, Share2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Author = {
  id: number;
  name: string | null;
  handle?: string | null;
  avatar: string | null;
};

type SpaceRef = {
  id: number;
  name: string;
  slug: string;
  tone: string | null;
} | null;

type PostData = {
  id: number;
  format: "pulse" | "frame" | "depth" | "moment";
  title: string | null;
  content: string;
  mediaUrl: string | null;
  mediaAlt: string | null;
  visibility: string;
  resonateCount: number;
  saveCount: number;
  amplifyCount: number;
  commentCount: number;
  isEphemeral: boolean;
  expiresAt: Date | string | null;
  createdAt: Date | string;
  author: Author;
  space: SpaceRef;
  myReactions?: string[];
};

const FORMAT_LABEL: Record<PostData["format"], string> = {
  pulse: "Puls",
  frame: "Bild",
  depth: "Tiefe",
  moment: "Moment",
};

export function PostCard({ post, compact }: { post: PostData; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const react = trpc.post.react.useMutation({
    onSuccess: () => {
      utils.feed.get.invalidate();
      utils.post.get.invalidate({ id: post.id });
      utils.profile.get.invalidate();
    },
    onError: () => toast.error("Reaktion fehlgeschlagen"),
  });

  const handleReact = (type: "resonate" | "save" | "amplify") => {
    if (!isAuthenticated) {
      toast.message("Anmelden, um zu reagieren", {
        action: { label: "Login", onClick: () => (window.location.href = getLoginUrl()) },
      });
      return;
    }
    react.mutate({ postId: post.id, type });
  };

  const created =
    typeof post.createdAt === "string" ? new Date(post.createdAt) : post.createdAt;
  const my = new Set(post.myReactions ?? []);

  return (
    <article
      className={cn(
        "animate-rise border-b border-border/70 py-6 first:pt-2",
        post.format === "moment" && "bg-secondary/30 -mx-4 px-4 rounded-2xl border-b-0 mb-2"
      )}
    >
      <header className="flex items-start gap-3 mb-3">
        <Link href={`/profil/${post.author.id}`}>
          <img
            src={post.author.avatar ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${post.author.id}`}
            alt=""
            className="h-10 w-10 rounded-full bg-muted object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link
              href={`/profil/${post.author.id}`}
              className="font-medium hover:underline truncate"
            >
              {post.author.name}
            </Link>
            {post.author.handle && (
              <span className="text-sm text-muted-foreground">@{post.author.handle}</span>
            )}
            <span className="text-sm text-muted-foreground">·</span>
            <time className="text-sm text-muted-foreground">
              {formatDistanceToNow(created, { addSuffix: true, locale: de })}
            </time>
          </div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">{FORMAT_LABEL[post.format]}</span>
            {post.space && (
              <Link href={`/raeume/${post.space.slug}`} className="hover:text-foreground">
                · {post.space.name}
              </Link>
            )}
            {post.isEphemeral && <span className="text-accent-foreground/80">· verfällt</span>}
          </div>
        </div>
      </header>

      <Link href={`/beitrag/${post.id}`} className="block group">
        {post.title && (
          <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        )}
        <p
          className={cn(
            "text-[15px] leading-relaxed whitespace-pre-wrap",
            compact && post.format === "depth" && "line-clamp-4"
          )}
        >
          {post.content}
        </p>
        {post.mediaUrl && (
          <div className="mt-4 -mx-1 overflow-hidden rounded-xl">
            <img
              src={post.mediaUrl}
              alt={post.mediaAlt ?? ""}
              className="w-full max-h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        )}
      </Link>

      <footer className="flex items-center gap-1 mt-4 -ml-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 text-muted-foreground", my.has("resonate") && "text-primary")}
          onClick={() => handleReact("resonate")}
        >
          <Radio size={16} />
          <span className="tabular-nums text-xs">{post.resonateCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 text-muted-foreground", my.has("save") && "text-primary")}
          onClick={() => handleReact("save")}
        >
          <Bookmark size={16} />
          <span className="tabular-nums text-xs">{post.saveCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 text-muted-foreground", my.has("amplify") && "text-primary")}
          onClick={() => handleReact("amplify")}
        >
          <Share2 size={16} />
          <span className="tabular-nums text-xs">{post.amplifyCount}</span>
        </Button>
        <Link href={`/beitrag/${post.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <MessageCircle size={16} />
            <span className="tabular-nums text-xs">{post.commentCount}</span>
          </Button>
        </Link>
      </footer>
    </article>
  );
}
