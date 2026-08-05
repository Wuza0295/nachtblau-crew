import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import PostCard, { AvatarOrb } from "@/components/PostCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function PostPage() {
  const [, params] = useRoute("/post/:id");
  const id = Number(params?.id);
  const detail = trpc.social.post.useQuery({ id }, { enabled: Number.isFinite(id) });
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const reply = trpc.social.reply.useMutation({
    onSuccess: () => {
      setBody("");
      toast.success("Antwort gesendet");
      utils.social.post.invalidate({ id });
    },
  });

  if (!Number.isFinite(id)) return <div className="container py-8">Ungültiger Post.</div>;
  if (detail.isLoading) return <div className="container py-8">Lade…</div>;
  if (!detail.data) return <div className="container py-8">Post nicht gefunden.</div>;

  return (
    <div className="container py-8 max-w-2xl space-y-5">
      <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground">
        ← Feed
      </Link>
      <PostCard post={detail.data.post} />

      <div className="aether-shell rounded-2xl p-4">
        <h2 className="font-display font-semibold mb-3">Antworten</h2>
        <div className="space-y-4 mb-4">
          {detail.data.replies.map((r) => (
            <div key={r.id} className="flex gap-3">
              <AvatarOrb name={r.author.name} color={r.author.avatarColor} size="sm" />
              <div>
                <div className="text-sm">
                  <span className="font-semibold">{r.author.name}</span>{" "}
                  <span className="text-muted-foreground">
                    ·{" "}
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </span>
                </div>
                <p className="text-[15px] mt-1">{r.body}</p>
              </div>
            </div>
          ))}
          {detail.data.replies.length === 0 && (
            <p className="text-sm text-muted-foreground">Noch keine Antworten.</p>
          )}
        </div>
        <Textarea
          className="rounded-xl"
          placeholder="Antwort schreiben…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <Button
            className="rounded-full"
            disabled={!body.trim() || reply.isPending}
            onClick={() => reply.mutate({ postId: id, body: body.trim() })}
          >
            Antworten
          </Button>
        </div>
      </div>
    </div>
  );
}
