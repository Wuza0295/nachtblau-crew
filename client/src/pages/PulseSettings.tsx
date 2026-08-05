import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PULSE_TOPICS } from "@shared/site";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PulseSettings() {
  const { isAuthenticated } = useAuth();
  const { data: dials, isLoading } = trpc.pulse.getDials.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  const setAll = trpc.pulse.setAll.useMutation({
    onSuccess: () => {
      utils.pulse.getDials.invalidate();
      utils.feed.get.invalidate();
      toast.success("Pulse gespeichert — Feed aktualisiert");
    },
  });

  const [local, setLocal] = useState<Record<string, number> | null>(null);

  const values =
    local ??
    Object.fromEntries(
      PULSE_TOPICS.map((t) => [
        t.id,
        dials?.find((d) => d.topic === t.id)?.weight ?? 40,
      ])
    );

  if (!isAuthenticated) {
    return (
      <div className="container py-16 max-w-lg text-center space-y-4">
        <h1 className="font-display text-3xl font-bold">Pulse-Dials</h1>
        <p className="text-muted-foreground">
          Melde dich an, um deinen Algorithmus selbst zu steuern.
        </p>
        <Button asChild>
          <a href={getLoginUrl()}>Anmelden</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-xl space-y-8">
      <div className="space-y-2">
        <Link href="/feed" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Zurück zum Pulse
        </Link>
        <h1 className="font-display text-3xl font-bold">Pulse-Dials</h1>
        <p className="text-muted-foreground">
          Dreh die Regler. Dein Feed folgt — ohne Black Box. Resonanz justiert sie zusätzlich mit.
        </p>
      </div>

      <div className="atmosphere-panel rounded-2xl p-6 space-y-6">
        {isLoading && <p className="text-sm text-muted-foreground">Lade Dials…</p>}
        {PULSE_TOPICS.map((t) => (
          <div key={t.id} className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t.label}</span>
              <span className="tabular-nums text-muted-foreground">{values[t.id]}%</span>
            </div>
            <Slider
              value={[values[t.id]]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) =>
                setLocal((prev) => ({
                  ...(prev ?? values),
                  [t.id]: v,
                }))
              }
            />
          </div>
        ))}
      </div>

      <Button
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={setAll.isPending}
        onClick={() =>
          setAll.mutate({
            dials: PULSE_TOPICS.map((t) => ({
              topic: t.id,
              weight: values[t.id],
            })),
          })
        }
      >
        Pulse übernehmen
      </Button>
    </div>
  );
}
