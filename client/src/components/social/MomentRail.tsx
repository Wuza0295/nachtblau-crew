import { UserAvatar } from "./UserAvatar";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export function MomentRail() {
  const { data: moments = [] } = trpc.social.moments.useQuery();
  const utils = trpc.useUtils();
  const mark = trpc.social.markMomentViewed.useMutation({
    onSuccess: () => utils.social.moments.invalidate(),
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = moments.find((m) => m.id === activeId);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <button
          type="button"
          className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          aria-label="Eigenen Moment teilen"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-coral/50 bg-card text-2xl text-coral">
            +
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">Dein Moment</span>
        </button>
        {moments.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setActiveId(m.id);
              if (!m.viewed) mark.mutate({ id: m.id });
            }}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <UserAvatar
              initials={m.author.avatarInitials}
              color={m.author.avatarColor}
              size="lg"
              ring
              viewed={m.viewed}
            />
            <span className="w-full truncate text-center text-[11px] font-medium">
              {m.author.handle.split(".")[0]}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActiveId(null)}>
        <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative overflow-hidden rounded-3xl"
                style={{ background: active.mediaGradient, minHeight: 420 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
                <DialogHeader className="relative z-10 p-5 text-left text-white">
                  <DialogTitle className="flex items-center gap-3 font-display text-lg">
                    <UserAvatar
                      initials={active.author.avatarInitials}
                      color={active.author.avatarColor}
                      size="sm"
                    />
                    @{active.author.handle}
                  </DialogTitle>
                </DialogHeader>
                <div className="relative z-10 mt-auto flex min-h-[280px] flex-col justify-end p-5 text-white">
                  {active.prompt && (
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/70">
                      {active.prompt}
                    </p>
                  )}
                  <p className="font-display text-2xl leading-snug">{active.caption}</p>
                  <p className="mt-3 text-xs text-white/60">Verschwindet in wenigen Stunden</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
