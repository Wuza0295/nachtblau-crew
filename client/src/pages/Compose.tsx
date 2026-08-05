import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PULSE_TOPICS } from "@shared/site";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Compose() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: circles } = trpc.circles.list.useQuery({});
  const create = trpc.feed.create.useMutation({
    onSuccess: (res) => {
      toast.success("Gepostet");
      setLocation(`/post/${res.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [type, setType] = useState<"text" | "image" | "essay" | "signal">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("technologie");
  const [circleId, setCircleId] = useState<string>("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isAiLabeled, setIsAiLabeled] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold">Posten</h1>
        <p className="text-muted-foreground">Bitte anmelden, um zu posten.</p>
        <Button asChild>
          <a href={getLoginUrl()}>Anmelden</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Neuer Stream</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Text, Bild, Essay oder Signal (24h).
        </p>
      </div>

      <form
        className="atmosphere-panel rounded-2xl p-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            type,
            title: title || undefined,
            content,
            topic,
            circleId: circleId === "none" ? undefined : Number(circleId),
            mediaUrl: mediaUrl || undefined,
            isAiLabeled,
          });
        }}
      >
        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Bild</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
              <SelectItem value="signal">Signal (24h)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(type === "essay" || type === "image") && (
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={256} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Inhalt</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={type === "essay" ? 10 : 5}
            required
            maxLength={8000}
          />
        </div>

        {(type === "image" || type === "signal") && (
          <div className="space-y-2">
            <Label>Bild-URL</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Thema</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PULSE_TOPICS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Circle (optional)</Label>
            <Select value={circleId} onValueChange={setCircleId}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Circle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Circle</SelectItem>
                {circles?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium">KI-Inhalt kennzeichnen</p>
            <p className="text-xs text-muted-foreground">Transparenz statt Slop.</p>
          </div>
          <Switch checked={isAiLabeled} onCheckedChange={setIsAiLabeled} />
        </div>

        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={create.isPending || !content.trim()}
        >
          {type === "signal" ? "Signal senden" : "Veröffentlichen"}
        </Button>
      </form>
    </div>
  );
}
