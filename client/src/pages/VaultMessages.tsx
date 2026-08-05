import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MiraShell } from "@/components/mira/MiraShell";
import { PostCard } from "@/components/mira/PostCard";
import { Send } from "lucide-react";

export default function VaultPage() {
  const utils = trpc.useUtils();
  const { data } = trpc.mira.vault.useQuery();
  const save = trpc.mira.toggleSave.useMutation({
    onSuccess: () => utils.mira.vault.invalidate(),
  });
  const collections = Array.from(new Set(data?.map((v) => v.collection) ?? []));

  return (
    <MiraShell>
      <div className="mb-8 fade-up">
        <h1 className="font-display text-3xl font-700 tracking-tight">Vault</h1>
        <p className="text-muted-foreground mt-2">
          Pinterest-Energie: sammeln, was dich prägt – nicht was dich hält.
        </p>
        {collections.length > 0 && (
          <div className="flex gap-2 mt-4">
            {collections.map((c) => (
              <span
                key={c}
                className="text-xs px-3 py-1 rounded-full glass"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {data?.map(
          (v) =>
            v.post && (
              <PostCard
                key={v.id}
                post={v.post}
                compact
                onSave={() => save.mutate({ postId: v.postId })}
              />
            )
        )}
        {data?.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-2">
            Noch nichts gespeichert. Tippe auf das Lesezeichen bei Posts.
          </p>
        )}
      </div>
    </MiraShell>
  );
}

export function MessagesPage() {
  const utils = trpc.useUtils();
  const { data: conversations } = trpc.mira.conversations.useQuery();
  const [active, setActive] = useState<string | null>(null);
  const { data: messages } = trpc.mira.messages.useQuery(
    { conversationId: active! },
    { enabled: !!active }
  );
  const send = trpc.mira.sendMessage.useMutation({
    onSuccess: () => {
      utils.mira.messages.invalidate();
      utils.mira.conversations.invalidate();
      setBody("");
    },
  });
  const [body, setBody] = useState("");
  const me = trpc.mira.me.useQuery();

  const activeConv = conversations?.find((c) => c.id === active);
  const other = activeConv?.participants.find((p) => p && !p.isYou);

  return (
    <MiraShell>
      <h1 className="font-display text-3xl font-700 tracking-tight mb-6 fade-up">
        Nachrichten
      </h1>
      <div className="grid md:grid-cols-[280px_1fr] gap-4 min-h-[60vh]">
        <div className="glass rounded-2xl overflow-hidden divide-y divide-border/60">
          {conversations?.map((c) => {
            const peer = c.participants.find((p) => p && !p.isYou);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={`w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors flex gap-3 ${
                  active === c.id ? "bg-secondary/80" : ""
                }`}
              >
                <img
                  src={peer?.avatar}
                  alt=""
                  className="size-10 rounded-full bg-secondary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {peer?.name}
                    </span>
                    {c.unread > 0 && (
                      <span className="size-5 rounded-full bg-[var(--mira-jade)] text-primary-foreground text-[10px] grid place-items-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="glass rounded-2xl flex flex-col min-h-[400px]">
          {!active && (
            <div className="flex-1 grid place-items-center text-muted-foreground text-sm p-8">
              Wähle eine Unterhaltung
            </div>
          )}
          {active && (
            <>
              <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
                <img
                  src={other?.avatar}
                  alt=""
                  className="size-8 rounded-full"
                />
                <span className="font-medium text-sm">{other?.name}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.map((m) => {
                  const mine = m.senderId === me.data?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine
                            ? "bg-[var(--mira-jade)] text-primary-foreground rounded-br-md"
                            : "bg-secondary rounded-bl-md"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="p-3 border-t border-border/60 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!body.trim()) return;
                  send.mutate({ conversationId: active, body: body.trim() });
                }}
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Nachricht…"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="size-10 rounded-full bg-[var(--mira-jade)] text-primary-foreground grid place-items-center"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </MiraShell>
  );
}
