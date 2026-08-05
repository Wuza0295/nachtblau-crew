import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import ResonanceBar from "@/components/ResonanceBar";
import type { ResonanceType } from "@shared/social";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.social.post.useQuery({ id }, { enabled: Number.isFinite(id) });
  const [reply, setReply] = useState("");

  const resonate = trpc.social.resonate.useMutation({
    onSuccess: () => utils.social.post.invalidate({ id }),
  });
  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      setReply("");
      utils.social.post.invalidate({ id });
      toast.success("Antwort gesendet");
    },
  });
  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => utils.social.post.invalidate({ id }),
  });

  if (isLoading) {
    return (
      <div className="container py-12 max-w-2xl">
        <div className="h-64 rounded-2xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  if (!data?.post) {
    return (
      <div className="container py-20 text-center">
        <p className="font-display text-2xl font-bold">Beitrag nicht gefunden</p>
        <Link href="/app" className="mt-4 inline-block text-primary hover:underline">
          Zum Feed
        </Link>
      </div>
    );
  }

  const { post, replies } = data;
  const time = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: de });

  return (
    <div className="container py-8 sm:py-10 max-w-2xl">
      <Link
        href="/app"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Feed
      </Link>

      <article className="rounded-2xl border border-border/70 bg-background/80 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/u/${post.author.handle}`} className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: post.author.accent }}
              >
                {post.author.avatar}
              </div>
              <div>
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{post.author.handle} · {time}
                </p>
              </div>
            </Link>
            {!post.isFollowingAuthor && (
              <button
                type="button"
                onClick={() => follow.mutate({ userId: post.authorId })}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                Folgen
              </button>
            )}
          </div>

          {post.title && (
            <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-balance">
              {post.title}
            </h1>
          )}
          <p className="mt-4 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {post.mediaGradient && (
            <div
              className="mt-6 aspect-[16/9] rounded-xl relative overflow-hidden"
              style={{ background: post.mediaGradient }}
            >
              {post.mediaLabel && (
                <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  {post.mediaLabel}
                </span>
              )}
            </div>
          )}

          {post.circle && (
            <Link
              href={`/circles/${post.circle.slug}`}
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              in {post.circle.name}
            </Link>
          )}

          <div className="mt-6 pt-4 border-t border-border/60">
            <ResonanceBar
              sparkCount={post.sparkCount}
              depthCount={post.depthCount}
              echoCount={post.echoCount}
              active={post.myResonance}
              onSelect={(type: ResonanceType | null) =>
                resonate.mutate({ postId: post.id, type })
              }
            />
          </div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold mb-4">
          Antworten · {replies.length}
        </h2>
        <div className="rounded-2xl border border-border/70 bg-background/80 p-4 mb-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Antworte mit Substanz…"
            className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!reply.trim() || create.isPending}
              onClick={() =>
                create.mutate({
                  type: "pulse",
                  content: reply.trim(),
                  parentId: post.id,
                  circleId: post.circleId,
                })
              }
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              Antworten
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {replies.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border/50 bg-background/60 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: r.author.accent }}
                >
                  {r.author.avatar}
                </div>
                <span className="text-sm font-semibold">{r.author.name}</span>
                <span className="text-xs text-muted-foreground">@{r.author.handle}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
