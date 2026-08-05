import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Heart, MessageCircle, Bookmark, Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

type PostLike = {
  id: number;
  authorId: number;
  kind: string;
  lenses: string[];
  title?: string | null;
  body: string;
  mediaUrls: string[];
  tags: string[];
  likeCount: number;
  replyCount: number;
  repostCount: number;
  saveCount: number;
  createdAt: string;
  liked: boolean;
  saved: boolean;
  author: {
    id: number;
    handle: string;
    name: string;
    avatarColor: string;
    role: string;
  };
};

export function AvatarOrb({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <div
      className={`${dim} rounded-full grid place-items-center text-white font-semibold shrink-0`}
      style={{ background: color }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function PostCard({ post, compact = false }: { post: PostLike; compact?: boolean }) {
  const utils = trpc.useUtils();
  const likeMut = trpc.social.like.useMutation({
    onSuccess: () => utils.social.feed.invalidate(),
    onError: () => toast.error("Like fehlgeschlagen"),
  });
  const saveMut = trpc.social.save.useMutation({
    onSuccess: () => utils.social.feed.invalidate(),
  });

  const when = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: de });

  return (
    <article className="aether-shell rounded-2xl p-4 sm:p-5 animate-rise">
      <div className="flex gap-3">
        <Link href={`/profil/${post.author.handle}`}>
          <AvatarOrb name={post.author.name} color={post.author.avatarColor} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link href={`/profil/${post.author.handle}`} className="font-semibold hover:underline">
              {post.author.name}
            </Link>
            <span className="text-sm text-muted-foreground">@{post.author.handle}</span>
            <span className="text-xs text-muted-foreground">· {when}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {post.lenses.map((lens) => (
              <span
                key={lens}
                className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
              >
                {lens}
              </span>
            ))}
            <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
              {post.kind}
            </span>
          </div>

          {post.title && (
            <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{post.title}</h3>
          )}
          <p className={`mt-2 text-[15px] leading-relaxed whitespace-pre-wrap ${compact ? "line-clamp-4" : ""}`}>
            {post.body}
          </p>

          {post.mediaUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-2 ${
                post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {post.mediaUrls.slice(0, 4).map((url) => (
                <Link key={url} href={`/post/${post.id}`}>
                  <img
                    src={url}
                    alt=""
                    className={`w-full object-cover rounded-xl ${
                      post.kind === "video" ? "aspect-[9/14] max-h-[420px]" : "aspect-[16/10]"
                    }`}
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-sm text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-1 sm:gap-3 text-muted-foreground">
            <button
              className={`inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-full hover:bg-secondary ${
                post.liked ? "text-rose-600" : ""
              }`}
              onClick={() => likeMut.mutate({ postId: post.id })}
            >
              <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
              {post.likeCount}
            </button>
            <Link
              href={`/post/${post.id}`}
              className="inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-full hover:bg-secondary"
            >
              <MessageCircle className="h-4 w-4" />
              {post.replyCount}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm px-2 py-1">
              <Repeat2 className="h-4 w-4" />
              {post.repostCount}
            </span>
            <button
              className={`inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded-full hover:bg-secondary ml-auto ${
                post.saved ? "text-primary" : ""
              }`}
              onClick={() => saveMut.mutate({ postId: post.id })}
            >
              <Bookmark className={`h-4 w-4 ${post.saved ? "fill-current" : ""}`} />
              {post.saveCount}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
