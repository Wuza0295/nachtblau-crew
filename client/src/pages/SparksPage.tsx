import { AppShell } from "@/components/social/AppShell";
import { UserAvatar } from "@/components/social/UserAvatar";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function SparksPage() {
  const { data: sparks = [] } = trpc.social.sparks.useQuery();

  return (
    <AppShell title="Sparks">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Sparks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          TikTok-Discovery ohne Sound-Monokultur — Interesse und Signal steuern die Reihe.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {sparks.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/post/${s.id}`} className="group block overflow-hidden rounded-2xl">
              <div
                className="relative aspect-[9/14] transition-transform duration-500 group-hover:scale-[1.02]"
                style={{
                  background: s.mediaGradient ?? "linear-gradient(135deg,#2a9d8f,#e85d4c)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="mb-2 flex items-center gap-2">
                    <UserAvatar
                      initials={s.author.avatarInitials}
                      color={s.author.avatarColor}
                      size="sm"
                    />
                    <span className="text-sm font-semibold">@{s.author.handle}</span>
                  </div>
                  <p className="font-display text-lg leading-snug">{s.body}</p>
                  <p className="mt-2 text-xs text-white/70">
                    Signal {s.signal} · {s.mediaLabel}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
