import { ComposeBox } from "@/components/social/ComposeBox";
import { PostCard } from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function Pulse() {
  const { data } = trpc.social.getFeed.useQuery({
    mode: "discover",
    postKind: "pulse",
    limit: 20,
  });
  const [index, setIndex] = useState(0);
  const items = data ?? [];
  const current = items[index];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      <div className="container py-6 max-w-lg">
        <h1 className="text-2xl font-bold gradient-text">Pulse</h1>
        <p className="text-sm text-muted-foreground mt-1">
          TikTok-Reels-Energie, fokussiert auf einen Clip — swipe mit den Pfeilen.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-4">
        <div className="w-full max-w-md min-h-[420px] flex items-center">
          {current ? (
            <PostCard item={current} compact />
          ) : (
            <p className="text-muted-foreground text-center w-full">Noch keine Pulse-Posts.</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled={index <= 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={index >= items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container max-w-lg pb-10">
        <ComposeBox
          postKind="pulse"
          placeholder="Kurzes Pulse-Update (Text; Video-Upload folgt)…"
        />
      </div>
    </div>
  );
}
