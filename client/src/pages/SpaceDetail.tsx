import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function SpaceDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const utils = trpc.useUtils();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = trpc.space.get.useQuery(
    { slug },
    { enabled: Boolean(slug) }
  );
  const join = trpc.space.join.useMutation({
    onSuccess: () => {
      utils.space.get.invalidate({ slug });
      toast.success("Beigetreten");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-24 text-center text-muted-foreground">
        Raum nicht gefunden.
      </div>
    );
  }

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-xl py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Horizont · {data.space.tone}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight mb-3">
          {data.space.name}
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-6">{data.space.description}</p>
        <div className="flex items-center gap-4 mb-10">
          <span className="text-sm text-muted-foreground">
            {data.space.memberCount.toLocaleString("de-DE")} Mitglieder
          </span>
          {isAuthenticated && !data.joined && (
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => join.mutate({ spaceId: data.space.id })}
              disabled={join.isPending}
            >
              Beitreten
            </Button>
          )}
          {data.joined && (
            <span className="text-sm text-primary font-medium">Du bist dabei</span>
          )}
          {!isAuthenticated && (
            <a href={getLoginUrl()} className="text-sm underline text-muted-foreground">
              Anmelden zum Beitreten
            </a>
          )}
        </div>

        <h2 className="font-display text-lg font-semibold mb-2">Beiträge</h2>
        {data.posts.map((post) => (
          <PostCard key={post.id} post={post} compact />
        ))}
        {data.posts.length === 0 && (
          <p className="text-muted-foreground py-8">Noch keine Beiträge in diesem Raum.</p>
        )}
      </div>
    </div>
  );
}
