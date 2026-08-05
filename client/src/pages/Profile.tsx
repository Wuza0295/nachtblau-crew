import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Profile() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const { user: me, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const isOwn = me?.id === userId;

  const { data, isLoading } = trpc.profile.get.useQuery(
    { userId },
    { enabled: Number.isFinite(userId) }
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [mood, setMood] = useState("");

  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate({ userId });
      setEditing(false);
      toast.success("Profil aktualisiert");
    },
  });
  const follow = trpc.profile.follow.useMutation({
    onSuccess: () => utils.profile.get.invalidate({ userId }),
  });
  const unfollow = trpc.profile.unfollow.useMutation({
    onSuccess: () => utils.profile.get.invalidate({ userId }),
  });

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl">
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return <div className="container py-16 text-center">Profil nicht gefunden.</div>;
  }

  const initials = (data.user.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="container py-8 max-w-2xl space-y-8">
      <div className="atmosphere-panel rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl bg-primary/15 text-primary font-display font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="font-display text-2xl font-bold truncate">
              {data.user.name ?? "Nutzer"}
            </h1>
            {data.user.handle && (
              <p className="text-muted-foreground">@{data.user.handle}</p>
            )}
            {data.user.mood && (
              <p className="text-sm text-accent font-medium">{data.user.mood}</p>
            )}
            {data.user.bio && (
              <p className="text-sm leading-relaxed">{data.user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Dabei seit{" "}
              {format(new Date(data.user.createdAt), "MMMM yyyy", { locale: de })}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              <Button
                variant="outline"
                onClick={() => {
                  setName(data.user.name ?? "");
                  setHandle(data.user.handle ?? "");
                  setBio(data.user.bio ?? "");
                  setMood(data.user.mood ?? "");
                  setEditing((e) => !e);
                }}
              >
                {editing ? "Abbrechen" : "Bearbeiten"}
              </Button>
            ) : isAuthenticated ? (
              data.isFollowing ? (
                <Button
                  variant="outline"
                  onClick={() => unfollow.mutate({ userId })}
                  disabled={unfollow.isPending}
                >
                  Entfolgen
                </Button>
              ) : (
                <Button
                  onClick={() => follow.mutate({ userId })}
                  disabled={follow.isPending}
                >
                  Folgen
                </Button>
              )
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Anmelden</a>
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm border-t border-border/50 pt-4">
          <div>
            <span className="font-semibold tabular-nums">{data.stats.postCount}</span>{" "}
            <span className="text-muted-foreground">Posts</span>
          </div>
          <div>
            <span className="font-semibold tabular-nums">{data.stats.followers}</span>{" "}
            <span className="text-muted-foreground">Follower</span>
          </div>
          <div>
            <span className="font-semibold tabular-nums">{data.stats.following}</span>{" "}
            <span className="text-muted-foreground">Following</span>
          </div>
        </div>

        {editing && (
          <form
            className="space-y-3 border-t border-border/50 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({
                name: name || undefined,
                handle: handle || undefined,
                bio,
                mood,
              });
            }}
          >
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="Handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
            />
            <Input placeholder="Mood" value={mood} onChange={(e) => setMood(e.target.value)} />
            <Textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            <Button type="submit" disabled={update.isPending}>
              Speichern
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-5">
        <h2 className="font-display font-semibold text-lg">Streams</h2>
        {data.recent.map((item) => (
          <PostCard key={item.post.id} item={item} compact />
        ))}
        {data.recent.length === 0 && (
          <p className="text-muted-foreground text-center py-6">Noch keine Posts.</p>
        )}
      </div>

      {isOwn && (
        <p className="text-center text-sm">
          <Link href="/pulse" className="text-primary hover:underline">
            Pulse-Dials einstellen
          </Link>
        </p>
      )}
    </div>
  );
}
