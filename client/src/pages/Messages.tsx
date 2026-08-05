import { AppNav } from "@/components/CadenceNav";
import { Avatar } from "@/components/PostCard";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function Messages() {
  const { data: conversations = [] } = trpc.social.conversations.useQuery();
  const [activeId, setActiveId] = useState<number | null>(null);
  const selected = activeId ?? conversations[0]?.id ?? null;
  const { data: msgs = [] } = trpc.social.messages.useQuery(
    { conversationId: selected! },
    { enabled: !!selected }
  );
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState("");
  const send = trpc.social.sendMessage.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.social.messages.invalidate();
      utils.social.conversations.invalidate();
    },
  });

  const activeConv = conversations.find((c) => c.id === selected);
  const other = activeConv?.participants.find((p) => p.id !== 1);

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <AppNav />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 animate-rise">
          <h1 className="font-display text-3xl font-bold">Nachrichten</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Private Shares sind 2026 das stärkste Signal — hier zählt das Gespräch.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden grid md:grid-cols-[280px_1fr] min-h-[560px] animate-fade-scale">
          <aside className="border-r border-border">
            {conversations.map((c) => {
              const peer = c.participants.find((p) => p.id !== 1) ?? c.participants[0];
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/60 transition border-b border-border/60",
                    selected === c.id && "bg-secondary/80"
                  )}
                >
                  <Avatar gradient={peer.avatarGradient} name={peer.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{peer.name}</p>
                      {c.unread > 0 && (
                        <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center font-bold">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.preview}
                    </p>
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="flex flex-col min-h-[480px]">
            {other ? (
              <>
                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                  <Avatar gradient={other.avatarGradient} name={other.name} size="sm" />
                  <div>
                    <p className="font-semibold">{other.name}</p>
                    <p className="text-xs text-muted-foreground">@{other.handle}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {msgs.map((m) => {
                    const mine = m.senderId === 1;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary rounded-bl-md"
                          )}
                        >
                          <p>{m.body}</p>
                          <p
                            className={cn(
                              "text-[10px] mt-1",
                              mine ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {formatDistanceToNow(new Date(m.createdAt), {
                              addSuffix: true,
                              locale: de,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form
                  className="p-4 border-t border-border flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim() || !selected) return;
                    send.mutate({ conversationId: selected, body: draft.trim() });
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Nachricht…"
                    className="rounded-xl"
                  />
                  <Button type="submit" size="icon" className="rounded-xl shrink-0">
                    <Send className="size-4" />
                  </Button>
                </form>
              </>
            ) : (
              <p className="m-auto text-muted-foreground">Keine Unterhaltung gewählt</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
