import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function MomentRail() {
  const { data: moments = [] } = trpc.social.moments.useQuery();
  const viewMoment = trpc.social.viewMoment.useMutation();
  const [active, setActive] = useState<(typeof moments)[number] | null>(null);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {moments.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setActive(m);
              viewMoment.mutate({ id: m.id });
            }}
            className="group flex w-[72px] shrink-0 flex-col items-center gap-1.5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className={cn(
                "rounded-full p-[2.5px]",
                m.viewed
                  ? "bg-border"
                  : "bg-gradient-to-br from-primary via-liora-moss to-accent"
              )}
            >
              <img
                src={m.author?.avatar}
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-2 ring-background"
              />
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground group-hover:text-foreground">
              {m.author?.displayName?.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl bg-black shadow-2xl"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={active.mediaUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <img
                      src={active.author?.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{active.author?.displayName}</p>
                      <p className="text-[11px] opacity-80 capitalize">{active.privacy}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="rounded-full bg-white/15 p-1.5 backdrop-blur"
                    aria-label="Schließen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
                <p className="text-white text-sm leading-relaxed">{active.caption}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
