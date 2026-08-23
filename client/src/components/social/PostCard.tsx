import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  Flame,
  Heart,
  Lightbulb,
  Laugh,
  MessageCircle,
  Repeat2,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Post = {
  id: number;
  postType: string;
  content: string;
  mediaUrls: string[];
  pollOptions: string[];
  topicTags: string[];
  repostCount: number | null;
  commentCount: number | null;
  createdAt: Date;
  author: {
    id: number;
    name: string | null;
    handle: string | null;
    avatar: string | null;
  } | null;
  community: { name: string; slug: string } | null;
  reactionCounts: Record<string, number>;
  viewerReaction: string | null;
  viewerBookmarked: boolean;
};

const REACTIONS = [
  { type: "heart", icon: Heart, label: "Heart" },
  { type: "fire", icon: Flame, label: "Fire" },
  { type: "insight", icon: Lightbulb, label: "Insight" },
  { type: "support", icon: ThumbsUp, label: "Support" },
  { type: "laugh", icon: Laugh, label: "Laugh" },
] as const;

function totalReactions(counts: Record<string, number>) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export default function PostCard({ post }: { post: Post }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: pollData } = trpc.social.getPollResults.useQuery(
    { postId: post.id },
    { enabled: post.postType === "poll" }
  );
  const { data: comments } = trpc.social.getComments.useQuery(
    { postId: post.id },
    { enabled: showComments }
  );

  const reactMut = trpc.social.react.useMutation({
    onSuccess: () => utils.social.getFeed.invalidate(),
  });
  const bookmarkMut = trpc.social.bookmark.useMutation({
    onSuccess: () => utils.social.getFeed.invalidate(),
  });
  const repostMut = trpc.social.repost.useMutation({
    onSuccess: () => {
      toast.success("Geteilt — Repost im Feed");
      utils.social.getFeed.invalidate();
    },
  });
  const voteMut = trpc.social.votePoll.useMutation({
    onSuccess: () => {
      utils.social.getPollResults.invalidate({ postId: post.id });
    },
  });
  const commentMut = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.social.getComments.invalidate({ postId: post.id });
      utils.social.getFeed.invalidate();
    },
  });

  const authorName = post.author?.name ?? "Anonym";
  const handle = post.author?.handle ? `@${post.author.handle}` : "";
  const initials = authorName.slice(0, 2).toUpperCase();

  const requireAuth = (fn: () => void) => {
    if (!isAuthenticated) {
      toast.message("Anmelden", { description: "Melde dich an, um zu interagieren." });
      return;
    }
    fn();
  };

  const pollTotal =
    pollData?.counts.reduce((s, c) => s + c.count, 0) ?? 0;

  return (
    <article className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-sm overflow-hidden transition-shadow duration-200 hover:shadow-lg hover:shadow-black/20">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-sm truncate">{authorName}</span>
              {handle && (
                <span className="text-xs text-muted-foreground truncate">{handle}</span>
              )}
              {post.community && (
                <Badge variant="secondary" className="text-[10px] rounded-full">
                  {post.community.name}
                </Badge>
              )}
              {post.postType === "spark" && (
                <Badge className="text-[10px] rounded-full gap-1 bg-[oklch(0.55_0.2_310)]">
                  <Sparkles className="h-3 w-3" /> Fluss
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {new Date(post.createdAt).toLocaleString("de-DE")}
            </p>
          </div>
        </div>

        {post.postType === "article" ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <Streamdown>{post.content}</Streamdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {post.mediaUrls.length > 0 && (
          <div
            className={cn(
              "grid gap-2 rounded-xl overflow-hidden",
              post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {post.mediaUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="w-full object-cover max-h-64 bg-muted"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {post.postType === "poll" && post.pollOptions.length > 0 && (
          <div className="space-y-2">
            {post.pollOptions.map((opt, idx) => {
              const count =
                pollData?.counts.find((c) => c.optionIndex === idx)?.count ?? 0;
              const pct = pollTotal > 0 ? (count / pollTotal) * 100 : 0;
              const selected = pollData?.yourVote === idx;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={voteMut.isPending}
                  onClick={() =>
                    requireAuth(() =>
                      voteMut.mutate({ postId: post.id, optionIndex: idx })
                    )
                  }
                  className={cn(
                    "w-full text-left rounded-xl border px-3 py-2 relative overflow-hidden transition-colors duration-200",
                    selected
                      ? "border-[oklch(0.65_0.22_310)] bg-[oklch(0.65_0.22_310/0.15)]"
                      : "border-white/10 hover:bg-white/5"
                  )}
                >
                  <Progress value={pct} className="absolute inset-0 h-full opacity-20 rounded-xl" />
                  <div className="relative flex justify-between text-sm">
                    <span>{opt}</span>
                    <span className="text-muted-foreground text-xs">{Math.round(pct)}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {post.topicTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.topicTags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 px-2 py-2 flex flex-wrap items-center gap-1">
        <div className="flex items-center gap-0.5 mr-auto">
          {REACTIONS.map(({ type, icon: Icon }) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 rounded-full text-xs gap-1",
                post.viewerReaction === type && "text-[oklch(0.75_0.18_310)] bg-white/10"
              )}
              onClick={() =>
                requireAuth(() =>
                  reactMut.mutate({
                    postId: post.id,
                    reactionType: type,
                  })
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {(post.reactionCounts[type] ?? 0) > 0 && post.reactionCounts[type]}
            </Button>
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            {totalReactions(post.reactionCounts)} Reaktionen
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full gap-1"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {post.commentCount ?? 0}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full gap-1"
          onClick={() => requireAuth(() => repostMut.mutate({ postId: post.id }))}
        >
          <Repeat2 className="h-3.5 w-3.5" />
          {post.repostCount ?? 0}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 rounded-full",
            post.viewerBookmarked && "text-[oklch(0.75_0.18_310)]"
          )}
          onClick={() => requireAuth(() => bookmarkMut.mutate({ postId: post.id }))}
        >
          <Bookmark className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showComments && (
        <div className="border-t border-white/5 p-4 space-y-3 bg-black/20">
          {comments?.map(({ comment, author }) => (
            <div key={comment.id} className="flex gap-2 text-sm">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">
                  {(author.name ?? "?").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-xs">{author.name}</span>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
          {isAuthenticated && (
            <div className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Kommentar…"
                className="min-h-[60px] text-sm"
              />
              <Button
                size="sm"
                className="self-end rounded-full"
                disabled={!commentText.trim() || commentMut.isPending}
                onClick={() => commentMut.mutate({ postId: post.id, content: commentText })}
              >
                Senden
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
