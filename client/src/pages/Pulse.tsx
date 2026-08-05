import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Pulse() {
  const { data: clips = [], isLoading } = trpc.social.pulse.useQuery();
  const [index, setIndex] = useState(0);
  const utils = trpc.useUtils();
  const applyPrompt = trpc.social.applyRadarPrompt.useMutation({
    onSuccess: () => utils.social.radar.invalidate(),
  });

  const clip = clips[index];

  const next = () => setIndex((i) => (clips.length ? (i + 1) % clips.length : 0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-64 w-40 rounded-3xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        Keine Pulse-Clips.
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-lg mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pulse</h1>
          <p className="text-sm text-muted-foreground">Entdecken mit Absicht — TikTok-DNA, dein Radar.</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {index + 1}/{clips.length}
        </span>
      </header>

      <div className="relative rounded-3xl overflow-hidden border border-border/50 aspect-[9/14] bg-black group">
        <img
          src={clip.mediaUrl}
          alt={clip.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={clip.author.avatar}
              alt=""
              className="h-10 w-10 rounded-full border-2 border-white/30 object-cover"
            />
            <div>
              <div className="font-semibold text-white">@{clip.author.handle}</div>
              <div className="text-xs text-white/70">{clip.watchHint}</div>
            </div>
          </div>
          <h2 className="font-display text-xl font-bold text-white">{clip.title}</h2>
          <p className="text-sm text-white/85 leading-relaxed">{clip.body}</p>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Activity className="h-4 w-4 text-amber-300" />
            {clip.resonance.toLocaleString("de-DE")} Resonanz
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="secondary"
          className="flex-1 gap-2"
          onClick={() => {
            const topic = clip.topics[0] ?? "davon";
            applyPrompt.mutate({ prompt: `weniger ${topic}` });
            next();
          }}
        >
          <ThumbsDown className="h-4 w-4" /> Weniger davon
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => {
            const topic = clip.topics[0] ?? "davon";
            applyPrompt.mutate({ prompt: `mehr ${topic}` });
            next();
          }}
        >
          <ThumbsUp className="h-4 w-4" /> Mehr davon
        </Button>
      </div>
      <Button variant="ghost" className="w-full mt-2" onClick={next}>
        Nächster Clip
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Korrekturen landen im{" "}
        <Link href="/radar" className="text-primary underline-offset-2 hover:underline">
          Radar
        </Link>
        .
      </p>
    </div>
  );
}
