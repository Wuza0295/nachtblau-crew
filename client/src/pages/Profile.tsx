import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { AvatarOrb } from "@/components/PostCard";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Profile() {
  const [, params] = useRoute("/profil/:idOrHandle");
  const idOrHandle = params?.idOrHandle ?? "";
  const parsed = Number(idOrHandle);
  const key = Number.isFinite(parsed) && idOrHandle === String(parsed) ? parsed : idOrHandle;

  const profile = trpc.social.profile.useQuery(
    { idOrHandle: key },
    { enabled: Boolean(idOrHandle) }
  );
  const utils = trpc.useUtils();
  const follow = trpc.social.follow.useMutation({
    onSuccess: (res) => {
      toast.success(res.following ? "Folgst du jetzt" : "Entfolgt");
      utils.social.profile.invalidate();
    },
  });

  if (profile.isLoading) return <div className="container py-8">Lade Profil…</div>;
  if (!profile.data) return <div className="container py-8">Profil nicht gefunden.</div>;

  const p = profile.data.profile;

  return (
    <div className="container py-8 max-w-3xl">
      <div className="aether-shell rounded-[1.75rem] p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 aurora-plane opacity-40 pointer-events-none" />
        <div className="relative flex flex-wrap gap-5 items-start">
          <AvatarOrb name={p.name} color={p.avatarColor} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold">{p.name}</h1>
            <p className="text-muted-foreground">@{p.handle}</p>
            <p className="mt-3 leading-relaxed max-w-xl">{p.bio}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{p.role}</span>
              {p.location && <span>· {p.location}</span>}
              <span>· {p.followerCount} Follower</span>
              <span>· {p.followingCount} Following</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary">
                  {i}
                </span>
              ))}
            </div>
          </div>
          <Button
            className="rounded-full"
            variant={p.isFollowing ? "outline" : "default"}
            onClick={() => follow.mutate({ targetId: p.id })}
          >
            {p.isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Beiträge</h2>
        {profile.data.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
