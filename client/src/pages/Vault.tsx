import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import PostCard from "@/components/PostCard";

export default function Vault() {
  const collections = trpc.social.collections.useQuery();

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold">Vault</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Pinterest-Gedächtnis: Sammlungen, die bleiben — jenseits des flüchtigen Feeds.
      </p>

      <div className="mt-8 columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
        {collections.data?.map((col) => (
          <Link key={col.id} href={`/vault/${col.id}`} className="block break-inside-avoid">
            <div className="relative overflow-hidden rounded-2xl group">
              <img
                src={col.coverUrl}
                alt=""
                className="w-full aspect-[4/5] object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="font-display text-xl font-semibold">{col.title}</h2>
                <p className="text-sm text-white/80 mt-1 line-clamp-2">{col.description}</p>
                <p className="text-xs mt-2 text-white/70">
                  @{col.author.handle} · {col.itemCount} Items
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CollectionDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const collection = trpc.social.collection.useQuery(
    { id },
    { enabled: Number.isFinite(id) }
  );

  if (collection.isLoading) return <div className="container py-8">Lade Sammlung…</div>;
  if (!collection.data) return <div className="container py-8">Nicht gefunden.</div>;
  const c = collection.data;

  return (
    <div className="container py-8">
      <Link href="/vault" className="text-sm text-muted-foreground hover:text-foreground">
        ← Vault
      </Link>
      <div className="mt-4 grid md:grid-cols-[280px_1fr] gap-8">
        <div>
          <img src={c.coverUrl} alt="" className="rounded-2xl aspect-[4/5] object-cover w-full" />
          <h1 className="font-display text-3xl font-bold mt-4">{c.title}</h1>
          <p className="text-muted-foreground mt-2">{c.description}</p>
          <p className="text-sm mt-3">
            von{" "}
            <Link href={`/profil/${c.author.handle}`} className="text-primary">
              @{c.author.handle}
            </Link>
          </p>
        </div>
        <div className="space-y-4">
          {c.posts.map((post) =>
            post ? <PostCard key={post.id} post={post as never} /> : null
          )}
        </div>
      </div>
    </div>
  );
}
