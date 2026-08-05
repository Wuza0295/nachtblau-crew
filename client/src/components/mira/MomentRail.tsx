import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function MomentRail() {
  const utils = trpc.useUtils();
  const { data: moments } = trpc.mira.moments.useQuery();
  const viewMoment = trpc.mira.viewMoment.useMutation({
    onSuccess: () => utils.mira.moments.invalidate(),
  });
  const [active, setActive] = useState<string | null>(null);

  const current = moments?.find((m) => m.id === active);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        <button
          type="button"
          className="shrink-0 flex flex-col items-center gap-1.5 w-[72px]"
        >
          <span className="size-16 rounded-full border-2 border-dashed border-[var(--mira-jade)]/50 grid place-items-center bg-secondary/50 text-[var(--mira-jade)] text-2xl font-display">
            +
          </span>
          <span className="text-[11px] text-muted-foreground truncate w-full text-center">
            Dein Moment
          </span>
        </button>
        {moments?.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setActive(m.id);
              if (!m.viewed) viewMoment.mutate({ id: m.id });
            }}
            className="shrink-0 flex flex-col items-center gap-1.5 w-[72px]"
          >
            <span
              className={cn(
                "size-16 rounded-full p-[2px]",
                m.viewed
                  ? "bg-border"
                  : "bg-gradient-to-br from-[var(--mira-jade-bright)] via-[var(--mira-gold)] to-[var(--mira-jade)]"
              )}
            >
              <img
                src={m.author.avatar}
                alt=""
                className="size-full rounded-full object-cover border-2 border-background bg-secondary"
              />
            </span>
            <span className="text-[11px] truncate w-full text-center">
              {m.author.handle.split(".")[0]}
            </span>
          </button>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 bg-[var(--mira-ink)]/90 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.mediaUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 h-1 bg-white/20">
              <div className="h-full w-2/3 bg-white mira-shimmer" />
            </div>
            <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
              <img
                src={current.author.avatar}
                alt=""
                className="size-8 rounded-full border border-white/40"
              />
              <div className="text-white text-sm font-medium drop-shadow">
                {current.author.name}
              </div>
              <button
                type="button"
                className="ml-auto text-white/80 hover:text-white"
                onClick={() => setActive(null)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm">{current.caption}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
