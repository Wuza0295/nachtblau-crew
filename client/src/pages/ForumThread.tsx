import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  ChevronLeft,
  Lock,
  Pin,
  Eye,
  MessageCircle,
  Clock,
  Send,
  User,
} from "lucide-react";

function PostCard({
  post,
  author,
  isFirst,
}: {
  post: { id: number; content: string; createdAt: Date };
  author: { id: number; name: string | null; avatar: string | null };
  isFirst?: boolean;
}) {
  const initials = author.name
    ? author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Card
      className={`bg-card border-border ${isFirst ? "border-primary/30 shadow-lg shadow-primary/5" : ""}`}
    >
      <CardContent className="p-5 flex gap-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <Link href={`/profil/${author.id}`}>
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer">
              <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/profil/${author.id}`}>
            <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer text-center max-w-16 line-clamp-1">
              {author.name ?? "Unbekannt"}
            </span>
          </Link>
          {isFirst && (
            <Badge className="text-xs bg-primary/15 text-primary border-primary/20">OP</Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(post.createdAt).toLocaleString("de-DE")}
            </span>
          </div>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ForumThread() {
  const { id } = useParams<{ id: string }>();
  const threadId = parseInt(id ?? "0");
  const { user, isAuthenticated } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const utils = trpc.useUtils();

  const { data: threadData, isLoading: threadLoading } = trpc.forum.getThread.useQuery(
    { id: threadId },
    { enabled: !!threadId }
  );

  const { data: posts, isLoading: postsLoading } = trpc.forum.getPosts.useQuery(
    { threadId },
    { enabled: !!threadId }
  );

  const createPost = trpc.forum.createPost.useMutation({
    onSuccess: () => {
      setReplyContent("");
      utils.forum.getPosts.invalidate({ threadId });
      utils.forum.getThread.invalidate({ id: threadId });
      toast.success("Antwort veröffentlicht!");
    },
    onError: (err) => {
      toast.error(err.message ?? "Fehler beim Posten");
    },
  });

  const handleSubmit = () => {
    if (!replyContent.trim()) return;
    createPost.mutate({ threadId, content: replyContent.trim() });
  };

  if (threadLoading) {
    return (
      <div className="py-12 container space-y-4">
        <div className="h-8 w-64 bg-card rounded animate-pulse" />
        <div className="h-40 bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="py-12 container text-center text-muted-foreground">
        Thread nicht gefunden.
      </div>
    );
  }

  const { thread, author } = threadData;

  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Forum
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{thread.title}</span>
        </div>

        {/* Thread Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            {thread.isPinned && <Pin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
            {thread.isLocked && <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />}
            <h1
              className="text-2xl font-bold text-foreground leading-tight"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {thread.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>von {author.name ?? "Unbekannt"}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(thread.createdAt).toLocaleDateString("de-DE")}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {thread.viewCount} Aufrufe
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {thread.replyCount} Antworten
            </span>
          </div>
        </div>

        {/* Original Post */}
        <PostCard
          post={{ id: thread.id, content: thread.content, createdAt: thread.createdAt }}
          author={author}
          isFirst
        />

        {/* Replies */}
        {postsLoading ? (
          <div className="space-y-3 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          posts && posts.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="divider-glow" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {posts.length} Antwort{posts.length !== 1 ? "en" : ""}
              </h2>
              {posts.map(({ post, author: postAuthor }) => (
                <PostCard key={post.id} post={post} author={postAuthor} />
              ))}
            </div>
          )
        )}

        {/* Reply Form */}
        <div className="mt-8">
          <div className="divider-glow mb-6" />
          {thread.isLocked ? (
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-center text-muted-foreground">
              <Lock className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Dieser Thread ist gesperrt.</p>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Antworten
              </h3>
              <div className="flex gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Schreibe deine Antwort..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="bg-card border-border focus:border-primary/50 min-h-24 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) handleSubmit();
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Strg+Enter zum Senden</span>
                    <Button
                      onClick={handleSubmit}
                      disabled={!replyContent.trim() || createPost.isPending}
                      className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {createPost.isPending ? "Wird gesendet..." : "Antworten"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <User className="h-8 w-8 text-primary mx-auto mb-3 opacity-60" />
              <p className="text-sm text-muted-foreground mb-3">
                Melde dich an, um zu antworten.
              </p>
              <Button
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Jetzt anmelden
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
