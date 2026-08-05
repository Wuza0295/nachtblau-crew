import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { LENSES, INTENTS, type LensId, type IntentId } from "@/lib/site";
import PostCard from "@/components/PostCard";
import Composer from "@/components/Composer";
import { AvatarOrb } from "@/components/PostCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type Mode = "for-you" | "following" | "latest";

export default function Feed() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialLens = (params.get("lens") as LensId | null) ?? "all";
  const [lens, setLens] = useState<LensId | "all">(
    initialLens === "all" || LENSES.some((l) => l.id === initialLens) ? (initialLens as LensId | "all") : "all"
  );
  const [mode, setMode] = useState<Mode>("for-you");

  const utils = trpc.useUtils();
  const algo = trpc.social.algorithm.useQuery();
  const setIntent = trpc.social.setIntent.useMutation({
    onSuccess: () => {
      utils.social.algorithm.invalidate();
      utils.social.feed.invalidate();
    },
  });

  const feed = trpc.social.feed.useQuery({
    lens: lens === "vault" ? "vault" : lens,
    mode,
    intent: (algo.data?.intent as IntentId) ?? "browse",
    limit: 24,
  });
  const stories = trpc.social.stories.useQuery();
  const trending = trpc.social.trending.useQuery();

  const intent = (algo.data?.intent as IntentId) ?? "browse";

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold">Feed</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Intent: <span className="text-foreground font-medium capitalize">{intent}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["for-you", "following", "latest"] as Mode[]).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? "default" : "ghost"}
                  className="rounded-full capitalize"
                  onClick={() => setMode(m)}
                >
                  {m === "for-you" ? "For You" : m === "following" ? "Following" : "Latest"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {stories.data?.map((story) => (
              <div key={story.id} className="shrink-0 w-20 text-center">
                <div className="mx-auto p-[2px] rounded-full bg-gradient-to-br from-primary to-accent">
                  <div className="rounded-full bg-background p-0.5">
                    <AvatarOrb name={story.author.name} color={story.author.avatarColor} size="md" />
                  </div>
                </div>
                <div className="mt-1 text-[11px] truncate text-muted-foreground">
                  @{story.author.handle}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setLens("all")}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                lens === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border"
              }`}
            >
              Alle
            </button>
            {LENSES.filter((l) => l.id !== "motion" && l.id !== "circles" && l.id !== "vault").map((l) => (
              <button
                key={l.id}
                onClick={() => setLens(l.id)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  lens === l.id ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {INTENTS.map((item) => (
              <button
                key={item.id}
                onClick={() => setIntent.mutate({ intent: item.id })}
                className={`text-left text-xs px-3 py-2 rounded-2xl border max-w-[160px] transition ${
                  intent === item.id
                    ? "border-accent bg-accent/20"
                    : "border-border hover:border-primary/40"
                }`}
                title={item.blurb}
              >
                <div className="font-semibold">{item.label}</div>
                <div className="text-muted-foreground line-clamp-2 mt-0.5">{item.blurb}</div>
              </button>
            ))}
          </div>

          <Composer defaultLenses={lens === "all" ? ["pulse"] : [lens as LensId]} />

          <div className="space-y-4">
            {feed.isLoading && <div className="text-muted-foreground">Lade Spektrum…</div>}
            {feed.data?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <div className="aether-shell rounded-2xl p-4">
            <h2 className="font-display font-semibold">Trending</h2>
            <ul className="mt-3 space-y-2">
              {trending.data?.map((t) => (
                <li key={t.tag} className="flex justify-between text-sm">
                  <span className="text-primary">#{t.tag}</span>
                  <span className="text-muted-foreground">{t.score}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="aether-shell rounded-2xl p-4">
            <h2 className="font-display font-semibold">Schnellwege</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/motion" className="hover:text-primary">
                Motion Discovery →
              </Link>
              <Link href="/circles" className="hover:text-primary">
                Circles beitreten →
              </Link>
              <Link href="/vault" className="hover:text-primary">
                Vault öffnen →
              </Link>
              <Link href="/algorithm" className="hover:text-primary">
                Algorithmus justieren →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
