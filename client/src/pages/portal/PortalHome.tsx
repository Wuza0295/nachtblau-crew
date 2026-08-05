import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import PortalShell from "./PortalShell";
import type { ContentLayer, FeedView } from "@shared/socialPortal";
import {
  LAYER_META,
  REACTION_META,
  SEED_AUTHORS,
  type ReactionKind,
  type SocialPost,
} from "@shared/socialPortal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  MessageSquare,
  Share2,
  Bookmark,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

function authorFor(id: string) {
  return SEED_AUTHORS.find((a) => a.id === id);
}

export default function PortalHome() {
  const [view, setView] = useState<FeedView>("pulse");
  const [layer, setLayer] = useState<ContentLayer>("all");
  const [sort, setSort] = useState<"trending" | "new" | "boosted">("trending");
  const [pulseIndex, setPulseIndex] = useState(0);

  const { data: posts, refetch } = trpc.socialPortal.feed.useQuery({
    layer,
    sort,
    view,
  });
  const { data: communities } = trpc.socialPortal.communities.useQuery();
  const { data: stories } = trpc.socialPortal.stories.useQuery();

  const pulsePosts = useMemo(
    () => (posts ?? []).filter((p) => p.format === "clip" || p.mediaUrl),
    [posts]
  );
  const displayPulse = pulsePosts.length ? pulsePosts : (posts ?? []);

  return (
    <PortalShell activeView={view} onViewChange={setView}>
      <div className="flex flex-col flex-1 pb-20 lg:pb-4">
        <StoriesRow stories={stories ?? []} />

        <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-white/5">
          <LayerTabs layer={layer} onLayer={setLayer} />
          <div className="flex-1" />
          <SortTabs sort={sort} onSort={setSort} />
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "pulse" && (
              <PulseView
                key="pulse"
                posts={displayPulse}
                index={pulseIndex}
                onIndex={setPulseIndex}
                onReact={() => refetch()}
              />
            )}
            {view === "canvas" && (
              <CanvasView key="canvas" posts={posts ?? []} onReact={() => refetch()} />
            )}
            {view === "signal" && (
              <SignalView key="signal" posts={posts ?? []} onPosted={() => refetch()} />
            )}
            {view === "circles" && (
              <CirclesView key="circles" communities={communities ?? []} posts={posts ?? []} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </PortalShell>
  );
}

function StoriesRow({
  stories,
}: {
  stories: { id: string; authorId: string; previewLabel: string; seen: boolean }[];
}) {
  const markSeen = trpc.socialPortal.markStorySeen.useMutation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="px-4 py-4 overflow-x-auto flex gap-4 border-b border-white/5 scrollbar-hide">
      <button
        type="button"
        className="flex flex-col items-center gap-1 shrink-0"
        onClick={() => toast.info("Eigene Momente — nach Login verfügbar")}
      >
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-violet-400/50 flex items-center justify-center text-2xl">
          +
        </div>
        <span className="text-[10px] text-muted-foreground">Dein Moment</span>
      </button>
      {stories.map((s) => {
        const author = authorFor(s.authorId);
        return (
          <button
            key={s.id}
            type="button"
            className="flex flex-col items-center gap-1 shrink-0"
            onClick={() => {
              if (isAuthenticated) markSeen.mutate({ storyId: s.id });
              toast.message(s.previewLabel, {
                description: `24h Moment von ${author?.displayName ?? "Creator"}`,
              });
            }}
          >
            <div
              className={cn(
                "h-16 w-16 rounded-full p-0.5",
                s.seen
                  ? "bg-white/20"
                  : "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400"
              )}
            >
              <div
                className={cn(
                  "h-full w-full rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br",
                  author?.avatarGradient ?? "from-gray-600 to-gray-800"
                )}
              >
                {author?.displayName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <span className="text-[10px] max-w-[64px] truncate">{s.previewLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function LayerTabs({
  layer,
  onLayer,
}: {
  layer: ContentLayer;
  onLayer: (l: ContentLayer) => void;
}) {
  const tabs: ContentLayer[] = ["all", "social", "professional", "creative"];
  const labels: Record<ContentLayer, string> = {
    all: "Alle Schichten",
    social: LAYER_META.social.label,
    professional: LAYER_META.professional.label,
    creative: LAYER_META.creative.label,
  };
  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map((t) => (
        <Button
          key={t}
          size="sm"
          variant={layer === t ? "default" : "ghost"}
          className={cn(
            "h-8 text-xs rounded-full",
            layer === t && "bg-violet-600 hover:bg-violet-600"
          )}
          onClick={() => onLayer(t)}
        >
          {labels[t]}
        </Button>
      ))}
    </div>
  );
}

function SortTabs({
  sort,
  onSort,
}: {
  sort: "trending" | "new" | "boosted";
  onSort: (s: "trending" | "new" | "boosted") => void;
}) {
  const items = [
    { id: "trending" as const, label: "Trend", icon: TrendingUp },
    { id: "new" as const, label: "Neu", icon: Clock },
    { id: "boosted" as const, label: "Boost", icon: BarChart3 },
  ];
  return (
    <div className="flex gap-1">
      {items.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          size="sm"
          variant={sort === id ? "secondary" : "ghost"}
          className="h-8 text-xs gap-1"
          onClick={() => onSort(id)}
        >
          <Icon className="h-3 w-3" />
          {label}
        </Button>
      ))}
    </div>
  );
}

function PulseView({
  posts,
  index,
  onIndex,
  onReact,
}: {
  posts: SocialPost[];
  index: number;
  onIndex: (i: number) => void;
  onReact: () => void;
}) {
  const post = posts[index % Math.max(posts.length, 1)];
  if (!post) {
    return (
      <div className="h-[70vh] flex items-center justify-center text-muted-foreground">
        Keine Clips in dieser Schicht — wechsle die Filter.
      </div>
    );
  }

  const author = authorFor(post.authorId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative h-[calc(100vh-220px)] min-h-[480px] max-w-lg mx-auto"
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-black">
        {post.mediaUrl && (
          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 pr-20">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold",
              author?.avatarGradient
            )}
          >
            {author?.displayName.slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-sm">{author?.displayName}</p>
            <p className="text-xs text-white/70">@{author?.handle}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed line-clamp-4">{post.body}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {post.tags.map((t) => (
            <span key={t} className="text-xs text-violet-200">
              #{t}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-white/50 mt-2">
          Community-Score: {post.communityScore.toLocaleString("de-DE")}
        </p>
      </div>

      <div className="absolute right-4 bottom-24 flex flex-col gap-4 items-center">
        <ReactionStack post={post} onReact={onReact} vertical />
        <ActionIcon icon={MessageSquare} count={post.commentCount} />
        <ActionIcon icon={Bookmark} count={post.saveCount} />
        <ActionIcon icon={Share2} count={post.shareCount} />
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full bg-white/10"
          onClick={() => onIndex(Math.max(0, index - 1))}
        >
          <ChevronUp className="h-5 w-5 rotate-180" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full bg-white/10"
          onClick={() => onIndex(index + 1)}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}

function CanvasView({
  posts,
  onReact,
}: {
  posts: SocialPost[];
  onReact: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-240px)]"
    >
      {posts.map((post) => {
        const author = authorFor(post.authorId);
        const img =
          post.mediaUrl ??
          post.collectionItems?.[0]?.imageUrl ??
          "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&q=80";
        return (
          <article
            key={post.id}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10"
          >
            <img src={img} alt="" className="w-full h-full object-cover transition group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition p-3 flex flex-col justify-end">
              <p className="text-xs font-medium line-clamp-2">{post.body}</p>
              <p className="text-[10px] text-white/70 mt-1">@{author?.handle}</p>
            </div>
            {post.format === "collection" && (
              <Badge className="absolute top-2 left-2 bg-black/60 text-[10px]">Sammlung</Badge>
            )}
          </article>
        );
      })}
      <div className="col-span-full py-4">
        <ReactionBar post={posts[0]} onReact={onReact} />
      </div>
    </motion.div>
  );
}

function SignalView({
  posts,
  onPosted,
}: {
  posts: SocialPost[];
  onPosted: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [postLayer, setPostLayer] = useState<"social" | "professional" | "creative">("social");
  const create = trpc.socialPortal.createThought.useMutation({
    onSuccess: () => {
      setText("");
      onPosted();
      toast.success("Signal gesendet");
    },
    onError: () => toast.error("Anmeldung erforderlich"),
  });

  const signalPosts = posts.filter(
    (p) => p.format === "thought" || p.format === "thread" || p.format === "poll"
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]"
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <Textarea
          placeholder="Was denkst du? Max. 500 Zeichen — Mikro-Signal oder Thread-Start."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[100px] bg-black/20 border-white/10 resize-none"
        />
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1">
            {(["social", "professional", "creative"] as const).map((l) => (
              <Button
                key={l}
                size="sm"
                variant={postLayer === l ? "secondary" : "ghost"}
                className="text-xs h-7"
                onClick={() => setPostLayer(l)}
              >
                {LAYER_META[l].label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-500"
            disabled={!text.trim() || create.isPending}
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = getLoginUrl();
                return;
              }
              create.mutate({ body: text, layer: postLayer });
            }}
          >
            Senden
          </Button>
        </div>
      </div>

      {signalPosts.map((post) => (
        <SignalCard key={post.id} post={post} onPosted={onPosted} />
      ))}
    </motion.div>
  );
}

function SignalCard({ post, onPosted }: { post: SocialPost; onPosted: () => void }) {
  const author = authorFor(post.authorId);
  const vote = trpc.socialPortal.votePoll.useMutation({ onSuccess: () => onPosted() });
  const { isAuthenticated } = useAuth();
  const totalVotes =
    post.poll?.options.reduce((s, o) => s + o.votes, 0) ?? 0;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <header className="flex gap-3 mb-3">
        <div
          className={cn(
            "h-10 w-10 rounded-full bg-gradient-to-br shrink-0 flex items-center justify-center text-xs font-bold",
            author?.avatarGradient
          )}
        >
          {author?.displayName.slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-sm flex items-center gap-1">
            {author?.displayName}
            {author?.verified && (
              <span className="text-violet-400 text-[10px]">✓</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            @{author?.handle} ·{" "}
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: de })}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] h-6">
          {LAYER_META[post.layer].label}
        </Badge>
      </header>
      {post.title && <p className="font-semibold mb-2">{post.title}</p>}
      <p className="text-sm whitespace-pre-line text-foreground/90">{post.body}</p>

      {post.poll && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{post.poll.question}</p>
          {post.poll.options.map((opt) => {
            const pct = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <button
                key={opt.id}
                type="button"
                className="w-full text-left relative rounded-lg overflow-hidden border border-white/10 hover:border-violet-400/40 transition"
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = getLoginUrl();
                    return;
                  }
                  vote.mutate({ postId: post.id, optionId: opt.id });
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-violet-500/25"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative px-3 py-2 flex justify-between text-sm">
                  <span>{opt.label}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/5">
        <ReactionBar post={post} onReact={onPosted} />
      </div>
    </article>
  );
}

function CirclesView({
  communities,
  posts,
}: {
  communities: {
    id: string;
    name: string;
    slug: string;
    description: string;
    memberCount: number;
    onlineCount: number;
    icon: string;
  }[];
  posts: SocialPost[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 grid lg:grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-240px)]"
    >
      {communities.map((c) => {
        const top = posts
          .filter((p) => p.communityId === c.id)
          .sort((a, b) => b.communityScore - a.communityScore)[0];
        return (
          <div
            key={c.id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                <p className="text-[11px] text-violet-300 mt-2">
                  {c.memberCount.toLocaleString("de-DE")} Mitglieder · {c.onlineCount} online
                </p>
              </div>
            </div>
            {top && (
              <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">Top Boost</p>
                <p className="text-sm line-clamp-2">{top.body}</p>
                <p className="text-xs text-violet-300 mt-1">Score {top.communityScore}</p>
              </div>
            )}
            <Button variant="secondary" size="sm" className="mt-4 w-full">
              Beitreten
            </Button>
          </div>
        );
      })}
    </motion.div>
  );
}

function ActionIcon({
  icon: Icon,
  count,
}: {
  icon: typeof MessageSquare;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-white">
      <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center backdrop-blur">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px]">{count > 999 ? `${(count / 1000).toFixed(1)}k` : count}</span>
    </div>
  );
}

function ReactionStack({
  post,
  onReact,
  vertical,
}: {
  post: SocialPost;
  onReact: () => void;
  vertical?: boolean;
}) {
  const top = (Object.entries(post.reactions) as [ReactionKind, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)[0];
  if (!top) return null;
  const meta = REACTION_META[top[0]];
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center",
        vertical && "text-white"
      )}
      onClick={() => onReact()}
    >
      <span className="text-2xl">{meta.emoji}</span>
      <span className="text-[10px]">{top[1]}</span>
    </button>
  );
}

function ReactionBar({ post, onReact }: { post?: SocialPost; onReact: () => void }) {
  const { isAuthenticated } = useAuth();
  const react = trpc.socialPortal.react.useMutation({ onSuccess: () => onReact() });
  if (!post) return null;

  const kinds = Object.keys(REACTION_META) as ReactionKind[];

  return (
    <div className="flex flex-wrap gap-1">
      {kinds.map((kind) => {
        const meta = REACTION_META[kind];
        const count = post.reactions[kind];
        return (
          <Button
            key={kind}
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 px-2"
            title={meta.description}
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = getLoginUrl();
                return;
              }
              react.mutate({ postId: post.id, kind });
            }}
          >
            <span>{meta.emoji}</span>
            <span className="text-muted-foreground">{count > 0 ? count : meta.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
