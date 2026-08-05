import { Slider } from "@/components/ui/slider";
import { Shield } from "lucide-react";

export default function IntensityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const labels = ["Ruhig", "Sanft", "Normal", "Lebhaft", "Wild", "Max"];
  return (
    <div className="rounded-2xl border border-white/10 bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-[oklch(0.72_0.18_310)]" />
        Feed-Intensität
        <span className="ml-auto text-xs text-muted-foreground font-normal">
          {labels[value]} · 0–5
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Transparente Stufen statt Blackbox: Filtert laute oder hektische Inhalte — inspiriert von
        modernen Multi-Feed-Plattformen.
      </p>
      <Slider
        value={[value]}
        min={0}
        max={5}
        step={1}
        onValueChange={(v) => onChange(v[0] ?? 5)}
        className="py-2"
      />
    </div>
  );
}
