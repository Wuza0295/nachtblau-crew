import { ComposeBox } from "@/components/social/ComposeBox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, Circle } from "lucide-react";
import { toast } from "sonner";

const STORY_GRADIENTS: Record<string, string> = {
  aurora: "from-violet-600 via-fuchsia-500 to-cyan-400",
  sunset: "from-orange-500 via-rose-500 to-purple-600",
  forest: "from-emerald-600 to-lime-500",
};

export default function Momente() {
  const { isAuthenticated } = useAuth();
  const { data: stories } = trpc.social.getStories.useQuery();
  const { data: todayMoment } = trpc.social.getTodayMoment.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createStory = trpc.social.createStory.useMutation({
    onSuccess: () => {
      toast.success("Story ist 24 Stunden sichtbar");
    },
  });

  return (
    <div className="container py-8 max-w-3xl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold gradient-text">Momente</h1>
        <p className="text-muted-foreground mt-2">
          Instagram-Stories (24h) plus ein echter Tages-Moment — BeReal-Authentizität ohne
          Zwang-Benachrichtigung (Demo).
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Circle className="h-4 w-4 text-primary fill-primary" />
          Stories
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {isAuthenticated && (
            <button
              type="button"
              className="shrink-0 w-24 flex flex-col items-center gap-2"
              onClick={() =>
                createStory.mutate({
                  caption: "Meine Story",
                  backgroundStyle: "forest",
                })
              }
            >
              <div className="w-20 h-28 rounded-2xl border-2 border-dashed border-primary/50 flex items-center justify-center bg-muted/30">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Neu</span>
            </button>
          )}
          {stories?.map(({ story, author }) => (
            <div key={story.id} className="shrink-0 w-24 flex flex-col items-center gap-2">
              <div
                className={`w-20 h-28 rounded-2xl bg-gradient-to-br p-[2px] ${STORY_GRADIENTS[story.backgroundStyle ?? "aurora"] ?? STORY_GRADIENTS.aurora}`}
              >
                <div className="w-full h-full rounded-[14px] bg-card/90 flex flex-col items-center justify-end p-2 text-center">
                  <span className="text-[10px] line-clamp-3">{story.caption}</span>
                </div>
              </div>
              <span className="text-xs truncate w-full text-center">{author.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Echter Moment (1× pro Tag)</h2>
        {todayMoment ? (
          <Card className="p-6 border-primary/30 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-2">Dein Moment heute</p>
            <p className="whitespace-pre-wrap">{todayMoment.post.content}</p>
          </Card>
        ) : isAuthenticated ? (
          <ComposeBox
            postKind="moment"
            placeholder="Ungefiltert: Was passiert gerade wirklich? (nur einmal täglich)"
          />
        ) : (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Melde dich an, um deinen täglichen echten Moment zu teilen.
            </p>
            <Button onClick={() => (window.location.href = getLoginUrl())}>Anmelden</Button>
          </Card>
        )}
      </section>
    </div>
  );
}
