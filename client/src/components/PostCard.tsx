import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import type { PostWithMeta, ResonanceType } from "@shared/social";
import ResonanceBar from "./ResonanceBar";
import { MessageCircle, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  post: PostWithMeta;
  featured?: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  pulse: "Pulse",
  frame: "Frame",
  signal: "Signal",
  moment: "Moment",
};

export default function PostCard({ post, featured }: Props) {
  const utils = trpc.useUtils();
  const resonate = trpc.social.resonate.useMutation({
    onMutate: async ({ postId, type }) => {
      await utils.social.feed.cancel();
      const patch = (list: PostWithMeta[] | undefined) => {
        if (!list) return list;
        return list.map((p) => {
          if (p.id !== postId) return p;
          const next = { ...p };
          const prev = p.myResonance;
          if (prev === "spark") next.sparkCount = Math.max(0, next.sparkCount - 1);
          if (prev === "depth") next.depthCount = Math.max(0, next.depthCount - 1);
          if (prev === "echo") next.echoCount = Math.max(0, next.echoCount - 1);
          next.myResonance = type;
          if (type === "spark") next.sparkCount += 1;
          if (type === "depth") next.depthCount += 1;
          if (type === "echo") next.echoCount += 1;
          return next;
        });
      };
      utils.social.feed.setData({ lens: "pulse" }, (old) => patch(old));
      utils.social.feed.setData({ lens: "orbit" }, (old) => patch(old));
      utils.social.feed.setData({ lens: "depth" }, (old) => patch(old));
      utils.social.feed.setData({ lens: "circles" }, (old) => patch(old));
      utils.social.moments.setData(undefined, (old) => patch(old));
    },
    onSettled: () => {
      utils.social.feed.invalidate();
      utils.social.moments.invalidate();
      utils.social.post.invalidate({ id: post.id });
    },
  });

  const time = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: de,
  });

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-[var(--lyra-foam)]/80 backdrop-blur-sm",
        featured && "ring-1 ring-primary/20"
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/u/${post.author.handle}`} className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ background: post.author.accent }}
            >
              {post.author.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold truncate">{post.author.name}</span>
                {post.author.followerCount > 5000 && (
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                @{post.author.handle} · {time}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[post.type]}
            </span>
            {post.circle && (
              <Link
                href={`/circles/${post.circle.slug}`}
                className="hidden sm:inline rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/15"
              >
                {post.circle.name}
              </Link>
            )}
          </div>
        </div>

        <Link href={`/post/${post.id}`} className="mt-4 block">
          {post.title && (
            <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug text-balance text-[var(--lyra-ink)]">
              {post.title}
            </h3>
          )}
          <p
            className={cn(
              "text-[15px] sm:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap",
              post.title ? "mt-2" : "mt-0",
              post.type === "signal" ? "line-clamp-6" : "line-clamp-5"
            )}
          >
            {post.content}
          </p>
        </Link>

        {post.mediaGradient && (
          <Link href={`/post/${post.id}`} className="mt-4 block overflow-hidden rounded-xl">
            <div
              className="relative aspect-[16/9] w-full transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ background: post.mediaGradient }}
            >
              {post.mediaLabel && (
                <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {post.mediaLabel}
                </span>
              )}
            </div>
          </Link>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <ResonanceBar
            sparkCount={post.sparkCount}
            depthCount={post.depthCount}
            echoCount={post.echoCount}
            active={post.myResonance}
            onSelect={(type: ResonanceType | null) =>
              resonate.mutate({ postId: post.id, type })
            }
          />
          <Link
            href={`/post/${post.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {post.replyCount}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
