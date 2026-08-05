import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Boards() {
  const { data: boards = [] } = trpc.social.boards.useQuery();

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl md:text-4xl">Boards</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Sammlungen wie bei Pinterest — verbunden mit dem Signal „Collect“. Speichern ohne Timeline
        zu verstopfen.
      </p>

      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {boards.map((b) => (
          <article
            key={b.id}
            className="mb-4 break-inside-avoid overflow-hidden rounded-2xl mist-panel"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={b.cover} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <h2 className="font-display text-xl">{b.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                <Link href={`/profil/${b.owner?.handle}`} className="hover:text-primary">
                  {b.owner?.displayName}
                </Link>
                {" · "}
                {b.itemCount} Elemente
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
