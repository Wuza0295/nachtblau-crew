import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

const REACTIONS = [
  { kind: "love" as const, emoji: "❤️", label: "Love" },
  { kind: "fire" as const, emoji: "🔥", label: "Fire" },
  { kind: "insight" as const, emoji: "💡", label: "Insight" },
  { kind: "celebrate" as const, emoji: "🎉", label: "Celebrate" },
  { kind: "support" as const, emoji: "🤝", label: "Support" },
];

type Props = {
  postId: number;
  reactionCount: number;
  commentCount: number;
  myReaction: (typeof REACTIONS)[number]["kind"] | null;
};

export default function ReactionBar({ postId, reactionCount, commentCount, myReaction }: Props) {
  const utils = trpc.useUtils();
  const react = trpc.social.react.useMutation({
    onSuccess: () => {
      void utils.social.getFeed.invalidate();
      void utils.social.getFlashes.invalidate();
    },
    onError: () => toast.error("Anmeldung nötig für Reaktionen"),
  });

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTIONS.map(({ kind, emoji, label }) => (
        <Button
          key={kind}
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 px-2 rounded-full text-base transition-all duration-150 ${
            myReaction === kind
              ? "bg-primary/20 ring-1 ring-primary/40 scale-105"
              : "hover:bg-muted/80 opacity-80 hover:opacity-100"
          }`}
          title={label}
          onClick={() => react.mutate({ postId, kind })}
        >
          {emoji}
        </Button>
      ))}
      <span className="text-xs text-muted-foreground ml-1 tabular-nums">{reactionCount}</span>
      <Button variant="ghost" size="sm" className="ml-auto h-8 gap-1.5 text-muted-foreground rounded-full">
        <MessageCircle className="h-4 w-4" />
        <span className="text-xs tabular-nums">{commentCount}</span>
      </Button>
    </div>
  );
}
