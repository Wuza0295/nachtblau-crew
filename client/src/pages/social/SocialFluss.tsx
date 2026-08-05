import PostCard from "@/components/social/PostCard";
import SocialShell from "@/components/social/SocialShell";
import { trpc } from "@/lib/trpc";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRef } from "react";

export default function SocialFluss() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = trpc.social.getFeed.useQuery({
    mode: "loops",
    maxIntensity: 5,
    limit: 30,
  });

  return (
    <SocialShell>
      <div className="py-4 max-w-lg mx-auto">
        <p
          className="text-center text-lg font-semibold mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Fluss
        </p>
        <p className="text-center text-xs text-muted-foreground mb-4">
          Vertikaler Short-Modus — TikTok-Reels-Energie, ein Tap weiter
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="h-[calc(100vh-8rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth max-w-lg mx-auto rounded-2xl border border-white/10"
        >
          {data?.posts.map((post) => (
            <div
              key={post.id}
              className="snap-start min-h-[calc(100vh-8rem)] flex items-center p-2"
            >
              <PostCard post={post} />
            </div>
          ))}
          {data?.posts.length === 0 && (
            <p className="text-center text-muted-foreground py-24">Noch keine Fluss-Posts</p>
          )}
          <div className="snap-start flex flex-col items-center py-8 text-muted-foreground">
            <ChevronDown className="h-6 w-6 animate-bounce" />
            <span className="text-xs">Weiterscrollen</span>
          </div>
        </div>
      )}
    </SocialShell>
  );
}
