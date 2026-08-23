import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function ComposePostDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: communities } = trpc.social.getCommunities.useQuery();
  const [postType, setPostType] = useState<"text" | "media" | "poll" | "spark" | "article">(
    "text"
  );
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState<string>("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [pollOpt1, setPollOpt1] = useState("");
  const [pollOpt2, setPollOpt2] = useState("");
  const [tags, setTags] = useState("");

  const createMut = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Veröffentlicht");
      utils.social.getFeed.invalidate();
      onOpenChange(false);
      setContent("");
      setMediaUrl("");
      setPollOpt1("");
      setPollOpt2("");
      setTags("");
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = () => {
    const topicTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const pollOptions =
      postType === "poll" ? [pollOpt1, pollOpt2].filter((o) => o.trim()) : undefined;
    const mediaUrls =
      postType === "media" || postType === "spark"
        ? mediaUrl.trim()
          ? [mediaUrl.trim()]
          : undefined
        : undefined;

    createMut.mutate({
      postType,
      content,
      communityId: communityId !== "none" ? Number(communityId) : undefined,
      mediaUrls,
      pollOptions,
      topicTags: topicTags.length ? topicTags : undefined,
      intensityLevel: postType === "spark" ? 3 : 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-white/10 bg-card">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>Neuer Beitrag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Pulse (Kurztext)</SelectItem>
                  <SelectItem value="media">Medien / Carousel</SelectItem>
                  <SelectItem value="poll">Umfrage</SelectItem>
                  <SelectItem value="spark">Fluss (Short)</SelectItem>
                  <SelectItem value="article">Artikel (Lang)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kreis (optional)</Label>
              <Select value={communityId} onValueChange={setCommunityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Öffentlich" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Öffentlich</SelectItem>
                  {communities?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.iconEmoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Inhalt</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Was möchtest du teilen?"
              className="min-h-[120px]"
            />
          </div>
          {(postType === "media" || postType === "spark") && (
            <div className="space-y-2">
              <Label>Bild-URL</Label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          )}
          {postType === "poll" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={pollOpt1}
                onChange={(e) => setPollOpt1(e.target.value)}
                placeholder="Option 1"
              />
              <Input
                value={pollOpt2}
                onChange={(e) => setPollOpt2(e.target.value)}
                placeholder="Option 2"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Tags (kommagetrennt)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="creator, berlin, …"
            />
          </div>
          <Button
            className="w-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.22_310)] to-[oklch(0.62_0.2_25)]"
            disabled={!content.trim() || createMut.isPending}
            onClick={submit}
          >
            Veröffentlichen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
