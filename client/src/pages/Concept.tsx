import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { SITE } from "@shared/site";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Concept() {
  const { data, isLoading } = trpc.meta.concept.useQuery();

  return (
    <div className="mist-bg min-h-[70vh]">
      <div className="container max-w-2xl py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Warum {SITE.name} existiert
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-4 animate-rise">
          {data?.manifesto.title ?? "Distanz statt Algorithmus"}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 animate-rise">
          {SITE.pitch} Recherche 2025/26 zeigt: Menschen wollen Weg von Engagement-Fallen hin zu
          Nähe, Chronologie und transparenter Entdeckung — ohne sechs Apps parallel.
        </p>

        {isLoading && <Skeleton className="h-48 w-full" />}

        <ol className="space-y-6 mb-14">
          {data?.manifesto.points.map((point, i) => (
            <li key={i} className="flex gap-4 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="font-display text-primary/40 font-bold text-lg w-8 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="leading-relaxed">{point}</p>
            </li>
          ))}
        </ol>

        <section className="mb-14">
          <h2 className="font-display text-xl font-semibold mb-4">Was wir von wem genommen haben</h2>
          <dl className="space-y-4 text-sm">
            {(data?.frequencies ?? []).map((f) => (
              <div key={f.id} className="grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-4">
                <dt className="font-medium">{f.label}</dt>
                <dd className="text-muted-foreground">
                  {f.description} <span className="opacity-70">← {f.inspiredBy}</span>
                </dd>
              </div>
            ))}
            {(data?.formats ?? []).map((f) => (
              <div key={f.id} className="grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-4">
                <dt className="font-medium">{f.label}</dt>
                <dd className="text-muted-foreground">
                  {f.description} <span className="opacity-70">← {f.inspiredBy}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="p-6 rounded-2xl bg-primary text-primary-foreground mb-10">
          <h2 className="font-display text-xl font-semibold mb-2">Arbeitstitel</h2>
          <p className="opacity-90 leading-relaxed text-sm">
            Der Name <strong>{SITE.name}</strong> ist vorläufig. Der finale Name kommt im
            Nachhinein — Branding, Domain und Markenrecht bleiben offen. Die Idee steht.
          </p>
        </section>

        <Button asChild className="rounded-full px-6">
          <Link href="/feed">Feed ausprobieren</Link>
        </Button>
      </div>
    </div>
  );
}
