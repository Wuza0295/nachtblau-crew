import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  User,
  MessageSquare,
  MessageCircle,
  Calendar,
  Edit3,
  Save,
  X,
  ChevronRight,
  Shield,
  UserPlus,
  Layers,
} from "lucide-react";
import PostCard from "@/components/social/PostCard";
import { ALLXION } from "@/lib/site";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? "0");
  const { user: currentUser, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  const { data, isLoading } = trpc.profile.getProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: socialPosts } = trpc.social.getUserPosts.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const followMut = trpc.social.follow.useMutation({
    onSuccess: () => toast.success(`Du folgst jetzt auf ${ALLXION.name}`),
  });

  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil aktualisiert!");
      setEditing(false);
      utils.profile.getProfile.invalidate({ userId });
    },
    onError: (err) => {
      toast.error(err.message ?? "Fehler beim Speichern");
    },
  });

  const isOwn = currentUser?.id === userId;

  if (isLoading) {
    return (
      <div className="py-12 container max-w-3xl space-y-4">
        <div className="h-32 bg-card rounded-xl animate-pulse" />
        <div className="h-48 bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 container text-center text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Nutzer nicht gefunden.</p>
      </div>
    );
  }

  const { user, stats, recentThreads } = data;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleEditStart = () => {
    setEditName(user.name ?? "");
    setEditBio(user.bio ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate({ name: editName, bio: editBio });
  };

  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        {/* Profile Card */}
        <Card className="card-glow bg-card border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <Avatar className="h-20 w-20 ring-4 ring-primary/20 flex-shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-input border-border focus:border-primary/50 mt-1"
                        maxLength={64}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Bio</Label>
                      <Textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="bg-input border-border focus:border-primary/50 mt-1 min-h-20 resize-none"
                        maxLength={500}
                        placeholder="Erzähl etwas über dich..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateProfile.isPending}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Speichern
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(false)}
                        className="text-muted-foreground gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h1
                        className="text-xl font-bold text-foreground"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {user.name ?? "Unbekannter Spieler"}
                      </h1>
                      {user.role === "admin" && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>

                    {user.handle && (
                      <p className="text-sm text-primary/80 mb-1">@{user.handle}</p>
                    )}

                    {user.bio ? (
                      <p className="text-sm text-muted-foreground mb-3">{user.bio}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic mb-3">
                        Keine Bio vorhanden
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Mitglied seit {new Date(user.createdAt).toLocaleDateString("de-DE")}
                    </div>
                  </>
                )}
              </div>

              {isOwn && !editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditStart}
                  className="text-muted-foreground hover:text-foreground gap-1.5 flex-shrink-0"
                >
                  <Edit3 className="h-4 w-4" />
                  Bearbeiten
                </Button>
              )}
              {!isOwn && isAuthenticated && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 flex-shrink-0"
                  onClick={() => followMut.mutate({ userId })}
                  disabled={followMut.isPending}
                >
                  <UserPlus className="h-4 w-4" />
                  Auf {ALLXION.name} folgen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.threadCount}</div>
                <div className="text-xs text-muted-foreground">Threads erstellt</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.postCount}</div>
                <div className="text-xs text-muted-foreground">Antworten geschrieben</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {socialPosts?.posts && socialPosts.posts.length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Beiträge auf {ALLXION.name}
              </CardTitle>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-xs">
                  Zum Hub
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialPosts.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Threads */}
        {recentThreads.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Letzte Threads
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentThreads.map(({ thread, category }) => (
                  <div key={thread.id}>
                    <Link href={`/forum/thread/${thread.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {thread.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            in {category.name} ·{" "}
                            {new Date(thread.createdAt).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                    <Separator className="bg-border/50 last:hidden" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
