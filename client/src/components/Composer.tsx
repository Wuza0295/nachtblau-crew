import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LENSES } from "@/lib/site";
import { toast } from "sonner";
import type { LensId } from "@shared/site";

const KINDS = [
  { id: "text", label: "Text" },
  { id: "image", label: "Bild" },
  { id: "carousel", label: "Carousel" },
  { id: "video", label: "Video" },
  { id: "article", label: "Artikel" },
] as const;

export default function Composer({ defaultLenses = ["pulse"] as LensId[] }) {
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("text");
  const [lenses, setLenses] = useState<LensId[]>(defaultLenses);
  const [tags, setTags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Im Spektrum veröffentlicht");
      setBody("");
      setTitle("");
      setTags("");
      setMediaUrl("");
      utils.social.feed.invalidate();
      utils.social.motionFeed.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function toggleLens(id: LensId) {
    setLenses((prev) =>
      prev.includes(id) ? (prev.length === 1 ? prev : prev.filter((l) => l !== id)) : [...prev, id]
    );
  }

  return (
    <div className="aether-shell rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-display text-lg font-semibold">Composer</h2>
        <span className="text-xs text-muted-foreground">Ein Post · viele Linsen</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              kind === k.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {LENSES.map((lens) => (
          <button
            key={lens.id}
            onClick={() => toggleLens(lens.id)}
            className={`text-[11px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border transition ${
              lenses.includes(lens.id)
                ? "bg-accent/30 border-accent text-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {lens.label}
          </button>
        ))}
      </div>

      {(kind === "article") && (
        <Input
          className="mb-2 rounded-xl"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}

      <Textarea
        className="min-h-[110px] rounded-xl resize-y"
        placeholder="Was willst du ins Spektrum geben?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {(kind === "image" || kind === "carousel" || kind === "video" || kind === "article") && (
        <Input
          className="mt-2 rounded-xl"
          placeholder="Bild-/Medien-URL (optional)"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
        />
      )}

      <Input
        className="mt-2 rounded-xl"
        placeholder="Tags, kommagetrennt"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <div className="mt-3 flex justify-end">
        <Button
          className="rounded-full px-6"
          disabled={!body.trim() || create.isPending}
          onClick={() =>
            create.mutate({
              kind,
              lenses,
              title: title || undefined,
              body: body.trim(),
              mediaUrls: mediaUrl ? [mediaUrl] : undefined,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              asDemo: true,
            })
          }
        >
          Veröffentlichen
        </Button>
      </div>
    </div>
  );
}
