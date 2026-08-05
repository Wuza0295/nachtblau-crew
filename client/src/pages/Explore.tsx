import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { AvatarOrb } from "@/components/PostCard";
import { LENSES } from "@/lib/site";

export default function Explore() {
  const profiles = trpc.social.profiles.useQuery();
  const trending = trpc.social.trending.useQuery();
  const circles = trpc.social.circles.useQuery();

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold">Explore</h1>
      <p className="mt-2 text-muted-foreground">Menschen, Themen und Circles entdecken.</p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Linsen</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LENSES.map((lens) => (
            <Link key={lens.id} href={lens.href} className="aether-shell rounded-2xl p-4 block hover:border-primary/40 border border-transparent">
              <div className="text-xs uppercase tracking-[0.16em] text-primary">{lens.from}</div>
              <div className="font-display text-xl font-semibold mt-1">{lens.label}</div>
              <p className="text-sm text-muted-foreground mt-1">{lens.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Menschen</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.data?.map((p) => (
            <Link key={p.id} href={`/profil/${p.handle}`} className="aether-shell rounded-2xl p-4 flex gap-3">
              <AvatarOrb name={p.name} color={p.avatarColor} />
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-sm text-muted-foreground">@{p.handle}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-xl font-semibold">Topics</h2>
          <ul className="mt-4 space-y-2">
            {trending.data?.map((t) => (
              <li key={t.tag} className="flex justify-between aether-shell rounded-xl px-4 py-3">
                <span className="text-primary font-medium">#{t.tag}</span>
                <span className="text-muted-foreground text-sm">{t.score}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Circles</h2>
          <ul className="mt-4 space-y-2">
            {circles.data?.map((c) => (
              <Link key={c.id} href={`/circles/${c.slug}`} className="block aether-shell rounded-xl px-4 py-3">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.topic}</div>
              </Link>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
