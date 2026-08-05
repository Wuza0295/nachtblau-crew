import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactionBar from "./ReactionBar";
import { Sparkles, Zap, Radio, BookOpen } from "lucide-react";

export type FeedPost = {
  post: {
    id: number;
    type: "wave" | "flash" | "moment" | "story";
    content: string | null;
    mediaUrl: string | null;
    mediaAspect: "square" | "portrait" | "landscape" | null;
    momentPrompt: string | null;
    reactionCount: number | null;
    commentCount: number | null;
    createdAt: Date;
  };
  author: {
    id: number;
    name: string | null;
    avatar: string | null;
    handle: string | null;
  };
  circle?: { id: number; name: string; slug: string } | null;
  myReaction?: "love" | "fire" | "insight" | "celebrate" | "support" | null;
};

const TYPE_META = {
  wave: { label: "Wave", icon: Radio, className: "bg-primary/15 text-primary" },
  flash: { label: "Flash", icon: Zap, className: "bg-accent/20 text-accent-foreground" },
  moment: { label: "Moment", icon: Sparkles, className: "bg-[oklch(0.55_0.16_160/0.25)] text-[oklch(0.85_0.08_160)]" },
  story: { label: "Story", icon: BookOpen, className: "bg-muted text-muted-foreground" },
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PostCard({ item }: { item: FeedPost }) {
  const meta = TYPE_META[item.post.type];
  const Icon = meta.icon;
  const aspectClass =
    item.post.mediaAspect === "portrait"
      ? "aspect-[9/16] max-h-[420px]"
      : item.post.mediaAspect === "landscape"
        ? "aspect-video"
        : "aspect-square max-h-80";

  return (
    <Card className="portal-card overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm">
      <div className="p-4 pb-3 flex items-start gap-3">
        <Link href={`/profil/${item.author.id}`}>
          <Avatar className="h-10 w-10 ring-2 ring-border/80">
            {item.author.avatar ? (
              <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/15 text-primary text-sm">
                {initials(item.author.name)}
              </AvatarFallback>
            )}
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/profil/${item.author.id}`}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {item.author.name ?? "Anonym"}
            </Link>
            {item.author.handle && (
              <span className="text-xs text-muted-foreground">@{item.author.handle}</span>
            )}
            <Badge variant="outline" className={`text-[10px] gap-1 border-0 ${meta.className}`}>
              <Icon className="h-3 w-3" />
              {meta.label}
            </Badge>
            {item.circle?.slug && (
              <Link href={`/kreise/${item.circle.slug}`}>
                <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-secondary/80">
                  {item.circle.name}
                </Badge>
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(item.post.createdAt), { addSuffix: true, locale: de })}
          </p>
        </div>
      </div>

      {item.post.type === "moment" && item.post.momentPrompt && (
        <div className="px-4 pb-2">
          <p className="text-xs italic text-muted-foreground border-l-2 border-primary/50 pl-3">
            {item.post.momentPrompt}
          </p>
        </div>
      )}

      {item.post.content && (
        <div className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap portal-hashtag">
          {item.post.content.split(/(#[\w\u00C0-\u024F]+)/g).map((part, i) =>
            part.startsWith("#") ? (
              <Link key={i} href={`/entdecken?q=${encodeURIComponent(part.slice(1))}`} className="text-primary hover:underline">
                {part}
              </Link>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      )}

      {item.post.mediaUrl && (
        <div className={`mx-4 mb-3 rounded-xl overflow-hidden bg-muted ${aspectClass}`}>
          <img src={item.post.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="px-4 pb-4">
        <ReactionBar
          postId={item.post.id}
          reactionCount={item.post.reactionCount ?? 0}
          commentCount={item.post.commentCount ?? 0}
          myReaction={item.myReaction ?? null}
        />
      </div>
    </Card>
  );
}
