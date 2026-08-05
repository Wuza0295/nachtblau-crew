import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Repeat2,
  Waves,
} from "lucide-react";
import type { MiraUser, Post, PostKind, Circle } from "@shared/mira";

type EnrichedPost = Post & {
  author: MiraUser;
  circle?: Circle;
};

const KIND_LABEL: Record<PostKind, string> = {
  signal: "Signal",
  frame: "Frame",
  pulse: "Pulse",
  truth: "Truth",
};

function formatRelativeLocal(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} T.`;
}

export function PostCard({
  post,
  onResonate,
  onSave,
  compact = false,
}: {
  post: EnrichedPost;
  onResonate?: () => void;
  onSave?: () => void;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "glass rounded-2xl overflow-hidden fade-up",
        compact ? "p-3" : "p-0"
      )}
    >
      <div className={cn("flex gap-3", compact ? "" : "p-4 pb-3")}>
        <Link href={`/profil/${post.author.id}`}>
          <img
            src={post.author.avatar}
            alt=""
            className="size-10 rounded-full bg-secondary shrink-0"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profil/${post.author.id}`}
              className="font-medium text-sm hover:underline"
            >
              {post.author.name}
            </Link>
            <span className="text-muted-foreground text-xs">
              @{post.author.handle}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <time className="text-muted-foreground text-xs">
              {formatRelativeLocal(post.createdAt)}
            </time>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full",
                post.kind === "truth"
                  ? "bg-[var(--mira-gold)]/25 text-[var(--mira-ink)]"
                  : post.kind === "pulse"
                    ? "bg-[var(--mira-jade)]/15 text-[var(--mira-jade)]"
                    : "bg-secondary text-muted-foreground"
              )}
            >
              {KIND_LABEL[post.kind]}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {post.facet}
            </span>
            {post.circle && (
              <Link
                href={`/circles/${post.circle.slug}`}
                className="text-[10px] text-[var(--mira-jade)] hover:underline"
              >
                #{post.circle.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={cn(compact ? "mt-2" : "px-4")}>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>
      </div>

      {post.mediaUrl && (
        <div className={cn(compact ? "mt-3" : "mt-3 px-4")}>
          <div
            className={cn(
              "relative overflow-hidden rounded-xl bg-secondary",
              post.kind === "pulse" ? "aspect-[9/12] max-h-[420px]" : "aspect-[4/5] max-h-[480px]"
            )}
          >
            <img
              src={post.mediaUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            {post.kind === "pulse" && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                <span className="text-white text-xs font-medium inline-flex items-center gap-1">
                  <Waves className="size-3.5" /> Pulse
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className={cn("flex flex-wrap gap-1.5", compact ? "mt-2" : "px-4 mt-3")}>
          {post.tags.map((t) => (
            <span
              key={t}
              className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-1 text-muted-foreground",
          compact ? "mt-3 pt-2 border-t border-border/50" : "px-2 py-2 mt-2"
        )}
      >
        <button
          type="button"
          onClick={onResonate}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm hover:bg-secondary transition-colors",
            post.resonated && "text-[var(--mira-jade)]"
          )}
        >
          <Waves className={cn("size-4", post.resonated && "fill-current")} />
          {post.resonance}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm hover:bg-secondary"
        >
          <MessageCircle className="size-4" />
          {post.replies}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm hover:bg-secondary"
        >
          <Repeat2 className="size-4" />
          {post.echoes}
        </button>
        <button
          type="button"
          onClick={onSave}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm hover:bg-secondary",
            post.saved && "text-[var(--mira-jade)]"
          )}
        >
          {post.saved ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </button>
      </div>
    </article>
  );
}
