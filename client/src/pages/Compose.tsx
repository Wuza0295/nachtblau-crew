import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearch } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Compose() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const defaultType = (params.get("type") as "wave" | "flash" | "story") || "wave";
  const circleId = params.get("circle") ? Number(params.get("circle")) : undefined;

  const [type, setType] = useState<"wave" | "flash" | "story">(
    ["wave", "flash", "story"].includes(defaultType) ? defaultType : "wave"
  );
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Veröffentlicht!");
      setLocation(type === "flash" ? "/flashes" : "/feed");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <Button onClick={() => (window.location.href = getLoginUrl())}>Anmelden zum Posten</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 pb-24 md:pb-10 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Erstellen</h1>

      <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="wave">Wave</TabsTrigger>
          <TabsTrigger value="flash">Flash</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
        </TabsList>

        <TabsContent value="wave" className="space-y-4 mt-0">
          <Textarea
            placeholder="Was denkst du? #Hashtags für Social Search…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[140px] bg-muted/30"
            maxLength={2000}
          />
        </TabsContent>

        <TabsContent value="flash" className="space-y-4 mt-0">
          <Textarea
            placeholder="Kurzer Hook zum Bild…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] bg-muted/30"
          />
          <Input
            placeholder="Bild-URL (Pflicht für Flash)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="bg-muted/30"
          />
        </TabsContent>

        <TabsContent value="story" className="space-y-4 mt-0">
          <p className="text-xs text-muted-foreground">Verschwindet nach 24 Stunden.</p>
          <Textarea
            placeholder="Story-Text…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] bg-muted/30"
          />
          <Input
            placeholder="Bild-URL"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="bg-muted/30"
          />
        </TabsContent>
      </Tabs>

      <Button
        className="w-full mt-6 rounded-full"
        disabled={create.isPending}
        onClick={() => {
          if (type === "wave" && !content.trim()) {
            toast.error("Wave braucht Text");
            return;
          }
          if ((type === "flash" || type === "story") && !mediaUrl.trim()) {
            toast.error("Bitte Bild-URL angeben");
            return;
          }
          create.mutate({
            type,
            content: content.trim() || undefined,
            mediaUrl: mediaUrl.trim() || undefined,
            mediaAspect: type === "flash" ? "portrait" : "square",
            circleId,
          });
        }}
      >
        Veröffentlichen
      </Button>
    </div>
  );
}
