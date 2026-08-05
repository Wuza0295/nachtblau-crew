import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import ReactionBar from "@/components/portal/ReactionBar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp } from "lucide-react";

export default function Flashes() {
  const { data: flashes, isLoading } = trpc.social.getFlashes.useQuery({ limit: 30 });
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const h = el.clientHeight;
      const idx = Math.round(el.scrollTop / h);
      setActiveIndex(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-3.5rem)] flex items-center justify-center pb-16 md:pb-0">
        <Skeleton className="h-full w-full max-w-md rounded-none" />
      </div>
    );
  }

  const items = flashes ?? [];

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] pb-16 md:pb-0 bg-black">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
      >
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground snap-start">
            Noch keine Flashes — erstelle einen kurzen visuellen Post.
          </div>
        ) : (
          items.map((item, i) => (
            <section
              key={item.post.id}
              className="h-full snap-start relative flex items-end justify-center"
            >
              {item.post.mediaUrl && (
                <img
                  src={item.post.mediaUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
              <div className="relative z-10 w-full max-w-lg px-5 pb-24 space-y-3">
                <p className="font-semibold text-white drop-shadow">{item.author.name}</p>
                {item.post.content && (
                  <p className="text-white/90 text-sm leading-relaxed">{item.post.content}</p>
                )}
                <div className="rounded-xl bg-black/40 backdrop-blur-md p-2">
                  <ReactionBar
                    postId={item.post.id}
                    reactionCount={item.post.reactionCount ?? 0}
                    commentCount={item.post.commentCount ?? 0}
                    myReaction={item.myReaction ?? null}
                  />
                </div>
              </div>
            </section>
          ))
        )}
      </div>
      {items.length > 1 && (
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-2 text-white/60 text-xs items-center">
          <ChevronUp className="h-4 w-4" />
          {activeIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
}
