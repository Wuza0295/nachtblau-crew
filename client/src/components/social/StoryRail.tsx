import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const GRADIENTS: Record<string, string> = {
  aurora: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  neon: "linear-gradient(135deg, #f953c6 0%, #b91d73 100%)",
};

function StoryBubble({
  name,
  viewed,
  gradient,
  onClick,
}: {
  name: string;
  viewed: boolean;
  gradient: string;
  onClick?: () => void;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] group"
    >
      <div
        className={cn(
          "p-[2px] rounded-full transition-transform duration-200 group-active:scale-95",
          viewed
            ? "bg-muted"
            : "bg-gradient-to-tr from-[oklch(0.72_0.2_25)] via-[oklch(0.65_0.22_310)] to-[oklch(0.55_0.18_260)]"
        )}
      >
        <div
          className="h-14 w-14 rounded-full border-2 border-background flex items-center justify-center overflow-hidden"
          style={{ background: gradient }}
        >
          <span className="text-xs font-bold text-white drop-shadow">{initials}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground truncate max-w-full">{name.split(" ")[0]}</span>
    </button>
  );
}

export default function StoryRail({ onOpenStory }: { onOpenStory?: (storyId: number) => void }) {
  const { data: stories } = trpc.social.getStories.useQuery();

  const grouped = useMemo(() => {
    if (!stories?.length) return [];
    const map = new Map<
      number,
      { authorName: string; viewed: boolean; storyId: number; gradient: string }
    >();
    for (const row of stories) {
      if (map.has(row.author.id)) continue;
      const style = row.story.gradientStyle ?? "aurora";
      map.set(row.author.id, {
        authorName: row.author.name ?? "User",
        viewed: row.viewed,
        storyId: row.story.id,
        gradient: GRADIENTS[style] ?? GRADIENTS.aurora,
      });
    }
    return Array.from(map.values());
  }, [stories]);

  if (grouped.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {grouped.map((s) => (
        <StoryBubble
          key={s.storyId}
          name={s.authorName}
          viewed={s.viewed}
          gradient={s.gradient}
          onClick={() => onOpenStory?.(s.storyId)}
        />
      ))}
      <div className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] opacity-60">
        <Avatar className="h-[58px] w-[58px] border border-dashed border-white/20">
          <AvatarFallback className="text-[10px]">+</AvatarFallback>
        </Avatar>
        <span className="text-[10px]">Dein Moment</span>
      </div>
    </div>
  );
}
