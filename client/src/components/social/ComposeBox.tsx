import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  postKind?: "feed" | "pulse" | "moment";
  communityId?: number;
  placeholder?: string;
  onSuccess?: () => void;
};

export function ComposeBox({
  postKind = "feed",
  communityId,
  placeholder = "Was möchtest du teilen?",
  onSuccess,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  const createPost = trpc.social.createPost.useMutation({
    onSuccess: () => {
      setContent("");
      utils.social.getFeed.invalidate();
      utils.social.getTodayMoment.invalidate();
      onSuccess?.();
      toast.success("Veröffentlicht");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <Card className="p-4 border-dashed border-primary/30 bg-primary/5">
        <p className="text-sm text-muted-foreground mb-3">
          Melde dich an, um Beiträge zu erstellen und der Community beizutreten.
        </p>
        <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
          Anmelden
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-border/80 bg-card/90">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={cn("min-h-[100px] resize-none border-0 shadow-none focus-visible:ring-0 p-0")}
      />
      <div className="flex justify-end mt-3 pt-3 border-t border-border/60">
        <Button
          size="sm"
          className="gap-2"
          disabled={!content.trim() || createPost.isPending}
          onClick={() =>
            createPost.mutate({
              content: content.trim(),
              communityId,
              postKind,
              mediaType: "none",
            })
          }
        >
          <Send className="h-4 w-4" />
          Posten
        </Button>
      </div>
    </Card>
  );
}
