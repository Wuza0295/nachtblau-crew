import { trpc } from "@/lib/trpc";
import { AvatarOrb } from "@/components/PostCard";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function Notifications() {
  const notes = trpc.social.notifications.useQuery();

  return (
    <div className="container py-8 max-w-xl">
      <h1 className="font-display text-3xl font-bold">Notifications</h1>
      <div className="mt-6 space-y-3">
        {notes.data?.map((n) => (
          <div
            key={n.id}
            className={`aether-shell rounded-2xl p-4 flex gap-3 ${n.read ? "opacity-75" : ""}`}
          >
            <AvatarOrb name={n.actor.name} color={n.actor.avatarColor} size="sm" />
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{n.actor.name}</span> {n.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: de })}
              </p>
              {n.postId && (
                <Link href={`/post/${n.postId}`} className="text-xs text-primary mt-1 inline-block">
                  Post öffnen
                </Link>
              )}
            </div>
            {!n.read && <span className="ml-auto h-2 w-2 rounded-full bg-accent mt-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}
