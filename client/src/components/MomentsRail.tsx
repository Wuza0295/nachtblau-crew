import { trpc } from "@/lib/trpc";
import { Avatar } from "@/components/PostCard";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";

export function MomentsRail() {
  const { data: moments = [] } = trpc.social.moments.useQuery();
  const { data: prompt } = trpc.social.dailyPrompt.useQuery();
  const [active, setActive] = useState<number | null>(null);

  const activeMoment = moments.find((m) => m.id === active);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  return (
    <section className="space-y-3 animate-rise">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Echtzeit</h2>
          <p className="text-sm text-muted-foreground">
            {prompt?.prompt ?? "Zeig einen echten Moment."}
          </p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <button className="shrink-0 w-20 flex flex-col items-center gap-2 group">
          <span className="size-16 rounded-full border-2 border-dashed border-primary/40 grid place-items-center bg-primary/5 group-hover:bg-primary/10 transition">
            <Camera className="size-5 text-primary" />
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Dein Moment</span>
        </button>
        {moments.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className="shrink-0 w-20 flex flex-col items-center gap-2"
          >
            <span
              className={cn(
                "size-16 rounded-full p-[2px]",
                m.viewed
                  ? "bg-border"
                  : "bg-gradient-to-br from-primary via-teal-400 to-accent animate-pulse-ring"
              )}
            >
              <span
                className="block size-full rounded-full border-2 border-background"
                style={{ background: m.imageGradient }}
              />
            </span>
            <span className="text-[11px] font-medium truncate w-full text-center">
              {m.author.handle}
            </span>
          </button>
        ))}
      </div>

      {activeMoment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-scale"
          role="dialog"
          aria-modal="true"
          aria-label="Echtzeit-Moment"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/90 cursor-default"
            aria-label="Moment schließen"
            onClick={() => setActive(null)}
          />
          <div className="relative z-10 w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl">
            <div
              className="absolute inset-0"
              style={{ background: activeMoment.imageGradient }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <div className="absolute top-4 left-4 right-4 flex items-center gap-3 text-white">
              <Avatar
                gradient={activeMoment.author.avatarGradient}
                name={activeMoment.author.name}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{activeMoment.author.name}</p>
                <p className="text-xs text-white/70">{activeMoment.caption}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1.5 text-sm font-medium"
                onClick={() => setActive(null)}
              >
                Schließen
              </button>
            </div>
            <p className="absolute bottom-6 inset-x-0 text-center text-white/50 text-xs">
              Tippe außerhalb oder Esc zum Schließen
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
