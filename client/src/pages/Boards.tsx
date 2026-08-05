import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/PostCard";
import { toast } from "sonner";
import { Plus, ArrowLeft } from "lucide-react";

export default function Boards() {
  const params = useParams<{ id?: string }>();
  const boardId = params.id ? Number(params.id) : undefined;
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");

  const mine = trpc.boards.mine.useQuery(undefined, { enabled: isAuthenticated && !boardId });
  const detail = trpc.boards.get.useQuery(
    { id: boardId! },
    { enabled: Number.isFinite(boardId) }
  );
  const create = trpc.boards.create.useMutation({
    onSuccess: (res) => {
      setName("");
      utils.boards.mine.invalidate();
      toast.success("Board erstellt");
      window.location.href = `/boards/${res.id}`;
    },
  });

  if (boardId && Number.isFinite(boardId)) {
    if (detail.isLoading) {
      return (
        <div className="container py-8">
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      );
    }
    if (!detail.data) {
      return <div className="container py-16 text-center">Board nicht gefunden.</div>;
    }
    return (
      <div className="container py-8 max-w-2xl space-y-6">
        <Link
          href="/boards"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Boards
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold">{detail.data.board.name}</h1>
          {detail.data.board.description && (
            <p className="text-muted-foreground mt-1">{detail.data.board.description}</p>
          )}
        </div>
        <div className="space-y-5">
          {detail.data.items.map((row) => (
            <PostCard
              key={row.item.id}
              item={{
                post: row.post,
                author: row.author,
                circle: null,
              }}
            />
          ))}
          {detail.data.items.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Noch leer — speichere Posts über das Lesezeichen.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold">Boards</h1>
        <p className="text-muted-foreground">Sammlungen à la Pinterest — nach dem Login.</p>
        <Button asChild>
          <a href={getLoginUrl()}>Anmelden</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Boards</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bewusst speichern, was bleiben soll — nicht alles archivieren.
        </p>
      </div>

      <form
        className="atmosphere-panel rounded-2xl p-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create.mutate({ name: name.trim() });
        }}
      >
        <Input
          placeholder="Neues Board…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending || !name.trim()} className="gap-1">
          <Plus className="h-4 w-4" />
          Anlegen
        </Button>
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {mine.isLoading && <Skeleton className="h-24 rounded-2xl" />}
        {mine.data?.map((b) => (
          <Link
            key={b.id}
            href={`/boards/${b.id}`}
            className="atmosphere-panel rounded-2xl p-5 hover:scale-[1.01] transition-transform"
          >
            <h2 className="font-display font-semibold">{b.name}</h2>
            {b.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
            )}
          </Link>
        ))}
        {!mine.isLoading && mine.data?.length === 0 && (
          <p className="text-muted-foreground sm:col-span-2 text-center py-6">
            Noch keine Boards — leg das erste an.
          </p>
        )}
      </div>
    </div>
  );
}
