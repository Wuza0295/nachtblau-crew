import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowBigDown,
  ArrowBigUp,
  Bookmark,
  MessageCircle,
  Repeat2,
  Share2,
  SmilePlus,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type FeedPost = {
  post: {
    id: number;
    content: string;
    mediaUrl: string | null;
    mediaType: string;
    upvoteCount: number | null;
    reactionCount: number | null;
    commentCount: number | null;
    saveCount: number | null;
    createdAt: Date;
    communityId: number | null;
  };
  author: { id: number; name: string | null; avatar: string | null };
  viewerVote: number;
  viewerReaction: string | null;
  viewerSaved: boolean;
};

function initials(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(date: Date) {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `vor ${hrs} Std.`;
  return new Date(date).toLocaleDateString("de-DE");
}

export function PostCard({ item, compact }: { item: FeedPost; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const voteMutation = trpc.social.vote.useMutation({
    onSuccess: () => utils.social.getFeed.invalidate(),
  });
  const reactMutation = trpc.social.react.useMutation({
    onSuccess: () => utils.social.getFeed.invalidate(),
  });
  const saveMutation = trpc.social.toggleSave.useMutation({
    onSuccess: () => utils.social.getFeed.invalidate(),
  });
  const commentMutation = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.social.getComments.invalidate({ postId: item.post.id });
      utils.social.getFeed.invalidate();
    },
  });

  const { data: comments } = trpc.social.getComments.useQuery(
    { postId: item.post.id },
    { enabled: showComments }
  );

  const { data: emojis } = trpc.social.reactionEmojis.useQuery();

  const requireAuth = (fn: () => void) => {
    if (!isAuthenticated) {
      toast.info("Bitte anmelden", {
        description: "Melde dich an, um zu interagieren.",
        action: { label: "Login", onClick: () => (window.location.href = getLoginUrl()) },
      });
      return;
    }
    fn();
  };

  return (
    <Card className="border-border/80 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className={cn("p-4 space-y-3", compact && "p-3")}>
        <div className="flex gap-3">
          <Link href={`/profil/${item.author.id}`}>
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              {item.author.avatar ? (
                <AvatarImage src={item.author.avatar} alt="" />
              ) : (
                <AvatarFallback className="bg-primary/15 text-primary text-sm">
                  {initials(item.author.name)}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profil/${item.author.id}`}
                className="font-semibold text-sm hover:text-primary transition-colors"
              >
                {item.author.name ?? "Nutzer"}
              </Link>
              <span className="text-xs text-muted-foreground">{timeAgo(item.post.createdAt)}</span>
            </div>
            <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap">{item.post.content}</p>
            {item.post.mediaUrl && item.post.mediaType === "image" && (
              <img
                src={item.post.mediaUrl}
                alt=""
                className="mt-3 rounded-lg max-h-80 w-full object-cover border border-border"
              />
            )}
            {item.post.mediaType === "video" && (
              <div className="mt-3 rounded-xl aspect-video bg-gradient-to-br from-violet-600/40 to-cyan-500/30 flex items-center justify-center border border-border">
                <span className="text-sm text-muted-foreground">Pulse-Video-Platzhalter</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/60">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1 h-8", item.viewerVote === 1 && "text-primary bg-primary/10")}
            onClick={() => requireAuth(() => voteMutation.mutate({ postId: item.post.id, value: 1 }))}
          >
            <ArrowBigUp className="h-4 w-4" />
            {item.post.upvoteCount ?? 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1 h-8", item.viewerVote === -1 && "text-destructive")}
            onClick={() => requireAuth(() => voteMutation.mutate({ postId: item.post.id, value: -1 }))}
          >
            <ArrowBigDown className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-8">
                <SmilePlus className="h-4 w-4" />
                {item.post.reactionCount ?? 0}
                {item.viewerReaction ? <span>{item.viewerReaction}</span> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="flex gap-1 p-2">
              {(emojis ?? ["❤️", "🔥", "😂", "💡", "👏", "🎯"]).map((emoji) => (
                <DropdownMenuItem
                  key={emoji}
                  className="text-lg p-2 cursor-pointer"
                  onClick={() =>
                    requireAuth(() =>
                      reactMutation.mutate({
                        postId: item.post.id,
                        emoji: emoji as "❤️" | "🔥" | "😂" | "💡" | "👏" | "🎯",
                      })
                    )
                  }
                >
                  {emoji}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8"
            onClick={() => setShowComments((s) => !s)}
          >
            <MessageCircle className="h-4 w-4" />
            {item.post.commentCount ?? 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1 h-8", item.viewerSaved && "text-amber-400")}
            onClick={() => requireAuth(() => saveMutation.mutate({ postId: item.post.id }))}
          >
            <Bookmark className="h-4 w-4" />
            {item.post.saveCount ?? 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8 ml-auto"
            onClick={() => toast.success("Link kopiert (Demo)")}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => toast.info("Repost — bald mit Zitat")}>
            <Repeat2 className="h-4 w-4" />
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3 pt-2">
            {comments?.map(({ comment, author }) => (
              <div key={comment.id} className="flex gap-2 text-sm">
                <span className="font-medium shrink-0">{author.name ?? "Nutzer"}:</span>
                <span className="text-muted-foreground">{comment.content}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <Textarea
                placeholder="Kommentar…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <Button
                size="sm"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={() =>
                  requireAuth(() =>
                    commentMutation.mutate({ postId: item.post.id, content: commentText.trim() })
                  )
                }
              >
                Senden
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
