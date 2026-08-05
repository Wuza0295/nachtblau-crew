import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MiraShell } from "@/components/mira/MiraShell";
import { Sparkles, Plus } from "lucide-react";

export default function RecipesPage() {
  const utils = trpc.useUtils();
  const { data: recipes } = trpc.mira.recipes.useQuery();
  const setActive = trpc.mira.setActiveRecipe.useMutation({
    onSuccess: () => utils.mira.recipes.invalidate(),
  });
  const create = trpc.mira.createRecipe.useMutation({
    onSuccess: () => {
      utils.mira.recipes.invalidate();
      setOpen(false);
      setForm({ name: "", intent: "", description: "" });
    },
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", intent: "", description: "" });

  return (
    <MiraShell>
      <div className="flex items-start justify-between gap-4 mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl font-700 tracking-tight flex items-center gap-2">
            <Sparkles className="size-7 text-[var(--mira-gold)]" />
            Feed-Rezepte
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Wie Bluesky Custom Feeds – nur verständlicher. Du formulierst die
            Absicht, MIRA baut den Feed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mira-jade)] text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          <Plus className="size-4" /> Neu
        </button>
      </div>

      <div className="space-y-4">
        {recipes?.map((r, i) => (
          <article
            key={r.id}
            className={`glass rounded-2xl p-5 fade-up ${
              r.active ? "ring-2 ring-[var(--mira-jade)]/40" : ""
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-600">{r.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {r.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActive.mutate({ id: r.active ? null : r.id })
                }
                className={`shrink-0 text-sm px-3 py-1.5 rounded-full ${
                  r.active
                    ? "bg-[var(--mira-jade)] text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                {r.active ? "Aktiv" : "Aktivieren"}
              </button>
            </div>
            <blockquote className="mt-4 text-sm border-l-2 border-[var(--mira-jade)] pl-3 italic text-[var(--mira-slate)]">
              „{r.intent}“
            </blockquote>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {r.sources.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-secondary">
                  {s}
                </span>
              ))}
              {r.preferKinds.map((k) => (
                <span
                  key={k}
                  className="px-2 py-0.5 rounded-full bg-[var(--mira-jade)]/12 text-[var(--mira-jade)]"
                >
                  {k}
                </span>
              ))}
              {r.includeTags.map((t) => (
                <span key={t} className="text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-[var(--mira-ink)]/40 backdrop-blur-sm grid place-items-center p-4">
          <form
            className="glass-strong rounded-2xl p-6 w-full max-w-md space-y-4 fade-up"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({
                name: form.name,
                description: form.description || "Eigenes Rezept",
                intent: form.intent,
                sources: ["village", "circles"],
                includeTags: [],
                excludeTags: [],
                preferKinds: ["signal", "frame"],
              });
            }}
          >
            <h3 className="font-display text-xl font-600">Neues Rezept</h3>
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
            <textarea
              required
              placeholder="Deine Absicht in einem Satz…"
              value={form.intent}
              onChange={(e) => setForm({ ...form, intent: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none"
            />
            <input
              placeholder="Kurzbeschreibung (optional)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm rounded-full hover:bg-secondary"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm rounded-full bg-[var(--mira-jade)] text-primary-foreground font-medium"
              >
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </MiraShell>
  );
}
