import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.post.get.useQuery({ id }, { enabled: Number.isFinite(id) });
  const [text, setText] = useState("");
  const comment = trpc.post.comment.useMutation({
    onSuccess: () => {
      setText("");
      utils.post.get.invalidate({ id });
      toast.success("Kommentar gesendet");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="container max-w-xl py-10 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-24 text-center text-muted-foreground">
        Beitrag nicht gefunden. <Link href="/feed" className="underline">Zurück zum Feed</Link>
      </div>
    );
  }

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-xl py-8">
        <PostCard post={data.post} />

        <section className="mt-8 pt-6 border-t border-border">
          <h2 className="font-display text-lg font-semibold mb-4">
            Gespräch · {data.comments.length}
          </h2>

          {isAuthenticated ? (
            <form
              className="mb-8 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                comment.mutate({ postId: id, content: text.trim() });
              }}
            >
              <Textarea
                placeholder="Antworten statt nur liken…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
              <Button type="submit" size="sm" className="rounded-full" disabled={comment.isPending}>
                Antworten
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              <a href={getLoginUrl()} className="underline">
                Anmelden
              </a>
              , um mitzureden.
            </p>
          )}

          <ul className="space-y-5">
            {data.comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <img
                  src={c.author.avatar ?? ""}
                  alt=""
                  className="h-8 w-8 rounded-full bg-muted"
                />
                <div>
                  <div className="flex gap-2 items-baseline text-sm">
                    <Link href={`/profil/${c.author.id}`} className="font-medium hover:underline">
                      {c.author.name}
                    </Link>
                    <time className="text-muted-foreground text-xs">
                      {formatDistanceToNow(
                        typeof c.createdAt === "string" ? new Date(c.createdAt) : c.createdAt,
                        { addSuffix: true, locale: de }
                      )}
                    </time>
                  </div>
                  <p className="text-[15px] mt-1 leading-relaxed">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
