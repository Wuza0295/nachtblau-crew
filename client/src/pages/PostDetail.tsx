import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [comment, setComment] = useState("");

  const { data, isLoading } = trpc.feed.getPost.useQuery({ id }, { enabled: Number.isFinite(id) });
  const comments = trpc.feed.comments.useQuery({ postId: id }, { enabled: Number.isFinite(id) });
  const addComment = trpc.feed.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      utils.feed.comments.invalidate({ postId: id });
      utils.feed.getPost.invalidate({ id });
      toast.success("Kommentar gesendet");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-16 text-center">
        <p>Post nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Pulse
      </Link>

      <PostCard item={data} />

      {data.post.type === "signal" && data.post.mediaUrl && (
        <img
          src={data.post.mediaUrl}
          alt=""
          className="rounded-2xl w-full max-h-[480px] object-cover"
        />
      )}

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg">Gespräch</h2>

        {isAuthenticated ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              addComment.mutate({ postId: id, content: comment.trim() });
            }}
          >
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Antworten…"
              rows={3}
            />
            <Button
              type="submit"
              className="self-end"
              disabled={addComment.isPending || !comment.trim()}
            >
              Senden
            </Button>
          </form>
        ) : (
          <Button asChild variant="outline">
            <a href={getLoginUrl()}>Anmelden zum Kommentieren</a>
          </Button>
        )}

        <div className="space-y-3">
          {comments.data?.map((row) => {
            const initials = (row.author.name ?? "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const created =
              typeof row.comment.createdAt === "string"
                ? new Date(row.comment.createdAt)
                : row.comment.createdAt;
            return (
              <div key={row.comment.id} className="atmosphere-panel rounded-xl p-4 flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">{row.author.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {formatDistanceToNow(created, { addSuffix: true, locale: de })}
                    </span>
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{row.comment.content}</p>
                </div>
              </div>
            );
          })}
          {!comments.isLoading && comments.data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Kommentare — starte das Gespräch.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
