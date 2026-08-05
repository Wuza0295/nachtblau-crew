import { AppShell } from "@/components/social/AppShell";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { data: conversations = [] } = trpc.social.conversations.useQuery();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ?? conversations[0]?.id ?? null;
  const { data: messages = [] } = trpc.social.messages.useQuery(
    { conversationId: active! },
    { enabled: !!active }
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

  const current = conversations.find((c) => c.id === active);

  return (
    <AppShell title="Direct">
      <header className="mb-4">
        <h1 className="font-display text-3xl font-bold">Direct</h1>
        <p className="text-sm text-muted-foreground">1:1 ohne Broadcast-Druck.</p>
      </header>
      <div className="grid min-h-[60vh] overflow-hidden rounded-2xl border border-border/70 bg-card/40 md:grid-cols-[240px_1fr]">
        <div className="border-b border-border/60 md:border-b-0 md:border-r">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-muted/60",
                active === c.id && "bg-muted/80"
              )}
            >
              <UserAvatar
                initials={c.other.avatarInitials}
                color={c.other.avatarColor}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{c.other.displayName}</span>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex flex-col">
          {current && (
            <div className="border-b border-border/60 px-4 py-3 font-semibold">
              {current.other.displayName}
            </div>
          )}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => {
              const mine = m.authorId === "me";
              return (
                <div
                  key={m.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "bg-primary text-primary-foreground" : "bg-muted"
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
          {active && (
            <form
              className="flex gap-2 border-t border-border/60 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                send.mutate({ conversationId: active, body: draft.trim() });
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nachricht…"
                className="rounded-full"
              />
              <Button type="submit" size="sm" className="rounded-full px-4">
                Senden
              </Button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
