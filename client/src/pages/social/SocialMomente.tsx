import SocialShell from "@/components/social/SocialShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const GRADIENTS: Record<string, string> = {
  aurora: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  neon: "linear-gradient(135deg, #f953c6 0%, #b91d73 100%)",
};

export default function SocialMomente() {
  const { isAuthenticated } = useAuth();
  const { data: stories, isLoading } = trpc.social.getStories.useQuery();
  const utils = trpc.useUtils();
  const viewMut = trpc.social.viewStory.useMutation({
    onSuccess: () => toast.success("Moment angesehen"),
  });
  const createMut = trpc.social.createStory.useMutation({
    onSuccess: () => {
      toast.success("Moment veröffentlicht (24h)");
      utils.social.getStories.invalidate();
    },
  });

  const publishDemo = () => {
    if (!isAuthenticated) {
      toast.message("Anmelden", { description: "Momente brauchen ein Konto." });
      return;
    }
    createMut.mutate({
      mediaUrl: "gradient:aurora",
      caption: "Mein Moment ✨",
      gradientStyle: "aurora",
    });
  };

  return (
    <SocialShell>
      <div className="py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Momente
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Instagram-Stories — 24 Stunden, Reaktionen, direkter Chat-Flow (UI folgt).
            </p>
          </div>
          <Button
            className="rounded-full"
            onClick={publishDemo}
            disabled={createMut.isPending}
          >
            Moment teilen
          </Button>
        </div>

        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        ) : (
          <div className="grid gap-4">
            {stories?.map(({ story, author, viewed }) => {
              const style = story.gradientStyle ?? "aurora";
              return (
                <button
                  key={story.id}
                  type="button"
                  className="relative h-48 rounded-2xl overflow-hidden text-left border border-white/10 transition-transform duration-200 active:scale-[0.99]"
                  style={{ background: GRADIENTS[style] ?? GRADIENTS.aurora }}
                  onClick={() => {
                    if (isAuthenticated) viewMut.mutate({ storyId: story.id });
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative p-4 h-full flex flex-col justify-end">
                    <p className="font-semibold text-white drop-shadow">
                      {author.name}
                    </p>
                    {story.caption && (
                      <p className="text-sm text-white/90">{story.caption}</p>
                    )}
                    <p className="text-[10px] text-white/70 mt-1">
                      {viewed ? "Gesehen" : "Neu"} · läuft ab{" "}
                      {new Date(story.expiresAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                </button>
              );
            })}
            {!stories?.length && (
              <p className="text-center text-muted-foreground py-12">Keine aktiven Momente</p>
            )}
          </div>
        )}
      </div>
    </SocialShell>
  );
}
