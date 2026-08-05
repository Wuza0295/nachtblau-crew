import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import PostCard from "@/components/portal/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { Users } from "lucide-react";

export default function CircleView() {
  const [, params] = useRoute("/kreise/:slug");
  const slug = params?.slug ?? "";
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.social.getCircle.useQuery({ slug }, { enabled: !!slug });
  const { data: posts, isLoading: postsLoading } = trpc.social.getFeed.useQuery(
    { mode: "chronological", circleId: data?.circle.id, limit: 30 },
    { enabled: !!data?.circle.id }
  );

  const join = trpc.social.joinCircle.useMutation({
    onSuccess: () => {
      toast.success("Willkommen im Kreis!");
      void utils.social.getCircle.invalidate({ slug });
    },
  });
  const leave = trpc.social.leaveCircle.useMutation({
    onSuccess: () => {
      toast.success("Du hast den Kreis verlassen.");
      void utils.social.getCircle.invalidate({ slug });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="container py-8">
        <Skeleton className="h-32 w-full rounded-2xl mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const { circle, isMember } = data;

  return (
    <div className="container py-8 pb-24 md:pb-10 max-w-2xl">
      <div
        className="rounded-2xl p-6 mb-6 border border-border/60"
        style={{
          background: `linear-gradient(135deg, ${circle.accentColor ?? "oklch(0.25 0.05 280)"}22, transparent)`,
        }}
      >
        <h1 className="font-display text-2xl font-bold">{circle.name}</h1>
        <p className="text-muted-foreground mt-2">{circle.description}</p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {(circle.memberCount ?? 0).toLocaleString("de-DE")} Mitglieder
        </p>
        <div className="mt-4 flex gap-2">
          {!isAuthenticated ? (
            <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
              Anmelden zum Beitreten
            </Button>
          ) : isMember ? (
            <>
              <Button size="sm" variant="outline" onClick={() => leave.mutate({ circleId: circle.id })}>
                Verlassen
              </Button>
              <Button size="sm" asChild>
                <a href={`/erstellen?circle=${circle.id}`}>Im Kreis posten</a>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => join.mutate({ circleId: circle.id })}>
              Kreis beitreten
            </Button>
          )}
        </div>
      </div>

      {postsLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : (
        <div className="space-y-4">
          {(posts ?? []).map((item) => (
            <PostCard key={item.post.id} item={item} />
          ))}
          {(posts ?? []).length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Noch keine Posts in diesem Kreis.</p>
          )}
        </div>
      )}
    </div>
  );
}
