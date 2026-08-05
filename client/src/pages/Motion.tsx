import { trpc } from "@/lib/trpc";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { useState } from "react";
import { AvatarOrb } from "@/components/PostCard";
import { Link } from "wouter";

export default function Motion() {
  const feed = trpc.social.motionFeed.useQuery();
  const utils = trpc.useUtils();
  const likeMut = trpc.social.like.useMutation({
    onSuccess: () => utils.social.motionFeed.invalidate(),
  });
  const saveMut = trpc.social.save.useMutation({
    onSuccess: () => utils.social.motionFeed.invalidate(),
  });
  const [index, setIndex] = useState(0);
  const items = feed.data ?? [];
  const current = items[index];

  function next() {
    if (!items.length) return;
    setIndex((i) => (i + 1) % items.length);
  }
  function prev() {
    if (!items.length) return;
    setIndex((i) => (i - 1 + items.length) % items.length);
  }

  return (
    <div className="container py-6 max-w-xl">
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold">Motion</h1>
        <p className="text-sm text-muted-foreground">
          TikTok-Energie, aber im selben Spektrum — Swipe mit Pfeilen oder Buttons.
        </p>
      </div>

      {!current && <div className="text-muted-foreground">Keine Motion-Clips geladen.</div>}

      {current && (
        <div className="relative rounded-[1.75rem] overflow-hidden bg-[oklch(0.18_0.03_240)] text-white shadow-2xl aspect-[9/16] max-h-[78vh]">
          <img
            src={current.mediaUrls[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

          <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
            <Link href={`/profil/${current.author.handle}`}>
              <AvatarOrb name={current.author.name} color={current.author.avatarColor} />
            </Link>
            <div>
              <div className="font-semibold">@{current.author.handle}</div>
              <div className="text-xs text-white/70">{current.author.role}</div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-20 p-5">
            <p className="text-[15px] leading-relaxed">{current.body}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-white/80">
              {current.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          </div>

          <div className="absolute right-3 bottom-24 flex flex-col gap-4 items-center">
            <button
              className="grid place-items-center h-12 w-12 rounded-full bg-white/15 backdrop-blur"
              onClick={() => likeMut.mutate({ postId: current.id })}
            >
              <Heart className={`h-5 w-5 ${current.liked ? "fill-rose-400 text-rose-400" : ""}`} />
              <span className="text-[10px] mt-0.5">{current.likeCount}</span>
            </button>
            <Link
              href={`/post/${current.id}`}
              className="grid place-items-center h-12 w-12 rounded-full bg-white/15 backdrop-blur"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{current.replyCount}</span>
            </Link>
            <button
              className="grid place-items-center h-12 w-12 rounded-full bg-white/15 backdrop-blur"
              onClick={() => saveMut.mutate({ postId: current.id })}
            >
              <Bookmark className={`h-5 w-5 ${current.saved ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="absolute inset-y-0 left-0 w-1/3" onClick={prev} />
          <div className="absolute inset-y-0 right-0 w-1/3" onClick={next} />
        </div>
      )}

      <div className="mt-4 flex justify-center gap-3">
        <button onClick={prev} className="px-4 py-2 rounded-full border border-border text-sm">
          Zurück
        </button>
        <button onClick={next} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">
          Weiter
        </button>
      </div>
    </div>
  );
}
