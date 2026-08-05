import { UserAvatar } from "./UserAvatar";
import { Link } from "wouter";
import { Bookmark, MessageCircle, Repeat2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { motion } from "framer-motion";

type Author = {
  id: string;
  handle: string;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
};

type Post = {
  id: string;
  kind: string;
  body: string;
  title?: string | null;
  mediaGradient?: string | null;
  mediaLabel?: string | null;
  topics: string[];
  createdAt: string;
  signal: number;
  replies: number;
  echoes: number;
  saves: number;
  reasons?: string[];
  author: Author;
};

type Props = {
  post: Post;
  showReasons?: boolean;
  compact?: boolean;
};

export function PostCard({ post, showReasons, compact }: Props) {
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);
  const [echoed, setEchoed] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const saveMut = trpc.social.toggleSave.useMutation({
    onSuccess: (r) => {
      setSaved(r.saved);
      utils.social.feed.invalidate();
    },
  });
  const echoMut = trpc.social.toggleEcho.useMutation({
    onSuccess: (r) => {
      setEchoed(r.echoed);
      utils.social.feed.invalidate();
    },
  });

  const time = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: de,
  });

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border-b border-border/70 py-5 transition-colors",
        !compact && "hover:bg-card/40"
      )}
    >
      <div className="flex gap-3 px-1 sm:px-2">
        <Link href={`/u/${post.author.handle}`}>
          <UserAvatar
            initials={post.author.avatarInitials}
            color={post.author.avatarColor}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link href={`/u/${post.author.handle}`} className="font-semibold hover:underline">
              {post.author.displayName}
            </Link>
            <span className="text-sm text-muted-foreground">@{post.author.handle}</span>
            <span className="text-sm text-muted-foreground">· {time}</span>
            {post.kind === "depth" && (
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tide">
                Depth
              </span>
            )}
            {post.kind === "spark" && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                Spark
              </span>
            )}
          </div>

          <Link href={`/post/${post.id}`} className="mt-2 block">
            {post.title && (
              <h3 className="font-display text-xl font-semibold leading-snug text-balance">
                {post.title}
              </h3>
            )}
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90",
                compact && "line-clamp-3"
              )}
            >
              {post.body}
            </p>
          </Link>

          {post.mediaGradient && (
            <div
              className="mt-3 overflow-hidden rounded-2xl"
              style={{ background: post.mediaGradient, minHeight: compact ? 120 : 180 }}
            >
              <div className="flex h-full min-h-[inherit] items-end p-4">
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {post.mediaLabel ?? "Media"}
                </span>
              </div>
            </div>
          )}

          {post.topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1 text-muted-foreground">
            <Link
              href={`/post/${post.id}`}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              {post.replies}
            </Link>
            <button
              type="button"
              onClick={() => echoMut.mutate({ postId: post.id })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm hover:bg-muted",
                echoed && "text-tide"
              )}
            >
              <Repeat2 className="h-4 w-4" />
              {post.echoes + (echoed ? 1 : 0)}
            </button>
            <button
              type="button"
              onClick={() => saveMut.mutate({ postId: post.id })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm hover:bg-muted",
                saved && "text-coral"
              )}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
              {post.saves + (saved ? 1 : 0)}
            </button>
            <span
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-bold text-tide"
              title="Signal-Score: Qualität aus Dialogen & Saves"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {post.signal}
            </span>
            {showReasons && post.reasons && (
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Warum?
              </button>
            )}
          </div>

          {showWhy && post.reasons && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2 space-y-1 rounded-xl bg-muted/70 px-3 py-2 text-xs text-muted-foreground"
            >
              {post.reasons.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>
    </motion.article>
  );
}
