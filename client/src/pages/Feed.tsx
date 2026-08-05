import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { FeedLens } from "@shared/brand";
import PostCard from "@/components/social/PostCard";
import MomentRail from "@/components/social/MomentRail";
import AlgorithmDial from "@/components/social/AlgorithmDial";
import ComposeBox from "@/components/social/ComposeBox";
import LensSwitcher from "@/components/social/LensSwitcher";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio } from "lucide-react";

export default function Feed() {
  const [lens, setLens] = useState<FeedLens | "all">("pulse");
  const { data: prefs } = trpc.social.preferences.useQuery();
  const { data: feed, isLoading } = trpc.social.feed.useQuery({
    lens,
    mix: prefs?.algorithmMix,
  });
  const { data: rooms = [] } = trpc.social.rooms.useQuery();
  const { data: circles = [] } = trpc.social.circles.useQuery();

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl">Feed</h1>
        <p className="mt-1 text-muted-foreground">Moments oben · Linsen darunter · Regler rechts</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <MomentRail />
          <LensSwitcher value={lens} onChange={setLens} />
          <ComposeBox defaultLens={lens === "all" ? "pulse" : lens} />

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          )}

          <div className="space-y-4">
            {feed?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <AlgorithmDial />

          <div className="mist-panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <h3 className="font-display text-base">Live Rooms</h3>
            </div>
            <ul className="mt-3 space-y-3">
              {rooms.map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.circle?.name} · {r.listeners} zuhören
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mist-panel rounded-2xl p-4">
            <h3 className="font-display text-base">Deine Kreise</h3>
            <ul className="mt-3 space-y-2">
              {circles
                .filter((c) => c.joined)
                .map((c) => (
                  <li key={c.id}>
                    <Link href={`/kreise/${c.slug}`} className="text-sm hover:text-primary">
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
