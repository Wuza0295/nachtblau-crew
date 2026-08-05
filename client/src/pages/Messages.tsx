import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default function Messages() {
  const { data: conversations = [] } = trpc.social.conversations.useQuery();
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = activeId ?? conversations[0]?.id ?? null;
  const utils = trpc.useUtils();
  const { data: conversation } = trpc.social.conversation.useQuery(
    { id: selected ?? "" },
    { enabled: Boolean(selected) }
  );
  const [draft, setDraft] = useState("");
  const send = trpc.social.sendMessage.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.social.conversation.invalidate();
      utils.social.conversations.invalidate();
    },
  });

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl md:text-4xl">Nachrichten</h1>
      <p className="mt-2 text-muted-foreground">Direkt, ruhig, ohne Status-Theater.</p>

      <div className="mt-6 mist-panel grid min-h-[520px] overflow-hidden rounded-2xl md:grid-cols-[280px_1fr]">
        <aside className="border-b border-border md:border-b-0 md:border-r">
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/70",
                    selected === c.id && "bg-secondary"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.other?.avatar} />
                    <AvatarFallback>{c.other?.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.other?.displayName}</p>
                      {c.unread > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-col">
          {conversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={conversation.other?.avatar} />
                  <AvatarFallback>{conversation.other?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{conversation.other?.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{conversation.other?.handle}</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {conversation.messages.map((m) => {
                  const mine = m.senderId === "u1";
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary rounded-bl-md"
                        )}
                      >
                        <p>{m.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
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
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim() || !selected) return;
                  send.mutate({ conversationId: selected, body: draft.trim() });
                }}
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nachricht schreiben…"
                  className="rounded-full"
                />
                <Button type="submit" className="rounded-full" disabled={!draft.trim()}>
                  Senden
                </Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-muted-foreground">
              Konversation wählen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
