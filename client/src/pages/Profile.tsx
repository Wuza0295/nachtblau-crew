import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const { user: me } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.profile.get.useQuery(
    { userId },
    { enabled: Number.isFinite(userId) }
  );
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [vibe, setVibe] = useState("");
  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate({ userId });
      setEditing(false);
      toast.success("Profil aktualisiert");
    },
  });

  const isOwn = me?.id === userId;

  if (isLoading) {
    return (
      <div className="container max-w-xl py-10 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-24 text-center text-muted-foreground">
        Profil nicht gefunden.
      </div>
    );
  }

  const { user, stats, posts, collections } = data;

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-xl py-10">
        <header className="flex gap-5 items-start mb-8 animate-rise">
          <img
            src={user.avatar ?? ""}
            alt=""
            className="h-20 w-20 rounded-full bg-muted object-cover"
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground text-sm">@{user.handle}</p>
            {user.vibe && (
              <p className="text-sm mt-2 text-primary/90 italic">{user.vibe}</p>
            )}
            {user.bio && !editing && (
              <p className="text-sm mt-3 leading-relaxed text-muted-foreground">{user.bio}</p>
            )}
            {isOwn && !editing && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => {
                  setBio(user.bio ?? "");
                  setVibe(user.vibe ?? "");
                  setEditing(true);
                }}
              >
                Bearbeiten
              </Button>
            )}
          </div>
        </header>

        {editing && (
          <form
            className="mb-8 space-y-3 p-4 rounded-xl bg-card border border-border"
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({ bio, vibe });
            }}
          >
            <Input
              placeholder="Vibe / Status"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
            />
            <Textarea
              placeholder="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="rounded-full" disabled={update.isPending}>
                Speichern
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-4 gap-3 mb-10 text-center">
          {[
            ["Beiträge", stats.postCount],
            ["Nah", stats.innerCount],
            ["Orbit", stats.orbitCount],
            ["Räume", stats.spaceCount],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="font-display text-xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {collections.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-lg font-semibold mb-3">Sammlungen</h2>
            <ul className="space-y-2">
              {collections.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between text-sm py-2 border-b border-border/50"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.itemCount} gespeichert</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Pinterest-Energie: merken statt scrollen.
            </p>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg font-semibold mb-2">Beiträge</h2>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
          {posts.length === 0 && (
            <p className="text-muted-foreground py-8">Noch keine Beiträge.</p>
          )}
        </section>

        <p className="mt-8 text-sm">
          <Link href="/kreis" className="text-muted-foreground hover:text-foreground underline">
            Zum Kreis
          </Link>
        </p>
      </div>
    </div>
  );
}
