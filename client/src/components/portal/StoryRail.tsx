import { trpc } from "@/lib/trpc";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function StoryRail() {
  const { data: stories } = trpc.social.getStories.useQuery(undefined, {
    staleTime: 60_000,
  });

  const grouped = new Map<number, (typeof stories extends (infer U)[] | undefined ? U : never)>();
  for (const s of stories ?? []) {
    if (!grouped.has(s.author.id)) grouped.set(s.author.id, s);
  }

  const items = Array.from(grouped.values());

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-3 pb-2 px-1">
        <Link href="/erstellen?type=story">
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] group"
          >
            <div className="h-[68px] w-[68px] rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center group-hover:border-primary transition-colors duration-200">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              Deine Story
            </span>
          </button>
        </Link>
        {items.map(({ author, post }) => (
          <button
            key={author.id}
            type="button"
            className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]"
          >
            <div className="story-ring p-[3px] rounded-full">
              <Avatar className="h-[62px] w-[62px] border-2 border-background">
                {post.mediaUrl ? (
                  <img src={post.mediaUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback>{author.name?.[0] ?? "?"}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <span className="text-[10px] truncate w-full text-center">{author.name?.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
