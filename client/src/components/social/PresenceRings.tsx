import { trpc } from "@/lib/trpc";

export function PresenceRings() {
  const { data: people = [] } = trpc.social.presence.useQuery();

  if (!people.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Presence Rings
        </h2>
        <p className="text-xs text-muted-foreground/80 mt-0.5">
          Nähe aus echten Interaktionen — nicht aus Follower-Zahlen.
        </p>
      </div>
      <div className="relative mx-auto h-56 w-56">
        <div className="absolute inset-0 rounded-full border border-border/40" />
        <div className="absolute inset-6 rounded-full border border-border/30" />
        <div className="absolute inset-12 rounded-full border border-primary/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-display text-primary">
            Du
          </div>
        </div>
        {people.slice(0, 6).map((p, i) => {
          const angle = (i / Math.min(people.length, 6)) * Math.PI * 2 - Math.PI / 2;
          const ring = p.closeness > 80 ? 58 : p.closeness > 55 ? 78 : 98;
          const x = Math.cos(angle) * ring;
          const y = Math.sin(angle) * ring;
          return (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              title={`${p.name} · Nähe ${p.closeness}`}
            >
              <img
                src={p.avatar}
                alt={p.name}
                className="h-9 w-9 rounded-full object-cover border-2 border-background shadow-md"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
