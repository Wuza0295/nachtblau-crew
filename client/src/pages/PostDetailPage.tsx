import { AppShell } from "@/components/social/AppShell";
import { PostCard } from "@/components/social/PostCard";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { Link } from "wouter";

export default function PostDetailPage({ id }: { id: string }) {
  const { data, isLoading } = trpc.social.post.useQuery({ id });
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const reply = trpc.social.reply.useMutation({
    onSuccess: () => {
      setBody("");
      utils.social.post.invalidate({ id });
      utils.social.feed.invalidate();
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Lädt…</p>
      </AppShell>
    );
  }

  if (!data?.post) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Post nicht gefunden.</p>
        <Link href="/app" className="text-coral underline">
          Zurück zum Feed
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Beitrag">
      <PostCard post={data.post} showReasons />
      <section className="mt-4 border-t border-border pt-4">
        <h2 className="font-display text-lg font-bold">Antworten</h2>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            reply.mutate({ postId: id, body: body.trim() });
          }}
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Antwort hinzufügen — erhöht das Signal…"
            className="min-h-[72px]"
          />
          <Button type="submit" size="sm" disabled={!body.trim() || reply.isPending}>
            Antworten
          </Button>
        </form>
        <ul className="mt-6 space-y-4">
          {data.replies.map((r) => (
            <li key={r.id} className="flex gap-3">
              <UserAvatar
                initials={r.author.avatarInitials}
                color={r.author.avatarColor}
                size="sm"
              />
              <div>
                <div className="flex flex-wrap gap-x-2 text-sm">
                  <span className="font-semibold">{r.author.displayName}</span>
                  <span className="text-muted-foreground">@{r.author.handle}</span>
                  <span className="text-muted-foreground">
                    ·{" "}
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-[15px] leading-relaxed">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
