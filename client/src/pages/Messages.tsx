import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Send } from "lucide-react";

export default function Messages() {
  const { data: conversations = [] } = trpc.social.conversations.useQuery();
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = activeId ?? conversations[0]?.id ?? null;
  const utils = trpc.useUtils();

  const { data: messages = [] } = trpc.social.messages.useQuery(
    { conversationId: selected! },
    { enabled: Boolean(selected) }
  );

  const [draft, setDraft] = useState("");
  const send = trpc.social.sendMessage.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.social.messages.invalidate({ conversationId: selected! });
      utils.social.conversations.invalidate();
    },
  });

  const activeConv = conversations.find((c) => c.id === selected);

  return (
    <div className="container py-6 max-w-5xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Nähe zuerst — DMs ohne Reichweite-Druck (Snap / IG DNA).
        </p>
      </header>

      <div className="grid md:grid-cols-[280px_1fr] border border-border/50 rounded-2xl overflow-hidden min-h-[60vh] bg-secondary/10">
        <aside className="border-b md:border-b-0 md:border-r border-border/50 max-h-[40vh] md:max-h-none overflow-y-auto">
          {conversations.map((c) => {
            const other = c.participants[0];
            const active = c.id === selected;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full flex gap-3 p-3 text-left transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-white/5"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={other?.avatar} />
                  <AvatarFallback>{other?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{other?.name}</span>
                    {c.unread > 0 && (
                      <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="flex flex-col min-h-[50vh]">
          {activeConv ? (
            <>
              <div className="px-4 py-3 border-b border-border/50 font-display font-semibold">
                {activeConv.participants.map((p) => p.name).join(", ")}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-2 max-w-[90%]">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={m.author.avatar} />
                      <AvatarFallback>{m.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="rounded-2xl rounded-tl-sm bg-secondary/80 px-3 py-2 text-sm leading-relaxed">
                        {m.body}
                      </div>
                      <time className="text-[10px] text-muted-foreground mt-1 block">
                        {formatDistanceToNow(new Date(m.createdAt), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
              <form
                className="p-3 border-t border-border/50 flex gap-2"
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
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!draft.trim() || send.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Konversation wählen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
