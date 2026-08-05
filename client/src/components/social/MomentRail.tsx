import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export function MomentRail() {
  const { data: moments = [], isLoading } = trpc.social.moments.useQuery();
  const utils = trpc.useUtils();
  const resonate = trpc.social.momentResonance.useMutation({
    onSuccess: () => utils.social.moments.invalidate(),
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 w-20 rounded-full bg-muted animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-thin">
      <Link
        href="/compose?kind=moment"
        className="shrink-0 flex flex-col items-center gap-1.5 group"
      >
        <div className="h-20 w-20 rounded-full border border-dashed border-primary/50 flex items-center justify-center text-primary text-2xl group-hover:bg-primary/10 transition-colors">
          +
        </div>
        <span className="text-xs text-muted-foreground">Dein Moment</span>
      </Link>

      {moments.map((m) => {
        const nearCrystal = m.resonance >= m.crystallizeThreshold * 0.75;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => resonate.mutate({ id: m.id })}
            className="shrink-0 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`relative h-20 w-20 rounded-full p-[3px] ${
                nearCrystal
                  ? "bg-gradient-to-br from-primary via-amber-200 to-teal-400 animate-moment-pulse"
                  : "bg-gradient-to-br from-teal-500/80 to-primary/80"
              }`}
            >
              <Avatar className="h-full w-full border-2 border-background">
                <AvatarImage src={m.mediaUrl} alt={m.caption} className="object-cover" />
                <AvatarFallback>{m.author.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-muted-foreground max-w-[5rem] truncate">
              {m.author.handle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
