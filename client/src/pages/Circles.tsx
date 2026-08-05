import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Circles() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.circle.list.useQuery({});
  const directory = trpc.profile.directory.useQuery();
  const setTier = trpc.circle.set.useMutation({
    onSuccess: () => {
      utils.circle.list.invalidate();
      toast.success("Kreis aktualisiert");
    },
    onError: (e) => toast.error(e.message),
  });

  const inner = data?.members.filter((m) => m.tier === "inner") ?? [];
  const orbit = data?.members.filter((m) => m.tier === "orbit") ?? [];

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2 animate-rise">
          Dein Kreis
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed animate-rise">
          Innenkreis max. 12 — wie Close Friends und BeReal. Orbit ist deine bewusste Timeline.
          Demo zeigt Milas Kreis.
        </p>

        <div className="mb-6 flex items-center gap-3 text-sm">
          <span className="font-display text-2xl font-bold text-primary">
            {data?.innerCount ?? 0}
          </span>
          <span className="text-muted-foreground">/ {data?.innerLimit ?? 12} im Innenkreis</span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.min(100, ((data?.innerCount ?? 0) / (data?.innerLimit ?? 12)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <section className="mb-10">
              <h2 className="font-display text-lg font-semibold mb-4">Innenkreis</h2>
              <ul className="space-y-3">
                {inner.map((m) => (
                  <PersonRow key={m.id} member={m.member} tier="inner" />
                ))}
                {inner.length === 0 && (
                  <p className="text-sm text-muted-foreground">Noch leer — wähle bewusst.</p>
                )}
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-lg font-semibold mb-4">Orbit</h2>
              <ul className="space-y-3">
                {orbit.map((m) => (
                  <PersonRow key={m.id} member={m.member} tier="orbit" />
                ))}
              </ul>
            </section>
          </>
        )}

        {isAuthenticated && directory.data && (
          <section className="pt-8 border-t border-border">
            <h2 className="font-display text-lg font-semibold mb-4">Menschen hinzufügen</h2>
            <ul className="space-y-3">
              {directory.data
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <Link href={`/profil/${u.id}`} className="flex items-center gap-3 min-w-0">
                      <img src={u.avatar ?? ""} alt="" className="h-9 w-9 rounded-full bg-muted" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.handle}</p>
                      </div>
                    </Link>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs"
                        disabled={setTier.isPending}
                        onClick={() => setTier.mutate({ memberId: u.id, tier: "inner" })}
                      >
                        Nah
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs"
                        disabled={setTier.isPending}
                        onClick={() => setTier.mutate({ memberId: u.id, tier: "orbit" })}
                      >
                        Orbit
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-8">
            <a href={getLoginUrl()} className="underline">
              Anmelden
            </a>
            , um deinen eigenen Kreis zu pflegen.
          </p>
        )}
      </div>
    </div>
  );
}

function PersonRow({
  member,
  tier,
}: {
  member: {
    id: number;
    name: string | null;
    handle?: string | null;
    avatar: string | null;
    vibe?: string | null;
  };
  tier: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <Link href={`/profil/${member.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <span className="relative">
          <img
            src={member.avatar ?? ""}
            alt=""
            className="h-11 w-11 rounded-full bg-muted object-cover"
          />
          {tier === "inner" && (
            <span className="absolute -inset-0.5 rounded-full border-2 border-accent/60 animate-soft-pulse pointer-events-none" />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-medium truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {member.vibe ?? `@${member.handle}`}
          </p>
        </div>
      </Link>
    </li>
  );
}
