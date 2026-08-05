import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Camera } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function MomentPage() {
  const { isAuthenticated } = useAuth();
  const { data: promptData } = trpc.social.getMomentPrompt.useQuery();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const create = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Moment geteilt — authentisch und ehrlich.");
      setContent("");
      setMediaUrl("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center max-w-md">
        <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold">Daily Moment</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Wie BeReal, aber ohne App-Lock: ein Prompt pro Tag, du entscheidest wann.
        </p>
        <Button className="mt-6 rounded-full" onClick={() => (window.location.href = getLoginUrl())}>
          Anmelden
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 pb-24 md:pb-10 max-w-lg">
      <div className="text-center mb-8">
        <BadgeMoment />
        <h1 className="font-display text-2xl font-bold mt-4">Dein Moment</h1>
        <p className="text-muted-foreground text-sm mt-2">{promptData?.prompt}</p>
      </div>

      <Card className="portal-card p-5 border border-border/70 space-y-4">
        <Textarea
          placeholder="Was zeigst du — ungefiltert?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none bg-muted/30"
        />
        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
            <Camera className="h-3.5 w-3.5" /> Bild-URL (optional)
          </label>
          <Input
            placeholder="https://…"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="bg-muted/30"
          />
        </div>
        {mediaUrl && (
          <img src={mediaUrl} alt="" className="rounded-xl w-full max-h-64 object-cover" />
        )}
        <Button
          className="w-full rounded-full"
          disabled={create.isPending || content.trim().length < 1}
          onClick={() =>
            create.mutate({
              type: "moment",
              content: content.trim(),
              mediaUrl: mediaUrl.trim() || undefined,
            })
          }
        >
          Moment teilen
        </Button>
        <Link href="/feed" className="block text-center text-xs text-muted-foreground hover:text-primary">
          Zum Feed →
        </Link>
      </Card>
    </div>
  );
}

function BadgeMoment() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.55_0.16_160/0.2)] text-[oklch(0.85_0.08_160)] text-xs font-medium">
      <Sparkles className="h-3.5 w-3.5" />
      24h Fenster · kein Perfektionsdruck
    </div>
  );
}
