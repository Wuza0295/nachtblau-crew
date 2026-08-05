import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { PostKind } from "@shared/social";

const KINDS: { id: PostKind; label: string; hint: string }[] = [
  { id: "signal", label: "Signal", hint: "Kurz · X-DNA" },
  { id: "essay", label: "Essay", hint: "Tief · LinkedIn-DNA" },
  { id: "visual", label: "Visual", hint: "Bild · IG-DNA" },
  { id: "moment", label: "Moment", hint: "Authentisch · BeReal" },
  { id: "pulse", label: "Pulse", hint: "Clip · TikTok" },
];

export default function Compose() {
  const search = useSearch();
  const kindFromQuery = useMemo(() => {
    const q = new URLSearchParams(search).get("kind");
    return KINDS.some((k) => k.id === q) ? (q as PostKind) : "signal";
  }, [search]);

  const [kind, setKind] = useState<PostKind>(kindFromQuery);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topics, setTopics] = useState("");
  const [, setLocation] = useLocation();

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Gepostet");
      setLocation("/feed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="container py-8 max-w-xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Posten</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ein Graph, viele Tiefen — Signal bis Essay.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {KINDS.map((k) => (
          <Button
            key={k.id}
            type="button"
            size="sm"
            variant={kind === k.id ? "default" : "outline"}
            className="flex-col h-auto py-2 px-3 gap-0.5"
            onClick={() => setKind(k.id)}
          >
            <span>{k.label}</span>
            <span className="text-[10px] opacity-70 font-normal">{k.hint}</span>
          </Button>
        ))}
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          create.mutate({
            kind,
            body: body.trim(),
            title: kind === "essay" ? title.trim() || undefined : undefined,
            topics: topics
              .split(/[,#\s]+/)
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean)
              .slice(0, 6),
          });
        }}
      >
        {kind === "essay" && (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            maxLength={200}
          />
        )}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === "moment"
              ? "Was passiert gerade — ohne Performance…"
              : kind === "essay"
                ? "Dein langer Gedanke…"
                : "Was denkst du?"
          }
          rows={kind === "essay" ? 10 : 5}
          className="resize-y"
        />
        <Input
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="Themen: produkt, fotografie, gaming…"
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={() => setLocation("/feed")}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!body.trim() || create.isPending}>
            Veröffentlichen
          </Button>
        </div>
      </form>
    </div>
  );
}
