import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";

export default function CircleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.circles.bySlug.useQuery({ slug });
  const feed = trpc.feed.get.useQuery(
    { mode: "circle", circleId: data?.circle.id, limit: 30 },
    { enabled: !!data?.circle.id }
  );

  const join = trpc.circles.join.useMutation({
    onSuccess: () => {
      utils.circles.bySlug.invalidate({ slug });
      toast.success("Circle beigetreten");
    },
  });
  const leave = trpc.circles.leave.useMutation({
    onSuccess: () => {
      utils.circles.bySlug.invalidate({ slug });
      toast.message("Circle verlassen");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-16 text-center">
        <p>Circle nicht gefunden.</p>
        <Link href="/circles">
          <Button variant="link">Zurück</Button>
        </Link>
      </div>
    );
  }

  const { circle, isMember } = data;

  return (
    <div>
      <div
        className="h-44 sm:h-56"
        style={{ background: circle.coverGradient ?? "var(--primary)" }}
      />
      <div className="container -mt-12 pb-16 space-y-8 max-w-2xl">
        <div className="atmosphere-panel rounded-2xl p-6 space-y-4">
          <Link
            href="/circles"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Alle Circles
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold">{circle.name}</h1>
              <p className="text-muted-foreground">{circle.description}</p>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {circle.memberCount} Mitglieder · {circle.postCount} Posts
              </p>
            </div>
            {isAuthenticated ? (
              isMember ? (
                <Button
                  variant="outline"
                  onClick={() => leave.mutate({ circleId: circle.id })}
                  disabled={leave.isPending}
                >
                  Verlassen
                </Button>
              ) : (
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => join.mutate({ circleId: circle.id })}
                  disabled={join.isPending}
                >
                  Beitreten
                </Button>
              )
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Anmelden zum Beitreten</a>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {feed.isLoading && <Skeleton className="h-40 rounded-2xl" />}
          {feed.data?.map((item) => (
            <PostCard key={item.post.id} item={item} />
          ))}
          {!feed.isLoading && feed.data?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Posts in diesem Circle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
