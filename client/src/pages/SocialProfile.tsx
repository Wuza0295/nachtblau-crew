import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { useState } from "react";
import PostCard from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function SocialProfile() {
  const params = useParams<{ handle: string }>();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.social.profile.useQuery(
    { handle: params.handle ?? "" },
    { enabled: Boolean(params.handle) }
  );
  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => utils.social.profile.invalidate({ handle: params.handle ?? "" }),
  });
  const [face, setFace] = useState<"personal" | "craft">("personal");

  if (isLoading) {
    return <div className="container py-12 text-muted-foreground">Lade Profil…</div>;
  }
  if (!profile) {
    return (
      <div className="container py-12">
        Profil nicht gefunden.{" "}
        <Link href="/entdecken" className="text-primary">
          Entdecken
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="h-44 md:h-56 overflow-hidden">
        <img src={profile.cover} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="container pb-12">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="font-display text-3xl">{profile.displayName}</h1>
              <p className="text-muted-foreground">@{profile.handle}</p>
            </div>
          </div>
          <Button
            className="rounded-full"
            variant={profile.isFollowing ? "secondary" : "default"}
            onClick={() => follow.mutate({ profileId: profile.id })}
          >
            {profile.isFollowing ? "Folgst du" : "Folgen"}
          </Button>
        </div>

        <div className="mt-6 flex gap-1 rounded-full bg-secondary p-1 w-fit">
          {(["personal", "craft"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFace(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm capitalize",
                face === f ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              )}
            >
              {f === "personal" ? "Persönlich" : "Craft"}
            </button>
          ))}
        </div>

        <p className="mt-4 max-w-2xl leading-relaxed text-foreground/90">
          {face === "personal" ? profile.bio : profile.craftBio}
        </p>
        {face === "craft" && (
          <p className="mt-1 text-sm text-primary">{profile.craftTitle}</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {profile.location} · {profile.followers.toLocaleString("de-DE")} Follower ·{" "}
          {profile.following} folgend
        </p>

        <div className="mt-10 space-y-4">
          <h2 className="font-display text-2xl">Beiträge</h2>
          {profile.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {profile.boards.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl">Boards</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {profile.boards.map((b) => (
                <div key={b.id} className="overflow-hidden rounded-2xl mist-panel">
                  <img src={b.cover} alt="" className="aspect-video w-full object-cover" />
                  <div className="p-3">
                    <p className="font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.itemCount} Elemente</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
